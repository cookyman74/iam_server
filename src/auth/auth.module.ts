import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwt.accessExpiration'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    UsersModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    KakaoStrategy,
    NaverStrategy,
    AppleStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
