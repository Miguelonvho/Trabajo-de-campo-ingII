'use server';

import { suscripcionService } from '../services/suscripcionService';
import type { ISuscripcion } from '@repo/types';

export async function crearSuscripcionAction(dto: {
  id_plan_comunidad: string;
  token_tarjeta: string;
  email: string;
  back_url?: string;
}): Promise<{ success: boolean; data?: ISuscripcion; error?: string }> {
  try {
    const data = await suscripcionService.crearSuscripcion(dto);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al crear la suscripción' };
  }
}

export async function simularWebhookAction(
  mpSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await suscripcionService.simularWebhook(mpSubscriptionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al simular el webhook' };
  }
}
