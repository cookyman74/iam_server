import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('IAM Server API')
    .setDescription('OAuth 인증 서버 API 문서')
    .setVersion('1.0')
    .addBearerAuth() // JWT 토큰 인증 추가
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Swagger 경로 설정

  await app.listen(3000);
}
bootstrap();
