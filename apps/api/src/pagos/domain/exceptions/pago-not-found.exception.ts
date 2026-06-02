import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class PagoNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Pago no encontrado (ID: ${id})`, HttpStatus.NOT_FOUND);
    this.name = 'PagoNotFoundException';
  }
}
