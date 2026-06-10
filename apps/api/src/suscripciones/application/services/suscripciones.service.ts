import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ISuscripcionesService } from './suscripciones.service.interface';
import { ISuscripcionesRepository } from '../../domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../../../planes/application/services/planes.service.interface';
import { IMercadoPagoService } from '../../../mercadopago/services/mercadopago.service.interface';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { MiembroNoEncontradoException } from '../../../miembro/domain/exceptions';
import type { CrearSuscripcionCommand } from '../commands/suscripciones.commands';
import { Suscripcion } from '../../domain/entities/suscripcion.entity';

/**
 * Servicio de Aplicación encargado de gestionar el flujo de negocio de las Suscripciones.
 */
@Injectable()
export class SuscripcionesService implements ISuscripcionesService {
  public constructor(
    private readonly suscripcionesRepository: ISuscripcionesRepository,
    private readonly planesService: IPlanesService,
    private readonly mercadoPagoService: IMercadoPagoService,
    private readonly miembroService: IMiembroService,
  ) {}

  /**
   * Crea una nueva suscripción interactuando con Mercado Pago y guardándola en estado PENDIENTE.
   */
  @Transactional()
  public async crearSuscripcion(
    command: CrearSuscripcionCommand,
    idUsuario: string,
  ): Promise<Suscripcion> {
    // 1. Validar que el plan exista y esté listo (arroja PlanNotFoundException si no existe)
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
    const id_estado_pendiente =
      await this.suscripcionesRepository.buscarEstadoIdPorNombre('pending');
    if (!id_estado_pendiente) {
      throw new InternalServerErrorException(
        'El estado pending no se encuentra configurado en la base de datos',
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

  /**
   * Cancela una suscripción activa de forma lógica y segura.
   *
   * @param idSuscripcion - UUID de la suscripción a cancelar.
   * @param idUsuario - UUID del usuario que solicita la cancelación.
   */
  @Transactional()
  public async cancelarSuscripcion(
    idSuscripcion: string,
    idUsuario: string,
  ): Promise<void> {
    const suscripcion = await this.suscripcionesRepository.buscarSuscripcionPorId(idSuscripcion);
    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (suscripcion.id_usuario !== idUsuario) {
      throw new ForbiddenException(
        'No tienes permisos para cancelar esta suscripción',
      );
    }

    const idEstadoCancelada = await this.suscripcionesRepository.buscarEstadoIdPorNombre('cancelled');
    if (!idEstadoCancelada) {
      throw new InternalServerErrorException(
        'El estado de cancelación no se encuentra configurado en el sistema',
      );
    }

    const plan = await this.planesService.getPlan(suscripcion.id_plan_comunidad);

    suscripcion.cancelar(idEstadoCancelada);

    try {
      await this.suscripcionesRepository.actualizarSuscripcion(suscripcion);
      
      try {
        await this.miembroService.removerMiembro({
          id_usuario: suscripcion.id_usuario,
          id_comunidad: plan.id_comunidad,
        });
      } catch (miembroError: any) {
        if (!(miembroError instanceof MiembroNoEncontradoException)) {
          throw miembroError;
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno al procesar la cancelación de la suscripción, intente nuevamente',
      );
    }
  }

  /**
   * Obtiene la suscripción activa de un usuario en una comunidad específica.
   */
  @Transactional()
  public async obtenerSuscripcionActiva(
    idComunidad: string,
    idUsuario: string,
  ): Promise<Suscripcion | null> {
    try {
      return await this.suscripcionesRepository.buscarSuscripcionActiva(
        idComunidad,
        idUsuario,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno al consultar la suscripción del usuario, intente nuevamente',
      );
    }
  }
}
