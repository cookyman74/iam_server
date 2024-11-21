// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { UsersService } from '../users/users.service';
import { OAuthProfile } from './interfaces/oauth-profile.interface';
import { TokenResponse, JwtPayload } from './types';
import { Provider } from './enums/provider.enum';
import { BaseOAuthStrategy } from './strategies/base.strategy';

@Injectable()
export class AuthService {
  private readonly strategies: Map<Provider, BaseOAuthStrategy>;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly kakaoStrategy: KakaoStrategy,
    private readonly naverStrategy: NaverStrategy,
    private readonly appleStrategy: AppleStrategy,
  ) {
    this.strategies = new Map<Provider, BaseOAuthStrategy>([
      [Provider.KAKAO, kakaoStrategy],
      [Provider.NAVER, naverStrategy],
      [Provider.APPLE, appleStrategy],
    ]);
  }

  /**
   * 토큰 검증 메서드
   * @param token - 검증할 JWT 토큰
   * @returns 검증 결과 (true/false)
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch (error) {
      throw new UnauthorizedException(`Invalid token: ${error}`);
    }
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
      throw new BadRequestException(`Failed to generate auth URL.: ${error}`);
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
      // 1. 상태값 검증 (선택적으로 사용)
      if (state && state !== 'expected-state-value') {
        throw new UnauthorizedException('Invalid state parameter');
      }

      // 2. 적절한 OAuth 전략 가져오기
      const strategy = this.getStrategy(provider);

      // 3. OAuth 토큰 획득
      const oauthTokens = await strategy.getTokens(code);

      // 4. 사용자 프로필 가져오기
      const profile = await strategy.getUserProfile(oauthTokens.access_token);

      // 5. 사용자 찾기 또는 생성
      const user = await this.usersService.findOrCreateByOAuth(
        provider,
        profile as OAuthProfile,
      );

      // 6. OAuth 토큰 저장
      await this.usersService.upsertOAuthToken({
        userId: user.id,
        provider,
        accessToken: oauthTokens.access_token,
        refreshToken: oauthTokens.refresh_token,
        expiresAt: new Date(Date.now() + oauthTokens.expires_in * 1000),
        scope: oauthTokens.scope?.split(','), // scope 문자열을 배열로 변환
      });

      // 7. JWT 토큰 생성
      return this.createTokens(user, provider);
    } catch (error) {
      throw new UnauthorizedException(
        `OAuth callback processing failed: ${error.message}`,
      );
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

      const provider = payload.provider as Provider;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          tokens: {
            where: { provider },
          },
        },
      });

      if (!user || !user.tokens?.[0]) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const oauthToken = user.tokens[0];
      const strategy = this.getStrategy(provider);

      const newOAuthTokens = await strategy.refreshToken(
        oauthToken.refreshToken,
      );

      await this.usersService.upsertOAuthToken({
        userId: user.id,
        provider,
        accessToken: newOAuthTokens.access_token,
        refreshToken: newOAuthTokens.refresh_token,
        expiresAt: new Date(Date.now() + newOAuthTokens.expires_in * 1000),
        scope: newOAuthTokens.scope?.split(','), // scope가 문자열인 경우 분리
      });

      return this.createTokens(user, provider);
    } catch (error) {
      throw new UnauthorizedException(`Token refresh failed.: ${error}`);
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

      // `Provider` 타입으로 변환
      const provider = payload.provider as Provider;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          tokens: {
            where: { provider },
          },
        },
      });

      if (!user || !user.tokens?.[0]) {
        throw new UnauthorizedException('User not found.');
      }

      const strategy = this.getStrategy(provider);
      return strategy.getUserProfile(user.tokens[0].accessToken);
    } catch (error) {
      throw new UnauthorizedException(`Failed to fetch user info.: ${error}`);
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
    // 공통 페이로드 생성
    const basePayload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      provider,
    };

    // JWT 액세스 및 리프레시 토큰 생성
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, type: 'access' }, // 액세스 토큰의 타입 추가
        {
          expiresIn: this.configService.get<string>(
            'auth.jwt.accessExpiration',
            '15m',
          ),
        },
      ),
      this.jwtService.signAsync(
        { ...basePayload, type: 'refresh' }, // 리프레시 토큰의 타입 추가
        {
          expiresIn: this.configService.get<string>(
            'auth.jwt.refreshExpiration',
            '7d',
          ),
        },
      ),
    ]);

    // 응답 객체 반환
    return {
      access_token: accessToken, // accessToken -> access_token
      refresh_token: refreshToken, // refreshToken -> refresh_token
      expires_in: parseInt(
        this.configService.get<string>('auth.jwt.accessExpiration', '900'),
        10,
      ), // 초 단위로 변환
      token_type: 'Bearer', // 토큰 타입 명시 (선택 사항)
    };
  }

  /**
   * JWT 토큰 검증
   * @param token 검증할 토큰
   * @returns 검증된 JWT 페이로드
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException(`Invalid token. : ${error}`);
    }
  }

  /**
   * OAuth 전략 조회
   * @param provider OAuth 제공자
   * @returns 해당 제공자의 전략
   */
  private getStrategy(provider: Provider): BaseOAuthStrategy {
    const strategy = this.strategies.get(provider);
    if (!strategy) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    return strategy;
  }
}
