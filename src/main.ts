import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject } from '@vercel/analytics';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as serverless from 'serverless-http';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

injectSpeedInsights();
inject();

const server = express();
let cachedHandler: any;

async function bootstrapServer() {
  const logger = new Logger('Bootstrap');

  try {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_EXPIRATION',
      'JWT_REFRESH_EXPIRATION',
    ];

    const configService = new ConfigService();
    const missingVars = requiredEnvVars.filter(
      (envVar) => !configService.get(envVar),
    );

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    } else {
      logger.log('All required environment variables are set');
    }

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    logger.log('NestJS application created successfully');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    logger.log('Global validation pipe configured');

    // ✅ CORS setup for deployed frontend on Netlify
    app.enableCors({
      origin: 'https://quickbidz.netlify.app',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
      ],
      credentials: true,
    });

    app.use((req, res, next) => {
      res.header(
        'Access-Control-Allow-Origin',
        'https://quickbidz.netlify.app',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      next();
    });

    const config = new DocumentBuilder()
      .setTitle('QuickBidz API')
      .setDescription('QuickBidz Online Auction Platform API')
      .setVersion('1.0.1')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'QuickBidz API Documentation',
      customCss: '',
      swaggerOptions: {
        persistAuthorization: true,
      },
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      ],
    });
    logger.log('Swagger documentation configured');

    await app.init();
    logger.log('Application initialized successfully');

    return serverless(server);
  } catch (error) {
    const logger = new Logger('BootstrapError');
    logger.error('Failed to bootstrap server:', error);
    throw error;
  }
}

// 🧪 For local development or standard deployments (like Render Web Service)
async function bootstrap() {
  const logger = new Logger('LocalBootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // ✅ Setup CORS (recommended setup for Render + Netlify)
    app.enableCors({
      origin: 'https://online-auction-platform-quickbidz.vercel.app/',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
      ],
      credentials: true,
    });

    // ✅ Handle preflight OPTIONS request manually (sometimes needed on Render)
    app.use((req, res, next) => {
      res.header(
        'Access-Control-Allow-Origin',
        'https://online-auction-platform-quickbidz.vercel.app/',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      );
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      next();
    });

    const port = configService.get('PORT') || 4000;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error('Failed to start local server:', error);
  }
}

// 👇 Serverless handler (used in Vercel/AWS Lambda setups)
export const handler = async (event: any, context: any) => {
  const logger = new Logger('ServerlessHandler');

  try {
    logger.log(`Handling request: ${event.httpMethod} ${event.path}`);

    if (!cachedHandler) {
      logger.log('Initializing serverless handler');
      cachedHandler = await bootstrapServer();
      logger.log('Handler initialized successfully');
    }

    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://quickbidz.netlify.app',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers':
            'Origin,X-Requested-With,Content-Type,Accept,Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
        body: '',
      };
    }

    return await cachedHandler(event, context);
  } catch (error) {
    logger.error('Unhandled error in serverless handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        statusCode: 500,
        message: 'An unexpected error occurred',
        error:
          process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : error.message,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

bootstrap();
