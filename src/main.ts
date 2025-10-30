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

  // Enable CORS for HTTP and WebSocket
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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
    .addTag('Diseases')
    .addTag('Disease Groups')
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

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const ipAddress = process.env.IP_ADDRESS || 'localhost';

  await app.listen(port, '0.0.0.0'); // Listen on all interfaces

  console.log(`\n🚀 Server is running on:`);
  console.log(`   - Local:   http://localhost:${port}`);
  console.log(`   - Network: http://${ipAddress}:${port}`);
  console.log(`\n🔌 WebSocket is available at:`);
  console.log(`   - Local:   ws://localhost:${port}/notifications`);
  console.log(`   - Network: ws://${ipAddress}:${port}/notifications`);
  console.log(`\n📚 API Documentation: http://${ipAddress}:${port}/api/docs\n`);
}
bootstrap();
