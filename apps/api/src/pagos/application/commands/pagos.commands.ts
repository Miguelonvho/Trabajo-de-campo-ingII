/**
 * Interfaz/Comando que representa la información normalizada de un pago notificado
 * desde la pasarela externa de Mercado Pago. Aísla la lógica de negocio de los detalles crudos del JSON.
 */
export interface DatosPagoNotificado {
  readonly id_pago: string;
  readonly externalPreapprovalId: string;
  readonly amount: number;
  readonly netAmount: number | null;
  readonly currencyCode: string;
  readonly paymentMethodId: string;
  readonly description: string | null;
  readonly status: 'approved' | 'rejected' | 'pending' | string;
  readonly rawPayload: any;
}
