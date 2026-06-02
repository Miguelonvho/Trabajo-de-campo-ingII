import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { IPagosService } from './pagos.service.interface';
import { IPagosRepository } from '../infrastructure/pagos.repository.interface';
import { ISuscripcionesRepository } from '../../suscripciones/infrastructure/suscripciones.repository.interface';
import { IMercadoPagoService } from '../../mercadopago/services/mercadopago.service.interface';
import { Pago } from '../models/pago.entity';

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
    const pagoExistente = await this.pagosRepository.buscarPagoPorMpId(paymentId);
    if (pagoExistente) {
      this.logger.log(`El pago con id de Mercado Pago ${paymentId} ya se encuentra registrado.`);
      return;
    }

    // 2. Obtener los detalles del pago de Mercado Pago
    let paymentData: any;
    try {
      paymentData = await this.mercadoPagoService.getPayment(paymentId);
    } catch (error) {
      this.logger.error(`Error al recuperar datos del pago ${paymentId} de Mercado Pago`, error);
      throw error;
    }

    // 3. Buscar la suscripción asociada en base al preapproval_id de Mercado Pago
    const preapprovalId = paymentData.preapproval_id || (paymentData.metadata && paymentData.metadata.preapproval_id);
    if (!preapprovalId) {
      this.logger.warn(`El pago ${paymentId} no contiene un preapproval_id (suscripción asociada).`);
      return;
    }

    const suscripcion = await this.suscripcionesRepository.buscarSuscripcionPorMpId(preapprovalId);
    if (!suscripcion) {
      this.logger.warn(`No se encontró una suscripción local vinculada al preapproval_id ${preapprovalId}.`);
      return;
    }

    // 4. Resolver dinámicamente los IDs necesarios en la BD
    const idEstadoPendiente = await this.pagosRepository.buscarEstadoIdPorNombre('PENDIENTE');
    const idMoneda = await this.pagosRepository.buscarMonedaIdPorNombre(paymentData.currency_id || 'ARS');

    if (!idEstadoPendiente || !idMoneda) {
      throw new InternalServerErrorException(
        'Configuraciones iniciales de moneda o estados de pago no configuradas en BD',
      );
    }

    // 5. Crear la entidad de dominio Pago en estado PENDIENTE
    const pago = Pago.crearPago({
      id_suscripcion: suscripcion.suscripcion_id,
      monto: Number(paymentData.transaction_amount),
      id_moneda: idMoneda,
      id_estado_pendiente: idEstadoPendiente,
      mp_payment_id: paymentId,
      monto_neto: paymentData.transaction_details && paymentData.transaction_details.net_received_amount 
        ? Number(paymentData.transaction_details.net_received_amount) 
        : null,
      mp_payload_respuesta: paymentData,
      mp_payment_method_id: paymentData.payment_method_id,
      descripcion: paymentData.description || null,
    });

    // Guardar el pago inicial en la base de datos
    await this.pagosRepository.crearPago(pago);

    // 6. Si el pago fue aprobado, ejecutar el cambio de estado e iniciar el patrón Observer
    if (paymentData.status === 'approved') {
      const idEstadoAprobado = await this.pagosRepository.buscarEstadoIdPorNombre('APROBADO');
      if (!idEstadoAprobado) {
        throw new InternalServerErrorException('El estado APROBADO no está configurado en BD');
      }

      // El método aprobarPago cambia el estado de la entidad y lanza la notificación al manager
      pago.aprobarPago(idEstadoAprobado);

      // Guardar la actualización de estado del pago
      await this.pagosRepository.actualizarPago(pago);
      this.logger.log(`Pago ${paymentId} procesado y aprobado exitosamente.`);
    } else if (paymentData.status === 'rejected') {
      const idEstadoRechazado = await this.pagosRepository.buscarEstadoIdPorNombre('RECHAZADO');
      if (idEstadoRechazado) {
        pago.rechazarPago(idEstadoRechazado);
        await this.pagosRepository.actualizarPago(pago);
      }
      this.logger.log(`Pago ${paymentId} procesado con estado RECHAZADO.`);
    }
  }
}
