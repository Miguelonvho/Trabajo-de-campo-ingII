import { miembro_comunidad } from '@prisma/client';
import { Miembro } from '../../../domain/entities/miembro.entity';

/**
 * Mapper para transformar entidades de membresía de Prisma a objetos de dominio.
 */
export class MiembroMapper {
  /**
   * Transforma un registro de la tabla miembro_comunidad a un objeto de dominio.
   *
   * @param miembro - El registro crudo de la base de datos.
   * @returns Un objeto con la estructura de dominio para membresía.
   */
  public static toDomain(miembro: miembro_comunidad): Miembro {
    return Miembro.reconstituirMiembro({
      id_usuario: miembro.id_usuario,
      id_comunidad: miembro.id_comunidad,
      id_rol_comunidad: miembro.id_rol_comunidad,
      fecha_ingreso: miembro.fecha_ingreso,
      fecha_actualizacion: miembro.fecha_actualizacion,
      activo: miembro.activo,
    });
  }
}
