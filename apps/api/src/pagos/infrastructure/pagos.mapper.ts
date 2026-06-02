import { pago } from '@prisma/client';
import { Pago } from '../models/pago.entity';

/**
 * Mapeador para transformar registros de base de datos en entidades de Dominio de Pagos.
 */
export class PagosMapper {
  /**
   * Mapea un registro relacional de Prisma hacia la entidad de dominio Pago.
   */
  public static toDomain(p: pago): Pago {
    return Pago.reconstituirPago({
      id_pago: p.id_pago,
      id_suscripcion: p.id_suscripcion,
      monto: Number(p.monto),
      monto_neto: p.monto_neto ? Number(p.monto_neto) : null,
      mp_payment_id: p.mp_payment_id,
      id_estado: p.id_estado,
      fecha_pago: p.fecha_pago ?? undefined,
      id_moneda: p.id_moneda,
      mp_payload_respuesta: p.mp_payload_respuesta,
      fecha_creacion: p.fecha_creacion,
      fecha_actualizacion: p.fecha_actualizacion ?? undefined,
      mp_payment_method_id: p.mp_payment_method_id,
      descripcion: p.descripcion,
    });
  }
}
