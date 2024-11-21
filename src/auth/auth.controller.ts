// src/auth/auth.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { ApiAuth } from './decorators/api-auth.decorator';
import { Provider } from './enums/provider.enum';
import {
  AuthUrlDto,
  AuthUrlResponseDto,
  AuthCallbackDto,
  AuthTokensResponseDto,
} from './dto/auth-response.dto';
import { OAuthProfile } from './interfaces';
import { OAuthProfileDto } from './dto/oauth-profile.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get(':provider/url')
  @ApiOperation({ summary: 'Get OAuth authorization URL' })
  @ApiParam({
    name: 'provider',
    enum: Provider,
    description: 'OAuth provider',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth authorization URL',
    type: AuthUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid provider' })
  async getAuthUrl(
    @Param() params: AuthUrlDto,
    @Query('state') state?: string,
  ): Promise<AuthUrlResponseDto> {
    try {
      const url = await this.authService.generateAuthUrl(
        params.provider,
        state,
      );
      return { url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':provider/callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiParam({
    name: 'provider',
    enum: Provider,
    description: 'OAuth provider',
  })
  @ApiQuery({
    name: 'code',
    description: 'OAuth authorization code',
    required: true,
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter for CSRF protection',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async handleCallback(
    @Param() params: AuthCallbackDto,
    @Query('code') code: string,
    @Query('state') state?: string,
  ): Promise<AuthTokensResponseDto> {
    try {
      const tokenResponse = await this.authService.handleOAuthCallback(
        code,
        params.provider,
        state,
      );

      // TokenResponse를 AuthTokensResponseDto로 매핑
      return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Get('user')
  @UseGuards(AuthGuard)
  @ApiAuth('Get authenticated user information')
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: OAuthProfileDto,
  })
  async getUserInfo(
    @Headers('authorization') auth: string,
  ): Promise<OAuthProfile> {
    try {
      const token = auth.replace('Bearer ', '');
      return await this.authService.getUserInfo(token);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  @ApiAuth('Refresh authentication tokens')
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Headers('authorization') auth: string,
  ): Promise<AuthTokensResponseDto> {
    try {
      const token = auth.replace('Bearer ', '');
      const tokens = await this.authService.refreshToken(token);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
