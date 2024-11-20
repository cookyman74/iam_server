// src/auth/strategies/naver.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseOAuthStrategy } from './base.strategy';
import { Provider } from '../enums/provider.enum';
import {
  OAuthTokenResponse,
  OAuthProfile,
  NaverUserResponse,
} from '../interfaces';

@Injectable()
export class NaverStrategy extends BaseOAuthStrategy {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(configService: ConfigService, httpService: HttpService) {
    super(configService, httpService);
    this.clientId = this.configService.getOrThrow<string>('NAVER_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>(
      'NAVER_CLIENT_SECRET',
    );
    this.redirectUri =
      this.configService.getOrThrow<string>('NAVER_REDIRECT_URI');
  }

  generateAuthUrl(state?: string): string {
    const params = {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state || this.generateState(),
    };

    return `https://nid.naver.com/oauth2.0/authorize?${this.encodeParams(params)}`;
  }

  async getTokens(code: string): Promise<OAuthTokenResponse> {
    const params = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
    };

    try {
      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://nid.naver.com/oauth2.0/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          data: this.encodeParams(params),
        },
      );
    } catch (error) {
      throw new UnauthorizedException('Failed to get Naver tokens');
    }
  }

  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    try {
      const response = await this.httpRequest<NaverUserResponse>(
        'GET',
        'https://openapi.naver.com/v1/nid/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.resultcode !== '00') {
        throw new Error(response.message);
      }

      return {
        id: response.response.id,
        email: response.response.email,
        name: response.response.name,
        picture: response.response.profile_image,
        provider: Provider.NAVER,
        raw: response,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to get Naver user profile');
    }
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = {
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    };

    try {
      return await this.httpRequest<OAuthTokenResponse>(
        'POST',
        'https://nid.naver.com/oauth2.0/token',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          data: this.encodeParams(params),
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to refresh Naver token: ${error}`,
      );
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.getUserProfile(accessToken);
      return !!response.id;
    } catch {
      return false;
    }
  }
}
