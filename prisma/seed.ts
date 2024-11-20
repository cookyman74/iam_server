// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      providerId: 'test123',
      provider: 'kakao',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
