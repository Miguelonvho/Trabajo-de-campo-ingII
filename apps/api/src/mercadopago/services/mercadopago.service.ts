import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, PreApprovalPlan, PreApproval, Payment } from 'mercadopago';
import {
  IMercadoPagoService,
  CrearPreapprovalPlanData,
} from './mercadopago.service.interface';

@Injectable()
export class MercadoPagoService implements IMercadoPagoService {

  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly preApprovalPlan: PreApprovalPlan;
  private readonly preApproval: PreApproval;
  private readonly payment: Payment;

  public constructor(private readonly configService: ConfigService) {
    const client = new MercadoPagoConfig({
      accessToken: this.configService.getOrThrow<string>('MP_ACCESS_TOKEN'),
    });
    this.preApprovalPlan = new PreApprovalPlan(client);
    this.preApproval = new PreApproval(client);
    this.payment = new Payment(client);
  }

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

      return { mp_preapproval_plan_id: response.id };
    } catch (error) {
      this.logger.error('Error al registrar plan en Mercado Pago', error);
      throw new HttpException(
        'No se pudo registrar el plan en Mercado Pago, intentá de nuevo',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

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

  public async createSubscription(
    planId: string,
    email: string,
    cardTokenId: string,
  ): Promise<{ mp_subscription_id: string; init_point?: string }> {
    try {
      const response = await this.preApproval.create({
        body: {
          preapproval_plan_id: planId,
          payer_email: email,
          card_token_id: cardTokenId,
          status: 'authorized',
        },
      });

      if (!response.id) {
        throw new HttpException(
          'No se pudo registrar la suscripción en Mercado Pago',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return {
        mp_subscription_id: response.id,
        init_point: response.init_point,
      };
    } catch (error) {
      this.logger.error('Error al registrar suscripción en Mercado Pago', error);
      throw new HttpException(
        'Error en pasarela de pagos al registrar la suscripción',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  public async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.payment.get({ id: paymentId });
      return response;
    } catch (error) {
      this.logger.error(`Error al obtener pago ${paymentId} de Mercado Pago`, error);
      throw new HttpException(
        'No se pudo recuperar la información del pago de Mercado Pago',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
