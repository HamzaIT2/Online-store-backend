import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import listEndpoints from 'express-list-endpoints';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS with secure origin validation
  const allowedOrigins = configService.get<string>('CORS_ALLOWED_ORIGINS');
  const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';

  // Parse allowed origins from environment variable or use development defaults
  const corsOrigins = allowedOrigins
    ? allowedOrigins.split(',').map(origin => origin.trim())
    : isDevelopment
      ? [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:65036',
          'http://localhost:65036',
          'http://127.0.0.1:60808',
        ]
      : [];

  // In production, require explicit CORS configuration
  if (!isDevelopment && (!allowedOrigins || corsOrigins.length === 0)) {
    throw new Error('CORS_ALLOWED_ORIGINS environment variable must be set in production');
  }

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'X-HTTP-Method-Override', 'X-CSRF-Token'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Iraq Marketplace API')
    .setDescription('API documentation for Iraq peer-to-peer marketplace')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve static files from /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  const server = app.getHttpAdapter().getInstance();
  const endpoints = listEndpoints(server)


  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);

}
bootstrap();
