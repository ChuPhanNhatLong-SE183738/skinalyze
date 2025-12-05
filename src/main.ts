import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
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
    .addTag('Notifications')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Custom options to add download button
  const customOptions = {
    customSiteTitle: 'Skinalyze API Documentation',
    customCss: `
      .swagger-ui .topbar { background-color: #2c3e50; }
      .download-button-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
      }
      .download-swagger-btn {
        background-color: #4CAF50;
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.3s;
        text-decoration: none;
        display: inline-block;
      }
      .download-swagger-btn:hover {
        background-color: #45a049;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transform: translateY(-2px);
      }
    `,
    customJsStr: `
      window.onload = function() {
        // Wait for Swagger UI to load
        setTimeout(function() {
          const topbar = document.querySelector('.topbar');
          if (topbar && !document.querySelector('.download-button-container')) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'download-button-container';

            const downloadButton = document.createElement('a');
            downloadButton.href = '/api/docs-json';
            downloadButton.download = 'swagger.json';
            downloadButton.className = 'download-swagger-btn';
            downloadButton.innerText = '📥 Download JSON';
            downloadButton.title = 'Download Swagger specification as JSON';

            buttonContainer.appendChild(downloadButton);
            document.body.appendChild(buttonContainer);
          }
        }, 500);
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('api/docs', app, document, customOptions);

  // Add endpoint to download swagger.json
  app.use('/api/docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=swagger.json');
    res.send(document);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform payloads to DTO instances
    }),
  );

  // 🔒 Enable global serialization to exclude sensitive fields
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: false,
      exposeUnsetFields: false,
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
