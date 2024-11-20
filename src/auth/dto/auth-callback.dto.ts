import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Provider } from '../enums/provider.enum';

export class AuthCallbackRequestDto {
  @ApiProperty({
    description: 'OAuth 제공자',
    enum: Provider,
    example: Provider.KAKAO,
  })
  @IsEnum(Provider)
  provider: Provider;

  @ApiProperty({
    description: 'OAuth 인증 코드',
    example: 'authorization-code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'CSRF 방지를 위한 상태값',
    required: false,
    example: 'random-state-string',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class AuthCallbackResponseDto {
  @ApiProperty({
    description: '액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: '토큰 만료 시간(초)',
    example: 3600,
  })
  expiresIn: number;
}
