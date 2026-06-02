import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class SuscripcionYaActivaException extends DomainException {
  constructor(id?: string) {
    const msg = id
      ? `La suscripción ya está activa (ID: ${id})`
      : 'La suscripción ya está activa';
    super(msg, HttpStatus.CONFLICT);
    this.name = 'SuscripcionYaActivaException';
  }
}
