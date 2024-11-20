import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseOAuthStrategy } from './base.strategy';
import { Provider } from '../enums/provider.enum';
import {
  OAuthTokenResponse,
  OAuthProfile,
  KakaoUserResponse,
} from '../interfaces';

@Injectable()
export class KakaoStrategy extends BaseOAuthStrategy {
  private readonly clientId: string; // Kakao 애플리케이션의 클라이언트 ID
  private readonly clientSecret: string; // Kakao 애플리케이션의 클라이언트 Secret
  private readonly redirectUri: string; // Kakao OAuth의 리다이렉트 URI

  constructor(configService: ConfigService, httpService: HttpService) {
    super(configService, httpService);

    // 환경 변수에서 Kakao 설정값을 가져옵니다.
    this.clientId = this.configService.getOrThrow<string>('KAKAO_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>(
      'KAKAO_CLIENT_SECRET',
    );
    this.redirectUri =
      this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI');
  }

  /**
   * Kakao 인증 URL 생성
   * - 사용자가 Kakao 계정으로 로그인할 수 있는 URL을 생성합니다.
   * - state 값은 CSRF 방지용으로 임의의 값을 생성하거나 클라이언트에서 제공받습니다.
   */
  generateAuthUrl(state?: string): string {
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state || this.generateState(), // state 값이 없으면 랜덤 값 생성
    };

    // Kakao 인증 페이지 URL 반환
    return `https://kauth.kakao.com/oauth/authorize?${this.encodeParams(params)}`;
  }

  /**
   * Kakao에서 인증 코드를 사용해 액세스 토큰과 리프레시 토큰을 가져옵니다.
   * @param code - 인증 코드 (Authorization Code)
   * @returns Kakao OAuth 토큰 응답
   */
  async getTokens(code: string): Promise<OAuthTokenResponse> {
    const params = {
      grant_type: 'authorization_code', // 인증 코드 교환 방식
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code, // 클라이언트에서 받은 인증 코드
    };

    try {
      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://kauth.kakao.com/oauth/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          data: this.encodeParams(params), // 파라미터를 URL-encoded 문자열로 변환
        },
      );
    } catch (error) {
      // 토큰 요청 실패 시 에러 처리
      throw new UnauthorizedException('Failed to get Kakao tokens');
    }
  }

  /**
   * Kakao에서 사용자 프로필을 가져옵니다.
   * @param accessToken - 액세스 토큰
   * @returns 표준화된 사용자 프로필 (OAuthProfile 형식)
   */
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    try {
      // Kakao 사용자 정보 API 호출
      const response = await this.httpRequest<KakaoUserResponse>(
        'GET',
        'https://kapi.kakao.com/v2/user/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 액세스 토큰을 헤더에 포함
          },
        },
      );

      // Kakao 응답을 표준화된 프로필 형식으로 변환
      return {
        id: response.id.toString(),
        email: response.kakao_account?.email,
        name: response.kakao_account?.profile?.nickname,
        picture: response.kakao_account?.profile?.profile_image_url,
        provider: Provider.KAKAO,
        raw: response, // 원본 응답 데이터 포함
      };
    } catch (error) {
      // 사용자 프로필 요청 실패 시 에러 처리
      throw new UnauthorizedException('Failed to get Kakao user profile');
    }
  }

  /**
   * Kakao에서 리프레시 토큰을 사용해 새로운 액세스 토큰을 가져옵니다.
   * @param refreshToken - 리프레시 토큰
   * @returns 갱신된 OAuth 토큰 응답
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = {
      grant_type: 'refresh_token', // 리프레시 토큰 교환 방식
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken, // 클라이언트에서 제공받은 리프레시 토큰
    };

    try {
      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://kauth.kakao.com/oauth/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          data: this.encodeParams(params),
        },
      );
    } catch (error) {
      // 토큰 갱신 실패 시 에러 처리
      console.warn('토큰 갱신 실패 시 에러 처리: ', error);
      throw new UnauthorizedException('Failed to refresh Kakao token');
    }
  }

  /**
   * Kakao 액세스 토큰 검증
   * @param accessToken - 검증할 액세스 토큰
   * @returns 유효한 토큰인지 여부
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // Kakao 액세스 토큰 정보 API 호출
      await this.httpRequest(
        'GET',
        'https://kapi.kakao.com/v1/user/access_token_info',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 액세스 토큰을 헤더에 포함
          },
        },
      );
      return true; // 유효한 경우 true 반환
    } catch (error) {
      console.warn('유효하지 않은 토큰: ', error);
      return false; // 유효하지 않은 경우 false 반환
    }
  }
}
