import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class SinPlanesDisponiblesException extends DomainException {
  constructor() {
    super('Sin planes disponibles', HttpStatus.NOT_FOUND);
    this.name = 'SinPlanesDisponiblesException';
  }
}
