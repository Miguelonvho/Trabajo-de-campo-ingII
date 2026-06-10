import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class SinComunidadesActivasException extends DomainException {
  constructor() {
    super('Sin comunidades activas', HttpStatus.NOT_FOUND);
    this.name = 'SinComunidadesActivasException';
  }
}
