// src/auth/interfaces/oauth-profiles.ts
import { Provider } from '../enums/provider.enum';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 기본 OAuth 프로필 인터페이스
export interface OAuthProfile {
  id: string; // OAuth 제공자의 고유 사용자 ID
  email?: string; // 사용자 이메일 (선택적)
  name?: string; // 사용자 이름 (선택적)
  picture?: string; // 프로필 사진 URL (선택적)
  provider: Provider; // OAuth 제공자 (kakao, naver, apple 등)
  emailVerified?: boolean; // 이메일 인증 여부 (Apple ID의 경우)
  raw?: any; // 원본 프로필 데이터
}

// 카카오 프로필 인터페이스
export interface KakaoProfile {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email?: string;
    email_needs_agreement?: boolean;
    is_email_verified?: boolean;
    has_email?: boolean;
  };
}

// 네이버 프로필 인터페이스
export interface NaverProfile {
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

// 애플 프로필 인터페이스
export interface AppleProfile {
  sub: string; // 사용자 ID
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

// 프로필 변환기 클래스
export class OAuthProfileAdapter {
  /**
   * 카카오 프로필을 표준 형식으로 변환
   */
  static fromKakao(profile: KakaoProfile): OAuthProfile {
    return {
      id: profile.id.toString(),
      email: profile.kakao_account?.email,
      name:
        profile.kakao_account?.profile?.nickname ||
        profile.properties?.nickname,
      picture:
        profile.kakao_account?.profile?.profile_image_url ||
        profile.properties?.profile_image,
      provider: Provider.KAKAO,
      raw: profile,
    };
  }

  /**
   * 네이버 프로필을 표준 형식으로 변환
   */
  static fromNaver(profile: NaverProfile): OAuthProfile {
    return {
      id: profile.response.id,
      email: profile.response.email,
      name: profile.response.name || profile.response.nickname,
      picture: profile.response.profile_image,
      provider: Provider.NAVER,
      raw: profile,
    };
  }

  /**
   * 애플 프로필을 표준 형식으로 변환
   */
  static fromApple(profile: AppleProfile): OAuthProfile {
    const name = profile.name
      ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
      : undefined;

    return {
      id: profile.sub,
      email: profile.email,
      name: name || undefined,
      picture: undefined, // Apple doesn't provide profile picture
      provider: Provider.APPLE,
      raw: profile,
    };
  }
}

// 프로필 검증 클래스
export class OAuthProfileValidator {
  /**
   * 필수 필드 검증
   */
  static validate(profile: OAuthProfile): void {
    if (!profile.id) {
      throw new Error('Profile ID is required');
    }
    if (!profile.provider) {
      throw new Error('Provider is required');
    }
  }

  /**
   * 이메일 검증
   */
  static validateEmail(email?: string): boolean {
    if (!email) return true; // 이메일이 없는 경우는 유효함
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 프로필 처리 서비스
@Injectable()
export class OAuthProfileService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * OAuth 프로필 처리
   */
  async processProfile(
    provider: Provider,
    rawProfile: any,
  ): Promise<OAuthProfile> {
    let profile: OAuthProfile;

    // 제공자별 프로필 변환
    switch (provider) {
      case Provider.KAKAO:
        profile = OAuthProfileAdapter.fromKakao(rawProfile);
        break;
      case Provider.NAVER:
        profile = OAuthProfileAdapter.fromNaver(rawProfile);
        break;
      case Provider.APPLE:
        profile = OAuthProfileAdapter.fromApple(rawProfile);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // 프로필 검증
    OAuthProfileValidator.validate(profile);

    // 이메일 검증
    if (profile.email && !OAuthProfileValidator.validateEmail(profile.email)) {
      throw new Error('Invalid email format');
    }

    // 프로필 이미지 URL 정규화
    if (profile.picture) {
      profile.picture = this.normalizeProfileImageUrl(profile.picture);
    }

    return profile;
  }

  /**
   * 프로필 이미지 URL 정규화
   */
  private normalizeProfileImageUrl(url: string): string {
    // HTTPS 강제
    if (url.startsWith('http:')) {
      url = url.replace('http:', 'https:');
    }

    return url;
  }
}
