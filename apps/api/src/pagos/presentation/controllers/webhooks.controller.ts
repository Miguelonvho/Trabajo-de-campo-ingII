import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IPagosService } from '../../application/services/pagos.service.interface';

/**
 * Controlador para la recepción de Webhooks de Mercado Pago.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  public constructor(private readonly pagosService: IPagosService) {}

  /**
   * Recibe la notificación de eventos desde Mercado Pago.
   * Responde de inmediato con HTTP 200 OK y delega el procesamiento en segundo plano.
   */
  @ApiOperation({ summary: 'Recibe notificaciones webhook de Mercado Pago' })
  @ApiResponse({ status: 200, description: 'Notificación recibida.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'payment' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ID_DE_LA_SUSCRIPCION_reject' }
          }
        }
      }
    }
  })
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  public async recibirNotificacion(
    @Body() payload: any,
  ): Promise<{ recibido: boolean }> {
    this.logger.log(`Notificación recibida en Webhook: ${JSON.stringify(payload)}`);

    const type = payload.type || payload.action;
    // Mercado Pago envía el ID en payload.data.id para notificaciones de la API v2
    const paymentId = payload.data?.id || payload.id;

    if ((type === 'payment' || type === 'payment.created' || type === 'payment.updated') && paymentId) {
      // Disparar procesamiento asíncrono en background
      this.pagosService.procesarNotificacionPago(paymentId.toString()).catch((err) => {
        this.logger.error(`Error procesando cobro asíncrono para ID ${paymentId}:`, err);
      });
    } else {
      this.logger.log(`Evento de webhook no soportado o ID de pago no provisto: type=${type}`);
    }

    // Retorna de inmediato 200 OK para evitar bloqueos/reintentos de Mercado Pago
    return { recibido: true };
  }
}
