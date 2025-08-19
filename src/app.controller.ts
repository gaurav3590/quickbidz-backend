import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    try {
      return this.appService.getHello();
    } catch (error) {
      this.logger.error('Error in getHello:', error);
      return 'Welcome to QuickBidz API';
    }
  }

  @Get('test')
  @Public()
  testEndpoint() {
    return {
      message: 'Test endpoint working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  healthCheck() {
    try {
      this.logger.log('Health check endpoint called');
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      this.logger.error('Error in health check endpoint:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Error checking health status'
      };
    }
  }
}
