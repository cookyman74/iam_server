import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsBoolean()
  @IsOptional()
  CORS_ENABLED: boolean;

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;

  // Database
  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  @IsOptional()
  DATABASE_MAX_CONNECTIONS: number;

  @IsBoolean()
  @IsOptional()
  DATABASE_SSL_ENABLED: boolean;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRATION: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string;

  // Kakao OAuth
  @IsString()
  KAKAO_CLIENT_ID: string;

  @IsString()
  KAKAO_CLIENT_SECRET: string;

  @IsString()
  KAKAO_REDIRECT_URI: string;

  // Naver OAuth
  @IsString()
  NAVER_CLIENT_ID: string;

  @IsString()
  NAVER_CLIENT_SECRET: string;

  @IsString()
  NAVER_REDIRECT_URI: string;

  // Apple OAuth
  @IsString()
  APPLE_CLIENT_ID: string;

  @IsString()
  APPLE_TEAM_ID: string;

  @IsString()
  APPLE_KEY_ID: string;

  @IsString()
  APPLE_PRIVATE_KEY: string;

  @IsString()
  APPLE_REDIRECT_URI: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
