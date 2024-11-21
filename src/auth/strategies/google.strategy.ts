import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseOAuthStrategy } from './base.strategy';
import { Provider } from '../enums/provider.enum';
import { OAuthTokenResponse, OAuthProfile } from '../interfaces';

@Injectable()
export class GoogleStrategy extends BaseOAuthStrategy {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService,
  ) {
    super(configService, httpService);

    // 환경 변수에서 Google 설정값을 가져옵니다.
    this.clientId = this.configService.getOrThrow<string>(
      'auth.oauth.google.clientId',
    );
    this.clientSecret = this.configService.getOrThrow<string>(
      'auth.oauth.google.clientSecret',
    );
    this.redirectUri = this.configService.getOrThrow<string>(
      'auth.oauth.google.redirectUri',
    );
  }

  /**
   * Google 로그인 URL 생성
   * - 사용자가 Google 계정으로 로그인할 수 있는 URL을 생성합니다.
   * @param state - CSRF 방지용 상태값 (선택적)
   * @returns Google 로그인 URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile', // 사용자 정보에 대한 기본 범위 요청
      access_type: 'offline', // 리프레시 토큰 발급 요청
      state: state || this.generateState(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Google OAuth 토큰 발급
   * - 인증 코드를 사용해 액세스 토큰과 리프레시 토큰을 가져옵니다.
   * @param code - Google에서 반환된 인증 코드
   * @returns 액세스 토큰 및 리프레시 토큰 정보
   */
  async getTokens(code: string): Promise<OAuthTokenResponse> {
    try {
      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://oauth2.googleapis.com/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: new URLSearchParams({
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
          }).toString(),
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to get Google tokens: ${error.message}`,
      );
    }
  }

  /**
   * Google 사용자 프로필 조회
   * - Google의 사용자 정보 엔드포인트를 사용해 사용자 프로필을 가져옵니다.
   * @param accessToken - 액세스 토큰
   * @returns 표준화된 사용자 프로필
   */
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    try {
      const response = await this.httpRequest<any>(
        'GET',
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 액세스 토큰을 헤더에 포함
          },
        },
      );

      return {
        id: response.sub,
        email: response.email,
        name: response.name,
        picture: response.picture,
        provider: Provider.GOOGLE,
        raw: response, // 원본 응답 데이터
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to get Google user profile');
    }
  }

  /**
   * Google 리프레시 토큰을 사용해 새 액세스 토큰 발급
   * @param refreshToken - Google에서 발급받은 리프레시 토큰
   * @returns 갱신된 OAuth 토큰 정보
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://oauth2.googleapis.com/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }).toString(),
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to refresh Google token: ${error.message}`,
      );
    }
  }

  /**
   * Google 액세스 토큰 검증
   * - Google의 토큰 정보 엔드포인트를 사용해 토큰의 유효성을 확인합니다.
   * @param accessToken - 검증할 액세스 토큰
   * @returns 유효성 여부
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.httpRequest<any>(
        'GET',
        `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`,
        {},
      );
      return true; // 유효한 경우 true 반환
    } catch {
      return false; // 유효하지 않은 경우 false 반환
    }
  }
}
