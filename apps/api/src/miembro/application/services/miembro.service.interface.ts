import { Miembro } from '../../domain/entities/miembro.entity';
import {
  AgregarMiembroCommand,
  CambiarRolMiembroCommand,
} from '../commands/miembro.commands';

/**
 * Interfaz que define las operaciones de negocio para la gestión de miembros de comunidades.
 * Controla la membresía, roles y permisos dentro de las comunidades.
 */
export abstract class IMiembroService {
  /**
   * Agrega un usuario como miembro de una comunidad con un rol específico.
   * Si el usuario ya es miembro, se puede utilizar para refrescar su estado o actividad.
   *
   * @param command - Datos que contienen id_usuario, id_comunidad e id_rol.
   * @returns Una promesa que se resuelve cuando la operación se completa.
   */
  public abstract agregarMiembro(command: AgregarMiembroCommand): Promise<void>;

  /**
   * Cambia el rol asignado a un miembro existente dentro de una comunidad.
   * Útil para ascender o degradar permisos de usuarios.
   *
   * @param command - Datos con el ID del miembro y el nuevo ID del rol.
   * @returns Una promesa que se resuelve cuando el rol ha sido actualizado.
   */
  public abstract cambiarRolMiembro(
    command: CambiarRolMiembroCommand,
  ): Promise<void>;

  /**
   * Verifica si un usuario posee el rol de 'Creador' en una comunidad determinada.
   * Este método es fundamental para la validación de permisos en acciones administrativas.
   *
   * @param id_usuario - Identificador único del usuario.
   * @param id_comunidad - Identificador único de la comunidad.
   * @returns Una promesa que resuelve true si es el creador, false en caso contrario.
   */
  public abstract esCreador(
    id_usuario: string,
    id_comunidad: string,
  ): Promise<boolean>;

  /**
   * Obtiene la membresía de un usuario en una comunidad si existe.
   *
   * @param id_usuario - Identificador del usuario.
   * @param id_comunidad - Identificador de la comunidad.
   * @returns El registro del miembro o null si no pertenece.
   */
  public abstract buscarMiembro(
    id_usuario: string,
    id_comunidad: string,
  ): Promise<Miembro | null>;
}
