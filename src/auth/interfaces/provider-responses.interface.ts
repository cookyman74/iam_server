// 카카오 응답 타입
export interface KakaoUserResponse {
  id: number;
  connected_at: string;
  kakao_account?: {
    email?: string;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    profile_needs_agreement?: boolean;
  };
}

// 네이버 응답 타입
export interface NaverUserResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    gender?: string;
    age?: string;
    birthday?: string;
    profile_image?: string;
    birthyear?: string;
    mobile?: string;
  };
}

// 애플 응답 타입
export interface AppleUserResponse {
  sub: string; // 사용자 식별자
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
  real_user_status?: number;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

// 구글 응답 타입
export interface GoogleUserResponse {
  id: string; // Google 고유 사용자 ID
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
// 카카오 응답 타입
export interface KakaoUserResponse {
  id: number;
  connected_at: string;
  kakao_account?: {
    email?: string;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    profile_needs_agreement?: boolean;
  };
}

// 네이버 응답 타입
export interface NaverUserResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    gender?: string;
    age?: string;
    birthday?: string;
    profile_image?: string;
    birthyear?: string;
    mobile?: string;
  };
}

// 애플 응답 타입
export interface AppleUserResponse {
  sub: string; // 사용자 식별자
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
  real_user_status?: number;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

// 구글 응답 타입
export interface GoogleUserResponse {
  id: string; // Google 고유 사용자 ID
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
