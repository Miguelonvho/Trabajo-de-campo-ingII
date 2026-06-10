import { Pago } from './entities/pago.entity';

/**
 * Interfaz que deben implementar todos los observadores de eventos de pagos.
 */
export interface PagoObserver {
  /**
   * Método de callback ejecutado cuando el sujeto publica la notificación.
   *
   * @param pago - Instancia del pago modificado.
   */
  actualizar(pago: Pago): Promise<void> | void;
}
