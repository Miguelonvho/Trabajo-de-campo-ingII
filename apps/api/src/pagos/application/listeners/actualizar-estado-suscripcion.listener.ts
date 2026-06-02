import { PagoListener } from '../../domain/pago-listener.interface';
import { Pago } from '../../models/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/infrastructure/suscripciones.repository.interface';

/**
 * Observador encargado de actualizar el estado de la suscripción local a ACTIVA.
 */
export class ActualizarEstadoSuscripcionListener implements PagoListener {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
  ) {}

  /**
   * Al ser notificado, busca la suscripción ligada al pago y la activa.
   */
  public async update(pago: Pago): Promise<void> {
    const suscripcion = await this.suscripcionesRepository.buscarSuscripcionPorId(pago.id_suscripcion);
    if (!suscripcion) {
      // Nota: Si no existe localmente, podríamos loguear el error o lanzar una excepción.
      return;
    }

    // Resolver dinámicamente el ID del estado 'ACTIVA'
    const idEstadoActiva = await this.suscripcionesRepository.buscarEstadoIdPorNombre('ACTIVA');
    if (!idEstadoActiva) {
      return;
    }

    // Calcular la fecha del próximo cobro (por defecto +1 mes)
    const proximoCobro = new Date();
    proximoCobro.setMonth(proximoCobro.getMonth() + 1);

    // Ejecutar lógica de dominio de activación de suscripción
    suscripcion.activar(idEstadoActiva, proximoCobro);

    // Guardar cambios en persistencia
    await this.suscripcionesRepository.actualizarSuscripcion(suscripcion);
  }
}
