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
}
