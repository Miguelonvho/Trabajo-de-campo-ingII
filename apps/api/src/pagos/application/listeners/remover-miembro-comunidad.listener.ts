import { PagoListener } from '../../domain/pago-listener.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../../../planes/application/services/planes.service.interface';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { MiembroNoEncontradoException } from '../../../miembro/domain/exceptions';

export class RemoverMiembroComunidadListener implements PagoListener {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly planesService: IPlanesService,
    private readonly miembroService: IMiembroService,
  ) {}

  public async update(pago: Pago): Promise<void> {
    const suscripcion = await this.suscripcionesRepository
      .buscarSuscripcionPorId(pago.id_suscripcion);

    if (!suscripcion) return;

    const plan = await this.planesService.getPlan(
      suscripcion.id_plan_comunidad
    );

    try {
      await this.miembroService.removerMiembro({
        id_usuario: suscripcion.id_usuario,
        id_comunidad: plan.id_comunidad,
      });
    } catch (error: any) {
      if (!(error instanceof MiembroNoEncontradoException)) {
        throw error;
      }
    }
  }
}

