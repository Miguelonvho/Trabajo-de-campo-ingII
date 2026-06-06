import { Suscripcion } from '../entities/suscripcion.entity';

/**
 * Interfaz abstracta que define las operaciones permitidas para el repositorio de Suscripciones.
 */
export abstract class ISuscripcionesRepository {
  /**
   * Registra una nueva suscripción en el sistema.
   */
  public abstract crearSuscripcion(
    suscripcion: Suscripcion,
  ): Promise<Suscripcion>;

  /**
   * Actualiza los datos de una suscripción existente.
   */
  public abstract actualizarSuscripcion(
    suscripcion: Suscripcion,
  ): Promise<Suscripcion>;

  /**
   * Busca una suscripción por su ID de dominio.
   */
  public abstract buscarSuscripcionPorId(
    id: string,
  ): Promise<Suscripcion | null>;

  /**
   * Busca una suscripción por su ID correspondiente de Mercado Pago (preapproval_id / mp_subscription_id).
   */
  public abstract buscarSuscripcionPorMpId(
    mpSubscriptionId: string,
  ): Promise<Suscripcion | null>;

  /**
   * Busca dinámicamente el UUID de un estado en la base de datos usando su nombre.
   * Esto evita tener UUIDs cableados (hardcoded) en el código.
   *
   * @param estadoNombre - El nombre textual del estado (ej. 'PENDIENTE', 'ACTIVA', 'CANCELADA')
   */
  public abstract buscarEstadoIdPorNombre(
    estadoNombre: string,
  ): Promise<string | null>;
}
