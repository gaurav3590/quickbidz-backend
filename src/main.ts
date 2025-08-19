import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { join } from 'path';
import configure from '@vendia/serverless-express';
import * as express from 'express';

function setupSwagger(app) {
  // initiate swagger
  const options = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, options, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'QuickBidz API',
  });
}

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.useStaticAssets(join(process.cwd(), './src/uploads'));
  setupSwagger(app);
  app.enableCors();
  await app.listen(3005);
  return configure({ app: expressApp });
}

bootstrap();
