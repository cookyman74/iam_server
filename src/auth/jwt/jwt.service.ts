import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // 사용자 ID
  email?: string; // 이메일 (선택)
  provider: string; // OAuth 제공자
  type: 'access' | 'refresh'; // 토큰 타입
  iat?: number; // 발급 시간
  exp?: number; // 만료 시간
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 액세스 토큰과 리프레시 토큰 생성
   */
  async generateTokens(
    payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>,
  ): Promise<TokenResponse> {
    const accessTokenExpiresIn = this.configService.get<number>(
      'auth.jwt.accessExpiresIn',
      900,
    ); // 기본값: 15분
    const refreshTokenExpiresIn = this.configService.get<number>(
      'auth.jwt.refreshExpiresIn',
      604800,
    ); // 기본값: 7일

    // 액세스 토큰과 리프레시 토큰을 병렬 생성
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          ...payload,
          type: 'access',
        },
        {
          expiresIn: accessTokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          ...payload,
          type: 'refresh',
        },
        {
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
    };
  }

  /**
   * 토큰 검증
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      // 구체적인 에러 처리
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * 토큰 디코딩 (검증 없이)
   */
  decodeToken(token: string): JwtPayload {
    try {
      const decoded = this.jwtService.decode(token) as JwtPayload;
      if (!decoded) throw new Error('Invalid token');
      return decoded;
    } catch (error) {
      throw new Error(`Token decoding failed: ${error.message}`);
    }
  }

  /**
   * 토큰 만료 시간 확인
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * 토큰 남은 시간 확인 (초 단위)
   */
  getTokenTimeRemaining(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) return 0;
      return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    } catch {
      return 0;
    }
  }
}
