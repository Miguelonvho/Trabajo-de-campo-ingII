import { suscripcion } from '@prisma/client';
import { Suscripcion } from '../models/suscripcion.entity';

/**
 * Mapeador encargado de transformar modelos relacionales de base de datos a entidades de Dominio.
 */
export class SuscripcionesMapper {
  /**
   * Transforma un registro de Prisma a la entidad de dominio Suscripcion.
   */
  public static toDomain(p: suscripcion): Suscripcion {
    return Suscripcion.reconstituirSuscripcion({
      suscripcion_id: p.suscripcion_id,
      fecha_suscripcion: p.fecha_suscripcion,
      fecha_inicio: p.fecha_inicio ?? undefined,
      fecha_fin: p.fecha_fin ?? undefined,
      external_reference: p.external_reference ?? undefined,
      mp_subscription_id: p.mp_subscription_id ?? undefined,
      init_point: p.init_point ?? undefined,
      fecha_actualizacion: p.fecha_actualizacion ?? undefined,
      fecha_proximo_pago: p.fecha_proximo_pago ?? undefined,
      back_url: p.back_url ?? undefined,
      id_usuario: p.id_usuario,
      id_plan_comunidad: p.id_plan_comunidad,
      id_estado: p.id_estado,
    });
  }
}
