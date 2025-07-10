// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable automatic DTO validation with class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove properties not in DTO
      forbidNonWhitelisted: true, // throw error on unexpected properties (optional)
      transform: true, // auto-transform payloads to DTO class instances
    }),
  );

  // ✅ Enable CORS for React frontend
  app.enableCors({
    origin: 'http://localhost:5173', // Update to your frontend's URL if different
    credentials: true,
  });

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}

bootstrap();
