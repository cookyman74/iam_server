import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsUrl,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Provider } from '../enums/provider.enum';

export class UserInfoResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'user-uuid',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '사용자 이름',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  picture?: string;

  @ApiProperty({
    description: 'OAuth 제공자',
    enum: Provider,
    example: Provider.KAKAO,
  })
  @IsEnum(Provider)
  provider: Provider;

  @ApiProperty({
    description: 'OAuth 제공자의 사용자 ID',
    example: 'provider-user-id',
  })
  @IsString()
  providerId: string;

  @ApiProperty({
    description: '이메일 인증 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({
    description: '계정 생성일',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '최근 업데이트일',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDate()
  updatedAt: Date;
}
