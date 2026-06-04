import { Pago } from './entities/pago.entity';

/**
 * Interfaz que deben implementar todos los observadores de eventos de pagos.
 */
export interface PagoListener {
  /**
   * Método de callback ejecutado cuando el sujeto publica la notificación.
   *
   * @param pago - Instancia del pago modificado.
   */
  update(pago: Pago): Promise<void> | void;
}
