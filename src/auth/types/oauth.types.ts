// src/auth/types/oauth.types.ts
import { Provider } from '../enums/provider.enum';

// OAuth 제공자의 공통 토큰 응답 타입
export interface OAuthTokenResponse {
  access_token: string; // 액세스 토큰
  token_type: string; // 토큰 타입 (예: Bearer)
  refresh_token?: string; // 리프레시 토큰 (선택적)
  expires_in: number; // 토큰 만료 시간 (초 단위)
  scope?: string; // 요청된 권한 범위
  id_token?: string; // OpenID Connect에서 반환되는 ID 토큰 (선택적)
}

// 제공자별 토큰 응답 타입 확장
export interface KakaoTokenResponse extends OAuthTokenResponse {
  refresh_token_expires_in: number; // 리프레시 토큰 만료 시간 (초 단위)
}

export interface NaverTokenResponse extends OAuthTokenResponse {
  error?: string; // 에러 코드 (선택적)
  error_description?: string; // 에러 설명 (선택적)
}

export interface AppleTokenResponse extends OAuthTokenResponse {
  id_token: string; // Apple은 항상 ID 토큰을 반환
}

// OAuth 사용자 프로필 응답 타입
export interface OAuthUserProfile {
  id: string; // 사용자 고유 ID
  email?: string; // 이메일 주소
  name?: string | { firstName?: string; lastName?: string }; // 이름 (문자열 또는 객체 형태 지원)
  picture?: string; // 프로필 이미지 URL
  provider: Provider; // OAuth 제공자
  raw?: any; // 제공자의 원본 응답 데이터
}

// 제공자별 사용자 프로필 응답 타입
export interface KakaoUserProfile {
  id: number; // 사용자 고유 ID
  kakao_account?: {
    email?: string; // 이메일 주소
    email_verified?: boolean; // 이메일 인증 여부
    profile?: {
      nickname?: string; // 닉네임
      profile_image_url?: string; // 프로필 이미지 URL
    };
  };
}

export interface NaverUserProfile {
  resultcode: string; // 응답 코드 (성공: 00)
  message: string; // 응답 메시지
  response: {
    id: string; // 사용자 고유 ID
    email?: string; // 이메일 주소
    name?: string; // 이름
    profile_image?: string; // 프로필 이미지 URL
  };
}

export interface AppleUserProfile {
  sub: string; // Apple의 유저 ID
  email?: string; // 이메일 주소
  email_verified?: boolean; // 이메일 인증 여부
  name?: {
    firstName?: string; // 이름 (성)
    lastName?: string; // 이름 (이름)
  };
}
