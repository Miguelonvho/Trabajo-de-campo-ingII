import { Logger } from '@nestjs/common';
import { PagoObserver } from '../../domain/pago-observer.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../../../planes/application/services/planes.service.interface';
import { IUsuariosService } from '../../../usuarios/services/usuarios.service.interface';
import { IComunidadService } from '../../../comunidad/application/services/comunidad.service.interface';

/**
 * Observador encargado de enviar notificaciones de correo tras el procesamiento exitoso de un pago.
 */
export class NotificacionEmailObserver implements PagoObserver {
  private readonly logger = new Logger(NotificacionEmailObserver.name);

  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly planesService: IPlanesService,
    private readonly usuariosService: IUsuariosService,
    private readonly comunidadService: IComunidadService,
  ) {}

  /**
   * Al recibir la notificación, obtiene la información del usuario y comunidad para simular el correo.
   */
  public async actualizar(pago: Pago): Promise<void> {
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

    // Simulación del envío de correo (Mock de proveedor de emails)
    this.logger.log(
      `[MOCK EMAIL SENT] Para: ${usuario.email} | Asunto: ¡Te damos la bienvenida a ${comunidad.nombre}! | Cuerpo: Hola ${usuario.nombre}, tu pago de ${plan.moneda?.moneda || 'ARS'} ${pago.monto} ha sido procesado con éxito. Ya tienes acceso a la comunidad. Link: /comunidades/${comunidad.slug}`,
    );
  }
}
