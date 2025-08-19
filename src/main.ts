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

let serverlessHandler: any;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  
  app.useStaticAssets(join(process.cwd(), './src/uploads'));
  setupSwagger(app);
  // CORS is handled by custom middleware in AppModule
  
  // Only listen if not in serverless environment
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(3005);
  }
  
  // Configure serverless handler
  serverlessHandler = configure({ app: expressApp });
  
  return serverlessHandler;
}

// For Vercel serverless functions
export default async function handler(req: any, res: any, context: any) {
  if (!serverlessHandler) {
    await bootstrap();
  }
  return serverlessHandler(req, res, context);
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
