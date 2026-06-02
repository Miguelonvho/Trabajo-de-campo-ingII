import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ISuscripcionesService } from './suscripciones.service.interface';
import { ISuscripcionesRepository } from '../infrastructure/suscripciones.repository.interface';
import { IPlanesService } from '../../planes/services/planes.service.interface';
import { IMercadoPagoService } from '../../mercadopago/services/mercadopago.service.interface';
import type { CrearSuscripcionCommand } from './suscripciones.commands';
import { Suscripcion } from '../models/suscripcion.entity';

/**
 * Servicio de Aplicación encargado de gestionar el flujo de negocio de las Suscripciones.
 */
@Injectable()
export class SuscripcionesService implements ISuscripcionesService {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly planesService: IPlanesService,
    private readonly mercadoPagoService: IMercadoPagoService,
  ) {}

  /**
   * Crea una nueva suscripción interactuando con Mercado Pago y guardándola en estado PENDIENTE.
   */
  @Transactional()
  public async crearSuscripcion(
    command: CrearSuscripcionCommand,
    idUsuario: string,
  ): Promise<Suscripcion> {
    // 1. Validar que el plan exista y esté listo (arroja NotFoundException si no existe)
    const plan = await this.planesService.getPlan(command.id_plan_comunidad);

    if (!plan.mp_preapproval_plan_id) {
      throw new InternalServerErrorException(
        'El plan no está correctamente registrado en Mercado Pago',
      );
    }

    // 2. Comunicarse con la API de Mercado Pago
    const { mp_subscription_id, init_point } =
      await this.mercadoPagoService.createSubscription(
        plan.mp_preapproval_plan_id,
        command.email,
        command.token_tarjeta,
      );

    // 3. Resolver el UUID del estado PENDIENTE de forma dinámica
    const id_estado_pendiente = await this.suscripcionesRepository.buscarEstadoIdPorNombre('PENDIENTE');
    if (!id_estado_pendiente) {
      throw new InternalServerErrorException(
        'El estado PENDIENTE no se encuentra configurado en la base de datos',
      );
    }

    // 4. Crear la entidad de dominio
    const suscripcion = Suscripcion.crearSuscripcion({
      id_usuario: idUsuario,
      id_plan_comunidad: command.id_plan_comunidad,
      id_estado_pendiente,
      mp_subscription_id,
      init_point,
      back_url: command.back_url ?? null,
    });

    // 5. Persistir en la base de datos local
    try {
      return await this.suscripcionesRepository.crearSuscripcion(suscripcion);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno al guardar la suscripción, intente nuevamente',
      );
    }
  }
}
