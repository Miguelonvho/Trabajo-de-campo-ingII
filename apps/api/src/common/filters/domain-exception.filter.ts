import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { DomainException } from '../exceptions/domain.exception';
import { Response } from 'express';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
