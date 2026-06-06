/**
 * Interfaz que define el contrato para el servicio de Pagos.
 */
export abstract class IPagosService {
  /**
   * Procesa la notificación de un pago emitida por el webhook de Mercado Pago.
   * Valida la legitimidad de la transacción, registra el cobro localmente y,
   * si se aprueba, activa los observadores asociados.
   *
   * @param id_pago - ID único del pago devuelto por Mercado Pago.
   */
  public abstract procesarPago(id_pago: string): Promise<void>;
}
