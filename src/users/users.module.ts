// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule], // 데이터베이스 통신을 위한 Prisma 모듈
  providers: [UsersService], // 사용자 관련 비즈니스 로직을 처리하는 서비스
  exports: [UsersService], // 다른 모듈에서 사용 가능하도록 내보냄
})
export class UsersModule {}
