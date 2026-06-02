import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { IPagosRepository } from '../../../domain/ports/pagos.repository.interface';
import { Pago } from '../../../domain/entities/pago.entity';
import { PagosMapper } from '../mappers/pagos.mapper';

/**
 * Implementación de IPagosRepository usando Prisma Client y nestjs-cls.
 */
@Injectable()
export class PrismaPagosRepository implements IPagosRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  /**
   * Registra un nuevo pago en la base de datos.
   */
  public async crearPago(pago: Pago): Promise<Pago> {
    const persistido = await this.txHost.tx.pago.create({
      data: {
        id_pago: pago.id_pago,
        id_suscripcion: pago.id_suscripcion,
        monto: pago.monto,
        monto_neto: pago.monto_neto,
        mp_payment_id: pago.mp_payment_id,
        id_estado: pago.id_estado,
        fecha_pago: pago.fecha_pago,
        id_moneda: pago.id_moneda,
        mp_payload_respuesta: pago.mp_payload_respuesta ?? undefined,
        fecha_creacion: pago.fecha_creacion,
        fecha_actualizacion: pago.fecha_actualizacion,
        mp_payment_method_id: pago.mp_payment_method_id,
        descripcion: pago.descripcion,
      },
    });
    return PagosMapper.toDomain(persistido);
  }

  /**
   * Actualiza los datos de un pago existente (ej. tras la aprobación).
   */
  public async actualizarPago(pago: Pago): Promise<Pago> {
    const persistido = await this.txHost.tx.pago.update({
      where: { id_pago: pago.id_pago },
      data: {
        id_estado: pago.id_estado,
        fecha_pago: pago.fecha_pago,
        fecha_actualizacion: pago.fecha_actualizacion,
        mp_payload_respuesta: pago.mp_payload_respuesta ?? undefined,
      },
    });
    return PagosMapper.toDomain(persistido);
  }

  /**
   * Busca un pago utilizando su UUID de dominio.
   */
  public async buscarPagoPorId(id: string): Promise<Pago | null> {
    const res = await this.txHost.tx.pago.findUnique({
      where: { id_pago: id },
    });
    if (!res) return null;
    return PagosMapper.toDomain(res);
  }

  /**
   * Busca un pago utilizando el ID devuelto por la pasarela de Mercado Pago.
   */
  public async buscarPagoPorMpId(mpPaymentId: string): Promise<Pago | null> {
    const res = await this.txHost.tx.pago.findUnique({
      where: { mp_payment_id: mpPaymentId },
    });
    if (!res) return null;
    return PagosMapper.toDomain(res);
  }

  /**
   * Obtiene dinámicamente el UUID del estado del pago buscando por su nombre.
   */
  public async buscarEstadoIdPorNombre(estadoNombre: string): Promise<string | null> {
    const estado = await this.txHost.tx.estado_pago.findFirst({
      where: { estado: { equals: estadoNombre, mode: 'insensitive' } },
    });
    if (!estado) return null;
    return estado.id_estado_pago;
  }

  /**
   * Obtiene dinámicamente el UUID de la moneda buscando por su descripción ISO (ej. 'ARS').
   */
  public async buscarMonedaIdPorNombre(monedaNombre: string): Promise<string | null> {
    const res = await this.txHost.tx.moneda.findFirst({
      where: { moneda: { equals: monedaNombre, mode: 'insensitive' } },
    });
    if (!res) return null;
    return res.id_moneda;
  }
}
