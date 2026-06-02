/**
 * Comando que representa la intención de crear una nueva suscripción.
 */
export interface CrearSuscripcionCommand {
  readonly id_plan_comunidad: string;
  readonly token_tarjeta: string;
  readonly email: string;
  readonly back_url?: string;
}
