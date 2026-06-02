/**
 * Datos necesarios para registrar un plan de suscripción en Mercado Pago.
 */
export interface CrearPreapprovalPlanData {
  readonly titulo: string;
  readonly descripcion?: string;
  readonly precio: number;
  readonly frecuencia: number;
  readonly tipo_frecuencia: string;
  readonly moneda: string;
  readonly back_url: string;
}

/**
 * Puerto (Interfaz) para la integración con Mercado Pago.
 */
export abstract class IMercadoPagoService {
  /**
   * Registra un plan de suscripción recurrente en Mercado Pago.
   *
   * @param data - Datos para la creación del plan.
   * @returns El ID del plan generado por Mercado Pago.
   */
  public abstract createPreapprovalPlan(
    data: CrearPreapprovalPlanData,
  ): Promise<{ mp_preapproval_plan_id: string }>;

  /**
   * Cancela un plan existente en Mercado Pago.
   * Se utiliza generalmente como acción de compensación si falla el flujo de negocio.
   *
   * @param mp_preapproval_plan_id - ID del plan en Mercado Pago.
   */
  public abstract cancelPreapprovalPlan(
    mp_preapproval_plan_id: string,
  ): Promise<void>;

  /**
   * Registra una suscripción (PreApproval) vinculada a un plan existente y un token de tarjeta.
   *
   * @param planId - ID del plan en Mercado Pago (preapproval_plan_id).
   * @param email - Email del pagador.
   * @param cardTokenId - Token de la tarjeta obtenido en el frontend.
   * @returns El ID de la suscripción y el punto de inicio.
   */
  public abstract createSubscription(
    planId: string,
    email: string,
    cardTokenId: string,
  ): Promise<{ mp_subscription_id: string; init_point?: string }>;

  /**
   * Obtiene la información detallada de un pago a partir de su identificador.
   *
   * @param paymentId - ID del pago de Mercado Pago.
   * @returns La información cruda del pago.
   */
  public abstract getPayment(paymentId: string): Promise<any>;
}

