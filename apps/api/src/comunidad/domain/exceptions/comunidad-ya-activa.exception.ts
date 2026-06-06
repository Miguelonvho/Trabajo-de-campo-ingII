import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class ComunidadYaActivaException extends DomainException {
  constructor(idComunidad?: string) {
    const msg = idComunidad
      ? `La comunidad ya está activa (ID: ${idComunidad})`
      : 'La comunidad ya está activa';
    super(msg, HttpStatus.CONFLICT);
    this.name = 'ComunidadYaActivaException';
  }
}
