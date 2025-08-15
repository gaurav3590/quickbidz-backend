import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import moment from 'moment';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log errors but not 401/403 which are normal auth flows
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : 'Unknown error',
      );
      
      // Log more details for debugging
      if (exception instanceof Error) {
        console.error('Detailed error information:', {
          name: exception.name,
          message: exception.message,
          stack: exception.stack,
        });
      } else {
        console.error('Unknown error type:', exception);
      }
    } else if (
      status !== HttpStatus.UNAUTHORIZED &&
      status !== HttpStatus.FORBIDDEN
    ) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.message : 'Unknown error',
      );
    }

    let message = 'Internal server error';
    let details = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const errorResponse = exceptionResponse as any;
        message = errorResponse.message || message;
        details = errorResponse.details || errorResponse.error || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // In development, include more error details
    const isDev = process.env.NODE_ENV !== 'production';
    
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      details: details || undefined,
      ...(isDev && exception instanceof Error ? { 
        stack: exception.stack,
        name: exception.name
      } : {})
    });
  }
}
