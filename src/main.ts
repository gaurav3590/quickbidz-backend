import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

function setupSwagger(app) {
  // initiate swagger
  const config = new DocumentBuilder()
    .setTitle('QuickBidz API')
    .setDescription('QuickBidz API')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      description: 'Valid JWT Token',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js',
    ],
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  setupSwagger(app);

  // For Vercel deployment
  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
