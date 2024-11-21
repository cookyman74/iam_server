import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { Provider } from '../enums/provider.enum';

export class AuthUrlDto {
  @ApiProperty({
    description: 'OAuth provider',
    enum: Provider,
    example: Provider.KAKAO,
  })
  @IsEnum(Provider)
  provider: Provider;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    required: false,
    example: 'random-state-string',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class AuthUrlResponseDto {
  @ApiProperty({
    description: 'OAuth authorization URL',
    example: 'https://kauth.kakao.com/oauth/authorize?client_id=...',
  })
  @IsUrl()
  url: string;
}

export class AuthCallbackDto {
  @ApiProperty({
    description: 'OAuth provider',
    enum: Provider,
    example: Provider.KAKAO,
  })
  @IsEnum(Provider)
  provider: Provider;

  @ApiProperty({
    description: 'OAuth authorization code',
    example: 'auth-code-from-provider',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    required: false,
    example: 'random-state-string',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class AuthTokensResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;
}
