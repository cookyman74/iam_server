// src/auth/types/user.types.ts
import { Provider } from '../enums/provider.enum';

// 사용자 기본 정보 타입
export interface UserProfile {
  id: string; // 사용자 고유 ID
  email?: string; // 사용자 이메일 (선택적)
  name?: string; // 사용자 이름 (선택적)
  picture?: string; // 사용자 프로필 이미지 (선택적)
  provider: Provider; // OAuth 제공자 (예: Kakao, Google)
  providerId: string; // 제공자별 사용자 ID
  createdAt: Date; // 사용자 생성 날짜
  updatedAt: Date; // 사용자 정보 업데이트 날짜
}

// 사용자 생성 시 필요한 데이터 타입
export interface CreateUserDto {
  email?: string; // 이메일 주소 (선택적)
  name?: string; // 사용자 이름 (선택적)
  picture?: string; // 사용자 프로필 이미지 (선택적)
  provider: Provider; // OAuth 제공자
  providerId: string; // 제공자별 사용자 ID
}

// 사용자 업데이트 시 필요한 데이터 타입
export interface UpdateUserDto {
  email?: string; // 이메일 주소 (선택적)
  name?: string; // 사용자 이름 (선택적)
  picture?: string; // 사용자 프로필 이미지 (선택적)
  // 이후 필요한 필드를 쉽게 추가할 수 있도록 확장 가능
}
