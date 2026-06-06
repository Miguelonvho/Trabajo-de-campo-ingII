import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class PlanNotFoundException extends DomainException {
  constructor(id?: string) {
    super('Plan no disponible', HttpStatus.NOT_FOUND);
    this.name = 'PlanNotFoundException';
  }
}

