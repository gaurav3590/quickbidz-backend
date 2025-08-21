import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import configure from '@vendia/serverless-express';

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
let app: NestExpressApplication;

async function bootstrap() {
  const expressApp = express();
  
  app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  
  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  app.useStaticAssets(join(process.cwd(), './src/uploads'));
  setupSwagger(app);
  
  // Set global prefix for API routes
  app.setGlobalPrefix('api', {
    exclude: ['/', '/health', '/test', '/debug'],
  });
  
  // Only listen if not in serverless environment
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(3005);
    console.log('Application is running on: http://localhost:3005');
  }
  
  // Configure serverless handler
  serverlessHandler = configure({ app: expressApp });
  
  return serverlessHandler;
}

// For Vercel serverless functions
export default async function handler(req: any, res: any, context: any) {
  console.log('Handler called with:', { 
    method: req.method, 
    url: req.url, 
    path: req.path,
    environment: process.env.NODE_ENV
  });
  
  if (!serverlessHandler) {
    console.log('Initializing app...');
    await bootstrap();
  }
  
  return serverlessHandler(req, res, context);
}

// For local development only
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
