// src/auth/types/token.types.ts

import { Provider } from '../enums/provider.enum'; // 올바른 Provider enum 경로

// JWT 토큰 페이로드
export interface TokenPayload {
  sub: string; // 사용자 ID
  email?: string; // 이메일 주소 (선택적)
  provider: Provider; // OAuth 제공자
  type: 'access' | 'refresh'; // 토큰 유형 (액세스 또는 리프레시)
  iat?: number; // 발급 시간 (선택적)
  exp?: number; // 만료 시간 (선택적)
}

// 토큰 발급 응답 타입
export interface TokenResponse {
  access_token: string; // 액세스 토큰
  refresh_token: string; // 리프레시 토큰
  expires_in: number; // 토큰 만료 시간 (초 단위)
  token_type: 'Bearer'; // 토큰 타입
}

// 토큰 저장소 타입
export interface TokenStore {
  userId: string; // 사용자 ID
  provider: Provider; // OAuth 제공자
  accessToken: string; // 액세스 토큰
  refreshToken: string; // 리프레시 토큰
  expiresIn: number; // 만료 시간 (초 단위)
  issuedAt: number; // 발급 시간 (Unix timestamp)
}

export interface JwtPayload {
  sub: string;
  email?: string;
  provider: string;
  type: 'access' | 'refresh';
  iat?: number; // 발급 시간
  exp?: number; // 만료 시간
}
