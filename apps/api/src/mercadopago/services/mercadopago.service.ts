import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago'; // SDK real para planes
import {
  IMercadoPagoService,
  CrearPreapprovalPlanData,
} from './mercadopago.service.interface';

@Injectable()
export class MercadoPagoService implements IMercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly preApprovalPlan: PreApprovalPlan;

  public constructor(private readonly configService: ConfigService) {
    // Inicialización del cliente real de Mercado Pago para los planes
    const client = new MercadoPagoConfig({
      accessToken: this.configService.getOrThrow<string>('MP_ACCESS_TOKEN'),
    });
    this.preApprovalPlan = new PreApprovalPlan(client);
  }

  /**
   * [REAL] Registra un plan de suscripción recurrente en Mercado Pago de forma real.
   */
  public async createPreapprovalPlan(
    data: CrearPreapprovalPlanData,
  ): Promise<{ mp_preapproval_plan_id: string }> {
    try {
      const response = await this.preApprovalPlan.create({
        body: {
          reason: data.titulo,
          auto_recurring: {
            frequency: data.frecuencia,
            frequency_type: data.tipo_frecuencia,
            transaction_amount: data.precio,
            currency_id: data.moneda,
          },
          back_url: data.back_url,
        },
      });

      if (!response.id) {
        throw new HttpException(
          'No se pudo registrar el plan en Mercado Pago, intentá de nuevo',
          HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.log(`[REAL MP] Plan creado con ID: ${response.id}`);
      return { mp_preapproval_plan_id: response.id };
    } catch (error) {
      this.logger.error('Error al registrar plan en Mercado Pago', error);
      throw new HttpException(
        'No se pudo registrar el plan en Mercado Pago, intentá de nuevo',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * [REAL] Cancela un plan existente en Mercado Pago.
   */
  public async cancelPreapprovalPlan(
    mp_preapproval_plan_id: string,
  ): Promise<void> {
    try {
      await this.preApprovalPlan.update({
        id: mp_preapproval_plan_id,
        updatePreApprovalPlanRequest: {
          status: 'cancelled',
        },
      });
      this.logger.log(
        `Plan de MP ${mp_preapproval_plan_id} cancelado por compensación`,
      );
    } catch (error) {
      this.logger.error(
        `Fallo al cancelar plan de MP ${mp_preapproval_plan_id} en compensación`,
        error,
      );
    }
  }

  /**
   * [SIMULADO] Crea una suscripción simulada local generando un UUID único.
   */
  public async createSubscription(
    planId: string,
    email: string,
    cardTokenId: string,
  ): Promise<{ mp_subscription_id: string; init_point?: string }> {
    // Generación de UUID único para evitar colisiones
    const mockSubId = randomUUID();
    const mockInitPoint = `http://localhost:3000/simulador-pago?subscription_id=${mockSubId}`;

    this.logger.log(
      `[SIMULACIÓN MP] Suscribiendo a ${email} al Plan ${planId} (Token Tarjeta: ${cardTokenId}). UUID generado: ${mockSubId}`,
    );

    return {
      mp_subscription_id: mockSubId,
      init_point: mockInitPoint,
    };
  }

  /**
   * [SIMULADO] Simula la recuperación de los datos del pago para el webhook.
   * Permite al frontend simular rechazos enviando el ID con el sufijo "_reject".
   */
  public async getPayment(paymentId: string): Promise<any> {
    const isRejected = paymentId.endsWith('_reject');
    const status = isRejected ? 'rejected' : 'approved';
    const baseId = isRejected ? paymentId.replace('_reject', '') : paymentId;

    this.logger.log(
      `[SIMULACIÓN MP] Consultando detalles para el pago: ${paymentId} → simulando status: ${status}`,
    );

    return {
      id: paymentId,
      status,
      transaction_amount: 1500,
      currency_id: 'ARS',
      preapproval_id: baseId,
      payment_method_id: 'visa',
      description: 'Cobro de suscripción simulado local',
      transaction_details: {
        net_received_amount: 1420,
      },
    };
  }
}
