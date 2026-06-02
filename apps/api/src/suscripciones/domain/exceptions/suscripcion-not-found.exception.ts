import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class SuscripcionNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Suscripción no encontrada (ID: ${id})`, HttpStatus.NOT_FOUND);
    this.name = 'SuscripcionNotFoundException';
  }
}
