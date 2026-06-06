import { PagoListener } from '../../domain/pago-listener.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';

export class DesactivarSuscripcionListener implements PagoListener {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
  ) {}

  public async update(pago: Pago): Promise<void> {
    const suscripcion =
      await this.suscripcionesRepository.buscarSuscripcionPorId(
        pago.id_suscripcion,
      );

    if (!suscripcion) return;

    const idEstadoCancelada =
      await this.suscripcionesRepository.buscarEstadoIdPorNombre('cancelled');

    if (!idEstadoCancelada) return;

    suscripcion.cancelar(idEstadoCancelada);

    await this.suscripcionesRepository.actualizarSuscripcion(suscripcion);
  }
}
