import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module';
import { PlanesModule } from '../planes/planes.module';
import { MiembroModule } from '../miembro/miembro.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ComunidadModule } from '../comunidad/comunidad.module';
import { DomainExceptionFilter } from '../common/filters/domain-exception.filter';

import { WebhooksController } from './presentation/controllers/webhooks.controller';
import { IPagosService } from './application/services/pagos.service.interface';
import { PagosService } from './application/services/pagos.service';
import { IPagosRepository } from './domain/ports/pagos.repository.interface';
import { PrismaPagosRepository } from './infrastructure/persistence/repositories/pagos.prisma.repository';

import { ActualizarEstadoSuscripcionObserver } from './application/observers/actualizar-estado-suscripcion.observer';
import { AccesoComunidadObserver } from './application/observers/acceso-comunidad.observer';
import { NotificacionEmailObserver } from './application/observers/notificacion-email.observer';
import { DesactivarSuscripcionObserver } from './application/observers/desactivar-suscripcion.observer';
import { RemoverMiembroComunidadObserver } from './application/observers/remover-miembro-comunidad.observer';
import { NotificacionEmailCancelacionObserver } from './application/observers/notificacion-email-cancelacion.observer';
import { Pago } from './domain/entities/pago.entity';

import { ISuscripcionesRepository } from '../suscripciones/domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../planes/application/services/planes.service.interface';
import { IMiembroService } from '../miembro/application/services/miembro.service.interface';
import { IUsuariosService } from '../usuarios/services/usuarios.service.interface';
import { IComunidadService } from '../comunidad/application/services/comunidad.service.interface';

@Module({
  imports: [
    PrismaModule,
    MercadoPagoModule,
    SuscripcionesModule,
    PlanesModule,
    MiembroModule,
    UsuariosModule,
    ComunidadModule,
  ],
  controllers: [WebhooksController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    {
      provide: IPagosService,
      useClass: PagosService,
    },
    {
      provide: IPagosRepository,
      useClass: PrismaPagosRepository,
    },
    // Registrar los observers como providers para poder inyectar sus dependencias
    {
      provide: ActualizarEstadoSuscripcionObserver,
      useFactory: (suscripcionesRepository: ISuscripcionesRepository) =>
        new ActualizarEstadoSuscripcionObserver(suscripcionesRepository),
      inject: [ISuscripcionesRepository],
    },
    {
      provide: AccesoComunidadObserver,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        miembroService: IMiembroService,
      ) =>
        new AccesoComunidadObserver(
          suscripcionesRepository,
          planesService,
          miembroService,
        ),
      inject: [ISuscripcionesRepository, IPlanesService, IMiembroService],
    },
    {
      provide: NotificacionEmailObserver,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        usuariosService: IUsuariosService,
        comunidadService: IComunidadService,
      ) =>
        new NotificacionEmailObserver(
          suscripcionesRepository,
          planesService,
          usuariosService,
          comunidadService,
        ),
      inject: [
        ISuscripcionesRepository,
        IPlanesService,
        IUsuariosService,
        IComunidadService,
      ],
    },
    {
      provide: DesactivarSuscripcionObserver,
      useFactory: (suscripcionesRepository: ISuscripcionesRepository) =>
        new DesactivarSuscripcionObserver(suscripcionesRepository),
      inject: [ISuscripcionesRepository],
    },
    {
      provide: RemoverMiembroComunidadObserver,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        miembroService: IMiembroService,
      ) =>
        new RemoverMiembroComunidadObserver(
          suscripcionesRepository,
          planesService,
          miembroService,
        ),
      inject: [ISuscripcionesRepository, IPlanesService, IMiembroService],
    },
    {
      provide: NotificacionEmailCancelacionObserver,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        usuariosService: IUsuariosService,
        comunidadService: IComunidadService,
      ) =>
        new NotificacionEmailCancelacionObserver(
          suscripcionesRepository,
          planesService,
          usuariosService,
          comunidadService,
        ),
      inject: [
        ISuscripcionesRepository,
        IPlanesService,
        IUsuariosService,
        IComunidadService,
      ],
    },
  ],
  exports: [IPagosService, IPagosRepository],
})
export class PagosModule implements OnModuleInit, OnModuleDestroy {
  public constructor(
    private readonly activarSuscripcion: ActualizarEstadoSuscripcionObserver,
    private readonly accesoComunidad: AccesoComunidadObserver,
    private readonly notificacionEmail: NotificacionEmailObserver,
    private readonly desactivarSuscripcion: DesactivarSuscripcionObserver,
    private readonly removerMiembro: RemoverMiembroComunidadObserver,
    private readonly notificacionEmailCancelacion: NotificacionEmailCancelacionObserver,
  ) {}

  public onModuleInit(): void {
    Pago.events.suscribir('pagoAprobado', this.activarSuscripcion);
    Pago.events.suscribir('pagoAprobado', this.accesoComunidad);
    Pago.events.suscribir('pagoAprobado', this.notificacionEmail);

    Pago.events.suscribir('pagoRechazado', this.desactivarSuscripcion);
    Pago.events.suscribir('pagoRechazado', this.removerMiembro);
    Pago.events.suscribir('pagoRechazado', this.notificacionEmailCancelacion);
  }

  public onModuleDestroy(): void {
    Pago.events.desuscribir('pagoAprobado', this.activarSuscripcion);
    Pago.events.desuscribir('pagoAprobado', this.accesoComunidad);
    Pago.events.desuscribir('pagoAprobado', this.notificacionEmail);

    Pago.events.desuscribir('pagoRechazado', this.desactivarSuscripcion);
    Pago.events.desuscribir('pagoRechazado', this.removerMiembro);
    Pago.events.desuscribir('pagoRechazado', this.notificacionEmailCancelacion);
  }
}
