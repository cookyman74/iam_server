// src/app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  environment: string;
  database: {
    status: 'ok' | 'error';
    message?: string;
  };
  version: string;
  uptime: number;
}

export interface AppInfo {
  name: string;
  version: string;
  environment: string;
  description: string;
  supportedOAuthProviders: string[];
  apiPrefix: string;
  docsUrl: string;
}

@Injectable()
export class AppService {
  private readonly startTime: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.startTime = Date.now();
  }

  /**
   * 앱 정보 조회
   */
  getAppInfo(): AppInfo {
    return {
      name: 'OAuth2 Authentication Service',
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get('app.nodeEnv', 'development'),
      description:
        'OAuth2 authentication service supporting multiple providers',
      supportedOAuthProviders: ['kakao', 'naver', 'apple'],
      apiPrefix: this.configService.get('app.apiPrefix', 'api'),
      docsUrl: '/api/docs',
    };
  }

  /**
   * 헬스 체크 수행
   */
  async checkHealth(): Promise<HealthCheckResult> {
    let databaseStatus: HealthCheckResult['database'] = {
      status: 'ok',
    };

    try {
      // 데이터베이스 연결 테스트
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = {
        status: 'error',
        message: `Database connection failed: ${error.message}`,
      };
    }

    return {
      status: databaseStatus.status === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('app.nodeEnv', 'development'),
      database: databaseStatus,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // 초 단위 실행 시간
    };
  }

  /**
   * 환경 설정 상태 조회
   */
  async getConfigStatus(): Promise<Record<string, any>> {
    const nodeEnv = this.configService.get('app.nodeEnv');
    const isProduction = nodeEnv === 'production';

    return {
      environment: nodeEnv,
      debug: !isProduction,
      cors: {
        enabled: this.configService.get('app.cors.enabled'),
        origins: isProduction
          ? '[hidden in production]'
          : this.configService.get('app.cors.origins'),
      },
      database: {
        maxConnections: this.configService.get('database.maxConnections'),
        sslEnabled: this.configService.get('database.sslEnabled'),
      },
      oauth: {
        kakao: {
          enabled: !!this.configService.get('auth.oauth.kakao.clientId'),
          redirectUri: isProduction
            ? '[hidden in production]'
            : this.configService.get('auth.oauth.kakao.redirectUri'),
        },
        naver: {
          enabled: !!this.configService.get('auth.oauth.naver.clientId'),
          redirectUri: isProduction
            ? '[hidden in production]'
            : this.configService.get('auth.oauth.naver.redirectUri'),
        },
        apple: {
          enabled: !!this.configService.get('auth.oauth.apple.clientId'),
          redirectUri: isProduction
            ? '[hidden in production]'
            : this.configService.get('auth.oauth.apple.redirectUri'),
        },
      },
    };
  }

  /**
   * 시스템 메트릭스 조회
   */
  async getMetrics(): Promise<Record<string, any>> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      uptime: {
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds),
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100,
        ),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
  }

  /**
   * 실행 시간을 사람이 읽기 쉬운 형식으로 변환
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}
