import { Suscripcion } from '../../domain/entities/suscripcion.entity';
import { CrearSuscripcionCommand } from '../commands/suscripciones.commands';

/**
 * Interfaz que define el contrato para el servicio de Suscripciones.
 */
export abstract class ISuscripcionesService {
  /**
   * Crea e inicia un contrato de suscripción recurrente en Mercado Pago y lo registra en BD local.
   *
   * @param command - Datos requeridos para la suscripción.
   * @param idUsuario - ID del usuario solicitante.
   */
  public abstract crearSuscripcion(
    command: CrearSuscripcionCommand,
    idUsuario: string,
  ): Promise<Suscripcion>;

  /**
   * Cancela de forma lógica una suscripción existente y detiene cualquier simulación de cobro.
   *
   * @param idSuscripcion - Identificador único de la suscripción.
   * @param idUsuario - ID del usuario que solicita la cancelación.
   */
  public abstract cancelarSuscripcion(
    idSuscripcion: string,
    idUsuario: string,
  ): Promise<void>;

  /**
   * Obtiene la suscripción activa de un usuario en una comunidad específica.
   */
  public abstract obtenerSuscripcionActiva(
    idComunidad: string,
    idUsuario: string,
  ): Promise<Suscripcion | null>;
}
