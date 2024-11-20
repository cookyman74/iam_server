// src/auth/strategies/base.strategy.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OAuthTokenResponse, OAuthUserProfile } from '../types';

@Injectable()
export abstract class BaseOAuthStrategy {
  protected constructor(
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService,
  ) {}

  // OAuth URL 생성
  abstract generateAuthUrl(state?: string): string;

  // 토큰 발급
  abstract getTokens(code: string): Promise<OAuthTokenResponse>;

  // 사용자 프로필 조회
  abstract getUserProfile(accessToken: string): Promise<OAuthUserProfile>;

  // 토큰 갱신
  abstract refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;

  // 토큰 검증
  abstract validateToken(accessToken: string): Promise<boolean>;

  // HTTP 요청 헬퍼 메서드
  protected async httpRequest<T>(
    method: 'GET' | 'POST',
    url: string,
    config: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      data?: any;
    },
  ): Promise<T> {
    try {
      const response = await this.httpService.axiosRef.request<T>({
        method,
        url,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          `OAuth request failed: ${JSON.stringify(error.response.data)}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 상태 토큰 생성
  protected generateState(): string {
    return Math.random().toString(36).substring(2);
  }

  // URL 파라미터 인코딩
  protected encodeParams(params: Record<string, string>): string {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');
  }
}
