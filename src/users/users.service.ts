// src/users/users.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, OAuthToken, Prisma } from '@prisma/client';
import { Provider } from '../auth/enums/provider.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 사용자 생성
  async createUser(data: {
    email?: string;
    name?: string;
    picture?: string;
    providerId: string;
    provider: Provider;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        provider: data.provider.toString(),
      },
    });
  }

  // OAuth 정보로 사용자 찾기
  async findByProvider(
    providerId: string,
    provider: Provider,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        AND: [{ providerId }, { provider: provider.toString() }],
      },
    });
  }

  // OAuth 토큰 저장/업데이트
  async upsertOAuthToken(data: {
    userId: string;
    provider: Provider;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  }): Promise<OAuthToken> {
    try {
      // 먼저 존재하는 토큰을 찾습니다
      const existingToken = await this.prisma.oAuthToken.findFirst({
        where: {
          AND: [
            { userId: data.userId },
            { provider: data.provider.toString() },
          ],
        },
      });

      if (existingToken) {
        // 토큰이 존재하면 업데이트
        return this.prisma.oAuthToken.update({
          where: {
            id: existingToken.id,
          },
          data: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          },
        });
      } else {
        // 토큰이 없으면 새로 생성
        return this.prisma.oAuthToken.create({
          data: {
            userId: data.userId,
            provider: data.provider.toString(),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          },
        });
      }
    } catch (error) {
      throw new Error(`Failed to upsert OAuth token: ${error.message}`);
    }
  }

  // 유효한 토큰 조회
  async findValidToken(
    userId: string,
    provider: Provider,
  ): Promise<OAuthToken | null> {
    return this.prisma.oAuthToken.findFirst({
      where: {
        AND: [
          { userId },
          { provider: provider.toString() },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  /**
   * OAuth 프로필로 사용자 찾기 또는 생성
   */
  async findOrCreateByOAuth(
    provider: string,
    profile: OAuthProfile,
  ): Promise<User> {
    try {
      // 1. providerId와 provider로 사용자 찾기
      let user = await this.prisma.user.findUnique({
        where: {
          provider_providerId: {
            provider,
            providerId: profile.id,
          },
        },
        include: {
          oauthCredentials: true,
        },
      });

      // 2. 사용자가 존재하면 프로필 업데이트
      if (user) {
        user = await this.updateUserProfile(user.id, profile);
        return user;
      }

      // 3. 이메일이 있는 경우 이메일로 기존 사용자 찾기
      if (profile.email) {
        user = await this.prisma.user.findUnique({
          where: { email: profile.email },
        });

        // 이미 다른 제공자로 가입한 이메일이 있는 경우
        if (user) {
          throw new ConflictException(
            `Email ${profile.email} is already registered with different provider`,
          );
        }
      }

      // 4. 새 사용자 생성
      return await this.prisma.user.create({
        data: {
          id: uuidv4(),
          email: profile.email,
          name: profile.name || `User_${uuidv4().slice(0, 8)}`,
          picture: profile.picture,
          provider,
          providerId: profile.id,
          oauthCredentials: {
            create: {
              provider,
              providerId: profile.id,
              profile: profile.raw, // 원본 프로필 데이터 저장
            },
          },
          emailVerified: profile.email ? new Date() : null, // OAuth를 통한 이메일은 인증된 것으로 처리
        },
        include: {
          oauthCredentials: true,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      // 데이터베이스 고유 제약 조건 위반
      if (error.code === 'P2002') {
        throw new ConflictException(
          'User with this email or provider ID already exists',
        );
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
      const updateData: any = {};

      // 필드가 있을 때만 업데이트
      if (profile.name) updateData.name = profile.name;
      if (profile.picture) updateData.picture = profile.picture;
      if (profile.email && !updateData.email) {
        updateData.email = profile.email;
        updateData.emailVerified = new Date();
      }

      // OAuth 자격 증명 업데이트
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          oauthCredentials: {
            update: {
              where: {
                provider_userId: {
                  provider: profile.provider,
                  userId,
                },
              },
              data: {
                profile: profile.raw,
                updatedAt: new Date(),
              },
            },
          },
        },
        include: {
          oauthCredentials: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update user profile: ${error.message}`,
      );
    }
  }

  // 사용자 ID로 조회
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        oauthCredentials: true,
      },
    });
  }

  // 이메일로 사용자 조회
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // 사용자 정보 업데이트
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

  // 토큰 삭제
  async removeToken(userId: string, provider: Provider): Promise<void> {
    const token = await this.prisma.oAuthToken.findFirst({
      where: {
        AND: [{ userId }, { provider: provider.toString() }],
      },
    });

    if (token) {
      await this.prisma.oAuthToken.delete({
        where: { id: token.id },
      });
    }
  }

  // 사용자와 관련 토큰 삭제
  async removeUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
