import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { IPagosService } from './pagos.service.interface';
import { IPagosRepository } from '../../domain/ports/pagos.repository.interface';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IMercadoPagoService } from '../../../mercadopago/services/mercadopago.service.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { DatosPagoNotificado } from '../commands/pagos.commands';

/**
 * Servicio encargado de la orquestación del procesamiento de pagos.
 */
@Injectable()
export class PagosService implements IPagosService {
  private readonly logger = new Logger(PagosService.name);

  public constructor(
    private readonly pagosRepository: IPagosRepository,
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly mercadoPagoService: IMercadoPagoService,
  ) {}

  /**
   * Valida un pago proveniente de Mercado Pago y actualiza el estado de la suscripción asociada.
   */
  @Transactional()
  public async procesarNotificacionPago(paymentId: string): Promise<void> {
    this.logger.log(`Procesando notificación de pago: ${paymentId}`);

    // 1. Evitar doble procesamiento (Idempotencia)
    if (await this.esPagoDuplicado(paymentId)) {
      return;
    }

    // 2. Obtener y aislar los detalles del pago de la pasarela de pagos
    const datosPago = await this.obtenerDatosPagoNotificado(paymentId);
    if (!datosPago) {
      return;
    }

    // 3. Buscar la suscripción asociada en la base de datos local
    const suscripcion = await this.suscripcionesRepository.buscarSuscripcionPorMpId(
      datosPago.externalPreapprovalId,
    );
    if (!suscripcion) {
      this.logger.warn(
        `No se encontró una suscripción local vinculada al preapproval_id ${datosPago.externalPreapprovalId}.`,
      );
      return;
    }

    // 4. Inicializar y guardar la entidad de pago en estado PENDIENTE
    const pago = await this.inicializarPagoEntidad(suscripcion.suscripcion_id, datosPago);
    await this.pagosRepository.crearPago(pago);

    // 5. Si el pago fue aprobado/rechazado, ejecutar el cambio de estado e iniciar observadores
    await this.procesarTransicionDeEstado(pago, datosPago);
  }

  // --- Métodos de Ayuda Auxiliares para Modularizar y Cumplir SRP ---

  /**
   * Verifica si el pago ya se encuentra registrado en el sistema local.
   */
  private async esPagoDuplicado(paymentId: string): Promise<boolean> {
    const pagoExistente = await this.pagosRepository.buscarPagoPorMpId(paymentId);
    if (pagoExistente) {
      this.logger.log(`El pago con id de Mercado Pago ${paymentId} ya se encuentra registrado.`);
      return true;
    }
    return false;
  }

  /**
   * Obtiene la información del pago desde Mercado Pago y la normaliza al formato interno de la aplicación.
   */
  private async obtenerDatosPagoNotificado(paymentId: string): Promise<DatosPagoNotificado | null> {
    try {
      const paymentData = await this.mercadoPagoService.getPayment(paymentId);
      const preapprovalId =
        paymentData.preapproval_id || (paymentData.metadata && paymentData.metadata.preapproval_id);

      if (!preapprovalId) {
        this.logger.warn(`El pago ${paymentId} no contiene un preapproval_id (suscripción asociada).`);
        return null;
      }

      return {
        paymentId,
        externalPreapprovalId: preapprovalId,
        amount: Number(paymentData.transaction_amount),
        netAmount:
          paymentData.transaction_details && paymentData.transaction_details.net_received_amount
            ? Number(paymentData.transaction_details.net_received_amount)
            : null,
        currencyCode: paymentData.currency_id || 'ARS',
        paymentMethodId: paymentData.payment_method_id,
        description: paymentData.description || null,
        status: paymentData.status,
        rawPayload: paymentData,
      };
    } catch (error) {
      this.logger.error(`Error al recuperar datos del pago ${paymentId} de Mercado Pago`, error);
      throw error;
    }
  }

  /**
   * Resuelve identidades del sistema e inicializa la entidad Pago en estado PENDIENTE.
   */
  private async inicializarPagoEntidad(suscripcionId: string, datos: DatosPagoNotificado): Promise<Pago> {
    const idEstadoPendiente = await this.pagosRepository.buscarEstadoIdPorNombre('pending');
    const idMoneda = await this.pagosRepository.buscarMonedaIdPorNombre(datos.currencyCode);

    if (!idEstadoPendiente || !idMoneda) {
      throw new InternalServerErrorException(
        'Configuraciones iniciales de moneda o estados de pago no configuradas en BD',
      );
    }

    return Pago.crearPago({
      id_suscripcion: suscripcionId,
      monto: datos.amount,
      id_moneda: idMoneda,
      id_estado_pendiente: idEstadoPendiente,
      mp_payment_id: datos.paymentId,
      monto_neto: datos.netAmount,
      mp_payload_respuesta: datos.rawPayload,
      mp_payment_method_id: datos.paymentMethodId,
      descripcion: datos.description,
    });
  }

  /**
   * Ejecuta las transiciones de estado aprobadas o rechazadas de la entidad de pago y persiste la actualización.
   */
  private async procesarTransicionDeEstado(pago: Pago, datos: DatosPagoNotificado): Promise<void> {
    if (datos.status === 'approved') {
      const idEstadoAprobado = await this.pagosRepository.buscarEstadoIdPorNombre('approved');
      if (!idEstadoAprobado) {
        throw new InternalServerErrorException('El estado approved no está configurado en BD');
      }

      // El método aprobarPago cambia el estado de la entidad y lanza la notificación al manager
      await pago.aprobarPago(idEstadoAprobado);

      // Guardar la actualización de estado del pago
      await this.pagosRepository.actualizarPago(pago);
      this.logger.log(`Pago ${datos.paymentId} procesado y aprobado exitosamente.`);
    } else if (datos.status === 'rejected') {
      const idEstadoRechazado = await this.pagosRepository.buscarEstadoIdPorNombre('rejected');
      if (idEstadoRechazado) {
        await pago.rechazarPago(idEstadoRechazado);
        await this.pagosRepository.actualizarPago(pago);
      }
      this.logger.log(`Pago ${datos.paymentId} procesado con estado rejected.`);
    }
  }
}
