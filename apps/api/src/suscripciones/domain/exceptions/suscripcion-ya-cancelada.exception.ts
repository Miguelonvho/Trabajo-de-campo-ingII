import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class SuscripcionYaCanceladaException extends DomainException {
  constructor(id?: string) {
    const msg = id
      ? `La suscripción ya está cancelada (ID: ${id})`
      : 'La suscripción ya está cancelada';
    super(msg, HttpStatus.CONFLICT);
    this.name = 'SuscripcionYaCanceladaException';
  }
}
