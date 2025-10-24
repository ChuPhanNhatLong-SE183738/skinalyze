import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const serviceAccount = require('../service-account-key.json');

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Skinalyze API')
    .setDescription('The Skinalyze API documentation')
    .setVersion('1.0')
    .addTag('Products')
    .addTag('Users')
    .addTag('Categories')
    .addTag('Batches')
    .addTag('Stock Movement')
    .addTag('Inventory')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform payloads to DTO instances
    }),
  );

  await app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000);
}
bootstrap();
