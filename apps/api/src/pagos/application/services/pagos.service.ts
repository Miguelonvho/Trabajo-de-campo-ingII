import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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
  ) { }

  /**
   * Valida un pago proveniente de Mercado Pago y actualiza el estado de la suscripción asociada.
   */
  @Transactional()
  public async procesarPago(id_pago: string): Promise<void> {

    // 1. Evitar doble procesamiento (Idempotencia)
    if (await this.esPagoDuplicado(id_pago)) {
      return;
    }

    // 2. Obtener y aislar los detalles del pago de la pasarela de pagos
    const datosPago = await this.obtenerDatosPago(id_pago);
    if (!datosPago) {
      return;
    }

    // 3. Buscar la suscripción asociada en la base de datos local
    const suscripcion =
      await this.suscripcionesRepository.buscarSuscripcionPorMpId(
        datosPago.externalPreapprovalId,
      );
    if (!suscripcion) {
      this.logger.warn(
        `No se encontró una suscripción local vinculada al preapproval_id ${datosPago.externalPreapprovalId}.`,
      );
      return;
    }

    // 4. Inicializar la entidad de pago en estado PENDIENTE en memoria
    const pago = await this.inicializarPagoEntidad(
      suscripcion.suscripcion_id,
      datosPago,
    );


    const status = datosPago.status;
    if (status === 'approved' || status === 'rejected') {
      const idEstado = await this.pagosRepository.buscarEstadoIdPorNombre(status);
      if (!idEstado) {
        throw new InternalServerErrorException(
          `El estado ${status} no está configurado en BD`,
        );
      } else if (status === 'approved') {
        await pago.aprobarPago(idEstado);
      } else {
        await pago.rechazarPago(idEstado);
      }
    }


    // 6. Persistir el pago con su estado final en la base de datos (INSERT único)
    await this.pagosRepository.crearPago(pago);
  }

  // --- Métodos de Ayuda Auxiliares para Modularizar y Cumplir SRP ---

  /**
   * Verifica si el pago ya se encuentra registrado en el sistema local.
   */
  private async esPagoDuplicado(id_pago: string): Promise<boolean> {
    const pagoExistente =
      await this.pagosRepository.buscarPagoPorMpId(id_pago);
    if (pagoExistente) {
      this.logger.log(
        `El pago con id de Mercado Pago ${id_pago} ya se encuentra registrado.`,
      );
      return true;
    }
    return false;
  }

  /**
   * Obtiene la información del pago desde Mercado Pago y la normaliza al formato interno de la aplicación.
   */
  private async obtenerDatosPago(
    id_pago: string,
  ): Promise<DatosPagoNotificado | null> {
    try {
      const paymentData = await this.mercadoPagoService.getPayment(id_pago);
      const preapprovalId =
        paymentData.preapproval_id ||
        (paymentData.metadata && paymentData.metadata.preapproval_id);

      if (!preapprovalId) {
        this.logger.warn(
          `El pago ${id_pago} no contiene un preapproval_id (suscripción asociada).`,
        );
        return null;
      }

      return {
        id_pago,
        externalPreapprovalId: preapprovalId,
        amount: Number(paymentData.transaction_amount),
        netAmount:
          paymentData.transaction_details &&
            paymentData.transaction_details.net_received_amount
            ? Number(paymentData.transaction_details.net_received_amount)
            : null,
        currencyCode: paymentData.currency_id || 'ARS',
        paymentMethodId: paymentData.payment_method_id,
        description: paymentData.description || null,
        status: paymentData.status,
        rawPayload: paymentData,
      };
    } catch (error) {
      this.logger.error(
        `Error al recuperar datos del pago ${id_pago} de Mercado Pago`,
        error,
      );
      throw error;
    }
  }

  /**
   * Resuelve identidades del sistema e inicializa la entidad Pago en estado PENDIENTE.
   */
  private async inicializarPagoEntidad(
    suscripcionId: string,
    datos: DatosPagoNotificado,
  ): Promise<Pago> {
    const idEstadoPendiente =
      await this.pagosRepository.buscarEstadoIdPorNombre('pending');

    if (!idEstadoPendiente) {
      throw new InternalServerErrorException(
        'Configuraciones iniciales de estados de pago no configuradas en BD',
      );
    }

    return Pago.crearPago({
      id_suscripcion: suscripcionId,
      monto: datos.amount,
      id_estado_pendiente: idEstadoPendiente,
      mp_payment_id: datos.id_pago,
      monto_neto: datos.netAmount,
      mp_payload_respuesta: datos.rawPayload,
      mp_payment_method_id: datos.paymentMethodId,
      descripcion: datos.description,
    });
  }


}
