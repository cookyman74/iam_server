// src/auth/dto/oauth-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '../enums/provider.enum';

export class OAuthProfileDto {
  @ApiProperty({ description: 'OAuth provider user ID', example: '123456789' })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  picture?: string;

  @ApiProperty({
    description: 'OAuth provider',
    enum: Provider,
    example: Provider.GOOGLE,
  })
  provider: Provider;

  @ApiProperty({
    description: 'Raw provider-specific user profile data',
    example: {},
    required: false,
  })
  raw?: any;
}
