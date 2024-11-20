import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '../enums/provider.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AuthUrlRequestDto {
  @ApiProperty({
    description: 'OAuth 제공자',
    enum: Provider,
    example: Provider.KAKAO,
  })
  @IsEnum(Provider)
  provider: Provider;

  @ApiProperty({
    description: 'CSRF 방지를 위한 상태값',
    required: false,
    example: 'random-state-string',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class AuthUrlResponseDto {
  @ApiProperty({
    description: 'OAuth 인증 URL',
    example: 'https://kauth.kakao.com/oauth/authorize?client_id=...',
  })
  @IsString()
  url: string;
}
