import { HttpStatus } from '@nestjs/common';

export class DomainException extends Error {
  public readonly statusCode: number;

  public constructor(
    message: string,
    statusCode: number = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super(message);
    this.name = 'DomainException';
    this.statusCode = statusCode;
  }
}
