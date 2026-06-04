import { api } from '@/shared/lib/api/client';
import type { ISuscripcion } from '@repo/types';

export const suscripcionService = {
  /**
   * Crea una nueva intención de suscripción localmente y en Mercado Pago
   */
  async crearSuscripcion(dto: {
    id_plan_comunidad: string;
    token_tarjeta: string;
    email: string;
    back_url?: string;
  }): Promise<ISuscripcion> {
    return api.post<ISuscripcion>('/suscripciones/comunidad', dto);
  },

  /**
   * Simula el webhook para aprobar el pago asíncronamente en el backend
   */
  async simularWebhook(mpSubscriptionId: string): Promise<{ recibido: boolean }> {
    return api.post<{ recibido: boolean }>('/webhooks/mercadopago', {
      action: 'payment.created',
      type: 'payment',
      data: {
        id: mpSubscriptionId,
      },
    });
  },
};
