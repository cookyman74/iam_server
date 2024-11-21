// src/auth/decorators/api-auth.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

export function ApiAuth(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer JWT token',
      required: true,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
