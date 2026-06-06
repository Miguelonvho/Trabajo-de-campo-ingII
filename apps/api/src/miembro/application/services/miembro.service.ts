import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { IMiembroRepository } from '../../domain/ports/miembro.repository.interface';
import { IMiembroService } from './miembro.service.interface';
import { IUsuariosService } from '../../../usuarios/services/usuarios.service.interface';
import { Miembro } from '../../domain/entities/miembro.entity';
import type {
  AgregarMiembroCommand,
  CambiarRolMiembroCommand,
  RemoverMiembroCommand,
} from '../commands/miembro.commands';
import {
  MiembroNoEncontradoException,
  MiembroYaExistenteException,
  RolNoEncontradoException,
  ComunidadNoEncontradaException,
} from '../../domain/exceptions';

/**
 * Implementación del servicio de gestión de miembros.
 * Orquestra la lógica para unir usuarios a comunidades, gestionar sus roles y verificar permisos.
 */
@Injectable()
export class MiembroService implements IMiembroService {
  public constructor(
    private readonly repository: IMiembroRepository,
    private readonly usuariosService: IUsuariosService,
  ) {}

  /**
   * Une a un usuario a una comunidad.
   * Valida la existencia del usuario, la comunidad y que no sea ya miembro.
   */
  @Transactional()
  public async agregarMiembro(command: AgregarMiembroCommand): Promise<void> {
    const { id_usuario, id_comunidad, id_rol } = command;

    const usuario = await this.usuariosService.buscarPorId(id_usuario);
    if (!usuario) {
      throw new MiembroNoEncontradoException(id_usuario, id_comunidad);
    }

    if (!(await this.repository.existeComunidad(id_comunidad))) {
      throw new ComunidadNoEncontradaException(id_comunidad);
    }

    const existe = await this.repository.buscarMiembroPorId(
      id_usuario,
      id_comunidad,
    );
    if (existe) {
      if (existe.activo) {
        throw new MiembroYaExistenteException(id_usuario, id_comunidad);
      } else {
        existe.activar();
        if (existe.id_rol_comunidad !== id_rol) {
          existe.cambiarRol(id_rol);
        }
        await this.repository.actualizarMiembro(existe);
        return;
      }
    }

    const miembro = Miembro.crearMiembro({
      id_usuario,
      id_comunidad,
      id_rol_comunidad: id_rol,
    });

    await this.repository.crearMiembro(miembro);
  }

  /**
   * Actualiza el rol de un miembro en una comunidad.
   * Verifica que el miembro exista y que el nuevo rol sea válido.
   */
  @Transactional()
  public async cambiarRolMiembro(
    command: CambiarRolMiembroCommand,
  ): Promise<void> {
    const { id_usuario, id_comunidad, id_rol_nuevo } = command;

    const miembro = await this.repository.buscarMiembroPorId(
      id_usuario,
      id_comunidad,
    );
    if (!miembro) {
      throw new MiembroNoEncontradoException(id_usuario, id_comunidad);
    }

    if (!(await this.repository.existeRol(id_rol_nuevo))) {
      throw new RolNoEncontradoException(id_rol_nuevo);
    }

    miembro.cambiarRol(id_rol_nuevo);
    await this.repository.actualizarMiembro(miembro);
  }

  /**
   * Verifica si un usuario posee el rol de creador en una comunidad específica.
   * @param id_usuario ID del usuario.
   * @param id_comunidad ID de la comunidad.
   * @returns True si es el creador.
   */
  public async esCreador(
    id_usuario: string,
    id_comunidad: string,
  ): Promise<boolean> {
    return this.repository.esCreadorDeComunidad(id_usuario, id_comunidad);
  }

  public async buscarMiembro(
    id_usuario: string,
    id_comunidad: string,
  ): Promise<Miembro | null> {
    const miembro = await this.repository.buscarMiembroPorId(
      id_usuario,
      id_comunidad,
    );
    if (miembro && !miembro.activo) {
      return null;
    }
    return miembro;
  }

  /**
   * Elimina un usuario como miembro de una comunidad.
   */
  @Transactional()
  public async removerMiembro(command: RemoverMiembroCommand): Promise<void> {
    const { id_usuario, id_comunidad } = command;

    const miembro = await this.repository.buscarMiembroPorId(
      id_usuario,
      id_comunidad,
    );
    if (!miembro || !miembro.activo) {
      throw new MiembroNoEncontradoException(id_usuario, id_comunidad);
    }

    miembro.desactivar();
    await this.repository.actualizarMiembro(miembro);
  }
}
