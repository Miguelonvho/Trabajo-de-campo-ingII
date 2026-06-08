import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ISuscripcionesRepository } from '../../../domain/ports/suscripciones.repository.interface';
import { Suscripcion } from '../../../domain/entities/suscripcion.entity';
import { SuscripcionesMapper } from '../mappers/suscripciones.mapper';

/**
 * Implementación del repositorio de Suscripciones utilizando Prisma y nestjs-cls.
 */
@Injectable()
export class PrismaSuscripcionesRepository implements ISuscripcionesRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  /**
   * Guarda una nueva suscripción en la base de datos.
   */
  public async crearSuscripcion(
    suscripcion: Suscripcion,
  ): Promise<Suscripcion> {
    const persistido = await this.txHost.tx.suscripcion.create({
      data: {
        suscripcion_id: suscripcion.suscripcion_id,
        fecha_suscripcion: suscripcion.fecha_suscripcion,
        fecha_inicio: suscripcion.fecha_inicio,
        fecha_fin: suscripcion.fecha_fin,
        external_reference: suscripcion.external_reference,
        mp_subscription_id: suscripcion.mp_subscription_id,
        init_point: suscripcion.init_point,
        fecha_actualizacion: suscripcion.fecha_actualizacion,
        fecha_proximo_pago: suscripcion.fecha_proximo_pago,
        back_url: suscripcion.back_url,
        id_usuario: suscripcion.id_usuario,
        id_plan_comunidad: suscripcion.id_plan_comunidad,
        id_estado: suscripcion.id_estado,
      },
    });
    return SuscripcionesMapper.toDomain(persistido);
  }

  /**
   * Actualiza el registro de una suscripción existente.
   */
  public async actualizarSuscripcion(
    suscripcion: Suscripcion,
  ): Promise<Suscripcion> {
    const persistido = await this.txHost.tx.suscripcion.update({
      where: { suscripcion_id: suscripcion.suscripcion_id },
      data: {
        fecha_inicio: suscripcion.fecha_inicio,
        fecha_fin: suscripcion.fecha_fin,
        external_reference: suscripcion.external_reference,
        mp_subscription_id: suscripcion.mp_subscription_id,
        init_point: suscripcion.init_point,
        fecha_actualizacion: suscripcion.fecha_actualizacion,
        fecha_proximo_pago: suscripcion.fecha_proximo_pago,
        id_estado: suscripcion.id_estado,
      },
    });
    return SuscripcionesMapper.toDomain(persistido);
  }

  /**
   * Recupera una suscripción utilizando su UUID de dominio.
   */
  public async buscarSuscripcionPorId(id: string): Promise<Suscripcion | null> {
    const res = await this.txHost.tx.suscripcion.findUnique({
      where: { suscripcion_id: id },
    });
    if (!res) return null;
    return SuscripcionesMapper.toDomain(res);
  }

  /**
   * Recupera una suscripción utilizando el identificador único de suscripción de Mercado Pago (preapproval_id).
   */
  public async buscarSuscripcionPorMpId(
    mpSubscriptionId: string,
  ): Promise<Suscripcion | null> {
    const res = await this.txHost.tx.suscripcion.findUnique({
      where: { mp_subscription_id: mpSubscriptionId },
    });
    if (!res) return null;
    return SuscripcionesMapper.toDomain(res);
  }

  /**
   * Busca dinámicamente el UUID del estado de suscripción por su descripción de texto.
   * Esto elimina los IDs fijos/cableados en el código.
   */
  public async buscarEstadoIdPorNombre(
    estadoNombre: string,
  ): Promise<string | null> {
    const estado = await this.txHost.tx.estado_suscripcion.findFirst({
      where: { estado: { equals: estadoNombre, mode: 'insensitive' } },
    });
    if (!estado) return null;
    return estado.id_estado_suscripcion;
  }

  /**
   * Busca la suscripción activa de un usuario en una comunidad específica.
   */
  public async buscarSuscripcionActiva(
    idComunidad: string,
    idUsuario: string,
  ): Promise<Suscripcion | null> {
    const res = await this.txHost.tx.suscripcion.findFirst({
      where: {
        id_usuario: idUsuario,
        plan_comunidad: {
          id_comunidad: idComunidad,
        },
        estado_suscripcion: {
          estado: 'active',
        },
      },
    });
    if (!res) return null;
    return SuscripcionesMapper.toDomain(res);
  }
}
