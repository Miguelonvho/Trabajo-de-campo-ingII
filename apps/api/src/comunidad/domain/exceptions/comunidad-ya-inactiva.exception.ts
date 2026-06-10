import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class ComunidadYaInactivaException extends DomainException {
  constructor(idComunidad?: string) {
    const msg = idComunidad
      ? `La comunidad ya está inactiva (ID: ${idComunidad})`
      : 'La comunidad ya está inactiva';
    super(msg, HttpStatus.CONFLICT);
    this.name = 'ComunidadYaInactivaException';
  }
}
