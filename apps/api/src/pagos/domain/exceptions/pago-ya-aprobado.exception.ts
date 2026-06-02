import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class PagoYaAprobadoException extends DomainException {
  constructor(id?: string) {
    const msg = id
      ? `El pago ya se encuentra aprobado (ID: ${id})`
      : 'El pago ya se encuentra aprobado';
    super(msg, HttpStatus.CONFLICT);
    this.name = 'PagoYaAprobadoException';
  }
}
