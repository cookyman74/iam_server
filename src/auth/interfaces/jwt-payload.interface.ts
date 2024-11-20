import { Provider } from '../enums/provider.enum';

export interface JwtPayload {
  sub: string; // 사용자 ID
  email?: string; // 이메일
  provider: Provider; // OAuth 제공자
  iat?: number; // 발급 시간
  exp?: number; // 만료 시간
}
