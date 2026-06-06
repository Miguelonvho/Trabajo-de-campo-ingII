import { Pago } from '../entities/pago.entity';

/**
 * Interfaz abstracta que define las operaciones permitidas para el repositorio de Pagos.
 */
export abstract class IPagosRepository {
  /**
   * Registra un nuevo pago en el sistema.
   */
  public abstract crearPago(pago: Pago): Promise<Pago>;

  /**
   * Actualiza el estado de un pago existente.
   */
  public abstract actualizarPago(pago: Pago): Promise<Pago>;

  /**
   * Busca un pago por su ID único.
   */
  public abstract buscarPagoPorId(id: string): Promise<Pago | null>;

  /**
   * Busca un pago utilizando el ID devuelto por Mercado Pago (mp_payment_id).
   */
  public abstract buscarPagoPorMpId(mpPaymentId: string): Promise<Pago | null>;

  /**
   * Busca dinámicamente el UUID del estado del pago en la base de datos usando su nombre (ej: 'APROBADO').
   */
  public abstract buscarEstadoIdPorNombre(
    estadoNombre: string,
  ): Promise<string | null>;

  /**
   * Busca dinámicamente el UUID de la moneda en la base de datos usando su código (ej: 'ARS').
   */
  public abstract buscarMonedaIdPorNombre(
    monedaNombre: string,
  ): Promise<string | null>;
}
