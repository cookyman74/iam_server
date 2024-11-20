import { Controller, Get, Provider, Query, Res } from '@nestjs/common';
import { google } from 'googleapis';
import { Response } from 'express';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('oauth/url')
  @ApiOperation({ summary: 'Get Oauth URL' })
  @ApiResponse({ status: 200, type: AuthUrlResponseDto })
  async getAuthUrl(@Query('provider') provider: Provider){
    try {
      const url = await this.auth
    }
  }
}
