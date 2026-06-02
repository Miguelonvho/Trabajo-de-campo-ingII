import { PagoListener } from '../../domain/pago-listener.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../../../planes/application/services/planes.service.interface';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { ROLES } from '../../../common/constants/roles';

/**
 * Observador encargado de otorgar acceso (membresía) a la comunidad correspondiente
 * una vez que se ha aprobado el pago.
 */
export class AccesoComunidadListener implements PagoListener {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly planesService: IPlanesService,
    private readonly miembroService: IMiembroService,
  ) {}

  /**
   * Al recibir la notificación de pago, asocia al usuario a la comunidad.
   */
  public async update(pago: Pago): Promise<void> {
    const suscripcion =
      await this.suscripcionesRepository.buscarSuscripcionPorId(
        pago.id_suscripcion,
      );
    if (!suscripcion) {
      return;
    }

    const plan = await this.planesService.getPlan(
      suscripcion.id_plan_comunidad,
    );

    try {
      await this.miembroService.agregarMiembro({
        id_usuario: suscripcion.id_usuario,
        id_comunidad: plan.id_comunidad,
        id_rol: ROLES.SUSCRIPTOR,
      });
    } catch (error: any) {
      // Si el usuario ya es miembro (ConflictException / 409), ignoramos el error
      // ya que el acceso ya está concedido.
      if (error.status !== 409 && error.status !== '409') {
        throw error;
      }
    }
  }
}
