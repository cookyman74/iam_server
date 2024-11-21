import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { BaseOAuthStrategy } from './base.strategy';
import { Provider } from '../enums/provider.enum';
import { OAuthTokenResponse, OAuthProfile, AppleProfile } from '../interfaces';

@Injectable()
export class AppleStrategy extends BaseOAuthStrategy {
  private readonly clientId: string; // Apple 서비스 ID
  private readonly teamId: string; // Apple 팀 ID
  private readonly keyId: string; // Apple 키 ID
  private readonly privateKey: string; // Apple 프라이빗 키
  private readonly redirectUri: string; // Apple OAuth 리다이렉트 URI

  constructor(
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService,
  ) {
    super(configService, httpService);

    // 환경 변수에서 Apple 설정값을 가져옵니다.
    this.clientId = this.configService.getOrThrow<string>(
      'auth.oauth.apple.clientId',
    );
    this.teamId = this.configService.getOrThrow<string>(
      'auth.oauth.apple.teamId',
    );
    this.keyId = this.configService.getOrThrow<string>(
      'auth.oauth.apple.keyId',
    );
    this.privateKey = this.configService.getOrThrow<string>(
      'auth.oauth.apple.privateKey',
    );
    this.redirectUri = this.configService.getOrThrow<string>(
      'auth.oauth.apple.redirectUri',
    );
  }

  /**
   * Apple 로그인 URL 생성
   * - 사용자가 Apple 계정으로 로그인할 수 있는 URL을 생성합니다.
   * @param state - CSRF 방지용 상태값 (선택적)
   * @returns Apple 로그인 URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'name email',
      response_mode: 'form_post',
      state: state || this.generateState(), // 상태값이 없으면 랜덤 생성
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  /**
   * Apple OAuth 토큰 발급
   * - 인증 코드를 사용해 액세스 토큰과 리프레시 토큰을 가져옵니다.
   * @param code - Apple에서 반환된 인증 코드
   * @returns 액세스 토큰 및 리프레시 토큰 정보
   */
  async getTokens(code: string): Promise<OAuthTokenResponse> {
    try {
      const clientSecret = await this.generateClientSecret(); // 클라이언트 시크릿 생성

      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://appleid.apple.com/auth/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: this.clientId,
            client_secret: clientSecret,
            redirect_uri: this.redirectUri,
          }).toString(),
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to get Apple tokens: ${error.message}`,
      );
    }
  }

  /**
   * Apple 사용자 프로필 조회
   * - Apple ID 토큰을 디코딩해 사용자 정보를 추출합니다.
   * @param idToken - Apple에서 반환된 ID 토큰
   * @returns 표준화된 사용자 프로필
   */
  async getUserProfile(idToken: string): Promise<OAuthProfile> {
    try {
      const decodedToken = jwt.decode(idToken) as AppleProfile; // ID 토큰 디코딩
      if (!decodedToken) {
        throw new Error('Failed to decode ID token');
      }

      return {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name
          ? `${decodedToken.name.firstName || ''} ${decodedToken.name.lastName || ''}`.trim()
          : undefined,
        picture: undefined, // Apple은 프로필 이미지를 제공하지 않음
        provider: Provider.APPLE,
        emailVerified: decodedToken.email_verified, // 이메일 인증 상태
        raw: decodedToken, // 디코딩된 원본 토큰 데이터
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to get Apple user profile: ${error.message}`,
      );
    }
  }

  /**
   * Apple 리프레시 토큰을 사용해 새 액세스 토큰 발급
   * @param refreshToken - Apple에서 발급받은 리프레시 토큰
   * @returns 갱신된 OAuth 토큰 정보
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      const clientSecret = await this.generateClientSecret(); // 클라이언트 시크릿 생성

      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://appleid.apple.com/auth/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.clientId,
            client_secret: clientSecret,
          }).toString(),
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to refresh Apple token: ${error.message}`,
      );
    }
  }

  /**
   * Apple 토큰 검증
   * - 공개 키를 사용해 ID 토큰의 서명을 검증합니다.
   * @param token - 검증할 Apple ID 토큰
   * @returns 유효성 여부
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const decodedToken = jwt.decode(token, { complete: true }); // 토큰 디코딩
      if (!decodedToken) {
        return false; // 디코딩 실패 시 false 반환
      }

      // Apple의 공개 키 가져오기
      const keyResponse = await this.httpRequest<any>(
        'GET',
        'https://appleid.apple.com/auth/keys',
        {},
      );

      const keys = keyResponse.keys;
      const key = keys.find((k) => k.kid === decodedToken.header.kid); // 키 식별자 매칭

      if (!key) {
        return false; // 키가 없으면 유효하지 않음
      }

      // JWK를 PEM 형식으로 변환 후 서명 검증
      jwt.verify(token, this.getPublicKeyFromJWK(key), {
        algorithms: ['RS256'], // Apple에서 사용하는 알고리즘
        issuer: 'https://appleid.apple.com',
        audience: this.clientId,
      });

      return true; // 검증 성공 시 true 반환
    } catch {
      return false; // 검증 실패 시 false 반환
    }
  }

  /**
   * 클라이언트 시크릿 생성
   * - Apple JWT 서명 규격을 기반으로 클라이언트 시크릿을 생성합니다.
   */
  private async generateClientSecret(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const claims = {
      iss: this.teamId, // Apple 팀 ID
      iat: now, // 발급 시간
      exp: now + 3600, // 만료 시간 (1시간)
      aud: 'https://appleid.apple.com',
      sub: this.clientId, // Apple 서비스 ID
    };

    return jwt.sign(claims, this.privateKey, {
      algorithm: 'ES256', // Apple에서 요구하는 알고리즘
      header: {
        alg: 'ES256',
        kid: this.keyId, // 키 ID
      },
    });
  }

  /**
   * JWK(JSON Web Key)를 공개 키로 변환
   * @param jwk - JSON Web Key
   * @returns PEM 형식의 공개 키
   */
  private getPublicKeyFromJWK(jwk: any): string {
    return crypto
      .createPublicKey({
        key: jwk,
        format: 'jwk',
      })
      .export({
        type: 'spki',
        format: 'pem',
      })
      .toString();
  }
}
