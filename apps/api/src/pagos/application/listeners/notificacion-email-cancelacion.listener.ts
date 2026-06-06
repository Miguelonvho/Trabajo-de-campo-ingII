import { Logger } from '@nestjs/common';
import { PagoListener } from '../../domain/pago-listener.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../../../planes/application/services/planes.service.interface';
import { IUsuariosService } from '../../../usuarios/services/usuarios.service.interface';
import { IComunidadService } from '../../../comunidad/application/services/comunidad.service.interface';

export class NotificacionEmailCancelacionListener implements PagoListener {
  private readonly logger = new Logger(
    NotificacionEmailCancelacionListener.name,
  );

  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly planesService: IPlanesService,
    private readonly usuariosService: IUsuariosService,
    private readonly comunidadService: IComunidadService,
  ) {}

  public async update(pago: Pago): Promise<void> {
    const suscripcion =
      await this.suscripcionesRepository.buscarSuscripcionPorId(
        pago.id_suscripcion,
      );

    if (!suscripcion) return;

    const [usuario, plan] = await Promise.all([
      this.usuariosService.buscarPorId(suscripcion.id_usuario),
      this.planesService.getPlan(suscripcion.id_plan_comunidad),
    ]);

    if (!usuario || !plan) return;

    const comunidad = await this.comunidadService.getComunidad(
      plan.id_comunidad,
    );

    if (!comunidad) return;

    this.logger.log(
      `[MOCK EMAIL SENT] Para: ${usuario.email} | Asunto: Tu suscripción a ${comunidad.nombre} fue cancelada | Cuerpo: Hola ${usuario.nombre}, tu pago de ${plan.moneda?.moneda || 'ARS'} ${pago.monto} fue rechazado y tu acceso a la comunidad ha sido revocado.`,
    );
  }
}
