import { PagoObserver } from '../../domain/pago-observer.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';

export class DesactivarSuscripcionObserver implements PagoObserver {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
  ) {}

  public async actualizar(pago: Pago): Promise<void> {
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
