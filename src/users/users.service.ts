import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, OAuthToken } from '@prisma/client';
import { Provider } from '../auth/enums/provider.enum';
import { OAuthProfile } from '../auth/interfaces';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자 생성
   */
  async createUser(data: {
    email?: string;
    name?: string;
    picture?: string;
    providerId: string;
    provider: Provider;
  }): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          ...data,
          provider: data.provider.toString(),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create user: ${error.message}`,
      );
    }
  }

  /**
   * OAuth 정보로 사용자 찾기
   */
  async findByProvider(
    providerId: string,
    provider: Provider,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        providerId,
        provider: provider.toString(),
      },
    });
  }

  /**
   * OAuth 토큰 저장 또는 업데이트
   */
  async upsertOAuthToken(data: {
    userId: string;
    provider: Provider;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    scope?: string[];
  }): Promise<OAuthToken> {
    try {
      const existingToken = await this.prisma.oAuthToken.findFirst({
        where: {
          userId: data.userId,
          provider: data.provider.toString(),
        },
      });

      if (existingToken) {
        return await this.prisma.oAuthToken.update({
          where: { id: existingToken.id },
          data: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
            // scope: data.scope?.join(','),
          },
        });
      }

      return await this.prisma.oAuthToken.create({
        data: {
          userId: data.userId,
          provider: data.provider.toString(),
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          // scope: data.scope?.join(','),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upsert OAuth token: ${error.message}`,
      );
    }
  }

  /**
   * 유효한 토큰 조회
   */
  async findValidToken(
    userId: string,
    provider: Provider,
  ): Promise<OAuthToken | null> {
    return this.prisma.oAuthToken.findFirst({
      where: {
        userId,
        provider: provider.toString(),
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * OAuth 프로필로 사용자 찾기 또는 생성
   */
  async findOrCreateByOAuth(
    provider: Provider,
    profile: OAuthProfile,
  ): Promise<User> {
    try {
      let user = await this.findByProvider(profile.id, provider);

      if (user) {
        user = await this.updateUserProfile(user.id, profile);
        return user;
      }

      if (profile.email) {
        user = await this.findByEmail(profile.email);
        if (user) {
          throw new ConflictException(
            `Email ${profile.email} is already registered with another provider.`,
          );
        }
      }

      return await this.createUser({
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        providerId: profile.id,
        provider,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to process OAuth profile: ${error.message}`,
      );
    }
  }

  /**
   * 사용자 프로필 업데이트
   */
  private async updateUserProfile(
    userId: string,
    profile: OAuthProfile,
  ): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update user profile: ${error.message}`,
      );
    }
  }

  /**
   * 사용자 ID로 조회
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 이메일로 사용자 조회
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(
    id: string,
    data: {
      email?: string;
      name?: string;
      picture?: string;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * 토큰 삭제
   */
  async removeToken(userId: string, provider: Provider): Promise<void> {
    try {
      const token = await this.findValidToken(userId, provider);
      if (token) {
        await this.prisma.oAuthToken.delete({
          where: { id: token.id },
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to remove token: ${error.message}`,
      );
    }
  }

  /**
   * 사용자 삭제
   */
  async removeUser(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to remove user: ${error.message}`,
      );
    }
  }
}
