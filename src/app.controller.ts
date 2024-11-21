// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService, HealthCheckResult, AppInfo } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    type: Object,
  })
  getAppInfo(): AppInfo {
    return this.appService.getAppInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({
    status: 200,
    description: 'Health check performed successfully',
    type: Object,
  })
  checkHealth(): Promise<HealthCheckResult> {
    return this.appService.checkHealth();
  }

  @Get('config/status')
  @ApiOperation({ summary: 'Get configuration status' })
  @ApiResponse({
    status: 200,
    description: 'Configuration status retrieved successfully',
    type: Object,
  })
  getConfigStatus(): Promise<Record<string, any>> {
    return this.appService.getConfigStatus();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({
    status: 200,
    description: 'Application metrics retrieved successfully',
    type: Object,
  })
  getMetrics(): Promise<Record<string, any>> {
    return this.appService.getMetrics();
  }
}
