import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception';

export class UsuarioNoEncontradoException extends DomainException {
  constructor(id_usuario: string) {
    super(
      `El usuario (ID: ${id_usuario}) no fue encontrado`,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UsuarioNoEncontradoException';
  }
}
