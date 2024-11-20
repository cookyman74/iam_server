// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { UsersService } from '../users/users.service';
import { TokenResponse, OAuthProfile } from './types';
import { JwtPayload } from './jwt/jwt.service';
import { Provider } from './enums/provider.enum';

@Injectable()
export class AuthService {
  private readonly strategies: Map<Provider, any>;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly kakaoStrategy: KakaoStrategy,
    private readonly naverStrategy: NaverStrategy,
    private readonly appleStrategy: AppleStrategy,
  ) {
    this.strategies = new Map([
      [Provider.KAKAO, kakaoStrategy],
      [Provider.NAVER, naverStrategy],
      [Provider.APPLE, appleStrategy],
    ]);
  }

  /**
   * OAuth 인증 URL 생성
   * @param provider OAuth 제공자 (예: KAKAO, NAVER)
   * @param state CSRF 방지를 위한 상태값 (선택적)
   * @returns 인증 URL
   */
  async generateAuthUrl(provider: Provider, state?: string): Promise<string> {
    try {
      const strategy = this.getStrategy(provider);
      return strategy.generateAuthUrl(state);
    } catch (error) {
      throw new BadRequestException(`Failed to generate auth URL.`);
    }
  }

  /**
   * OAuth 콜백 처리
   * @param code OAuth 인증 코드
   * @param provider OAuth 제공자
   * @param state CSRF 방지 상태값 (선택적)
   * @returns JWT 액세스 토큰 및 리프레시 토큰
   */
  async handleOAuthCallback(
    code: string,
    provider: Provider,
    state?: string,
  ): Promise<TokenResponse> {
    try {
      const strategy = this.getStrategy(provider);

      const oauthTokens = await strategy.getTokens(code);
      const profile = await strategy.getUserProfile(oauthTokens.access_token);

      const user = await this.usersService.findOrCreateByOAuth(
        provider,
        profile as OAuthProfile,
      );

      await this.usersService.upsertOAuthToken(user.id, provider, {
        accessToken: oauthTokens.access_token,
        refreshToken: oauthTokens.refresh_token,
        expiresAt: new Date(Date.now() + oauthTokens.expires_in * 1000),
        scope: oauthTokens.scope,
      });

      return this.createTokens(user, provider);
    } catch (error) {
      throw new UnauthorizedException('OAuth callback processing failed.');
    }
  }

  /**
   * 토큰 갱신
   * @param refreshToken 리프레시 토큰
   * @returns 새 액세스 토큰 및 리프레시 토큰
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = await this.verifyToken(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          oauthTokens: {
            where: { provider: payload.provider },
          },
        },
      });

      if (!user || !user.oauthTokens?.[0]) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const oauthToken = user.oauthTokens[0];
      const strategy = this.getStrategy(payload.provider);

      const newOAuthTokens = await strategy.refreshToken(
        oauthToken.refreshToken,
      );

      await this.usersService.upsertOAuthToken(user.id, payload.provider, {
        accessToken: newOAuthTokens.access_token,
        refreshToken: newOAuthTokens.refresh_token,
        expiresAt: new Date(Date.now() + newOAuthTokens.expires_in * 1000),
        scope: newOAuthTokens.scope,
      });

      return this.createTokens(user, payload.provider);
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed.');
    }
  }

  /**
   * 사용자 정보 조회
   * @param token 액세스 토큰
   * @returns 사용자 프로필
   */
  async getUserInfo(token: string): Promise<any> {
    try {
      const payload = await this.verifyToken(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          oauthTokens: {
            where: { provider: payload.provider },
          },
        },
      });

      if (!user || !user.oauthTokens?.[0]) {
        throw new UnauthorizedException('User not found.');
      }

      const strategy = this.getStrategy(payload.provider);
      return strategy.getUserProfile(user.oauthTokens[0].accessToken);
    } catch (error) {
      throw new UnauthorizedException('Failed to fetch user info.');
    }
  }

  /**
   * JWT 토큰 생성
   * @param user 사용자 데이터
   * @param provider OAuth 제공자
   * @returns 생성된 JWT 토큰
   */
  private async createTokens(
    user: any,
    provider: Provider,
  ): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      provider,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        {
          expiresIn: this.configService.get<string>(
            'auth.jwt.accessExpiration',
            '15m',
          ),
        },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          expiresIn: this.configService.get<string>(
            'auth.jwt.refreshExpiration',
            '7d',
          ),
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: parseInt(
        this.configService.get<string>('auth.jwt.accessExpiration', '900'),
      ),
      token_type: 'Bearer',
    };
  }

  /**
   * JWT 토큰 검증
   * @param token 검증할 토큰
   * @returns 검증된 JWT 페이로드
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  /**
   * OAuth 전략 조회
   * @param provider OAuth 제공자
   * @returns 해당 제공자의 전략
   */
  private getStrategy(provider: Provider) {
    const strategy = this.strategies.get(provider);
    if (!strategy) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    return strategy;
  }
}
