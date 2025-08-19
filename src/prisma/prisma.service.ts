import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private retryAttempts = 0;
  private readonly maxRetries = 3;

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: ['error'],
    });

    // For serverless environments - optimize connection pooling
    if (process.env.NODE_ENV === 'production') {
      this.$use(async (params, next) => {
        // Optimize connection for serverless
        const before = Date.now();
        
        try {
          const result = await next(params);
          const after = Date.now();
          
          // Log slow queries in production (over 1 second)
          if (after - before > 1000) {
            this.logger.warn(
              `Slow query detected: ${params.model}.${params.action} took ${after - before}ms`,
            );
          }
          
          return result;
        } catch (error) {
          // Log database errors
          this.logger.error(
            `Error in ${params.model}.${params.action}: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      });
    }
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      this.logger.log('Initializing Prisma client (serverless mode)');
      await this.$connect();
    } else {
      await this.connectWithRetry();
    }
  }

  async connectWithRetry() {
    try {
      if (!this.isConnected) {
        this.logger.log('Connecting to database...');
        console.log('Database URL:', this.configService.get<string>('DATABASE_URL')?.replace(/:[^:]*@/, ':****@'));
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Successfully connected to database');
      }
    } catch (error) {
      this.retryAttempts += 1;
      this.logger.error(
        `Failed to connect to database (attempt ${this.retryAttempts}/${this.maxRetries}): ${error.message}`,
      );
      
      console.error('Database connection error details:', {
        code: error.code,
        meta: error.meta,
        message: error.message,
        stack: error.stack,
      });

      if (this.retryAttempts < this.maxRetries) {
        this.logger.log(`Retrying connection in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.connectWithRetry();
      } else {
        this.logger.error(
          `Failed to connect to database after ${this.maxRetries} attempts`,
        );
        // In production, don't throw to allow non-DB endpoints to work
        if (process.env.NODE_ENV !== 'production') {
          throw error;
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Successfully disconnected from database');
    }
  }
}
