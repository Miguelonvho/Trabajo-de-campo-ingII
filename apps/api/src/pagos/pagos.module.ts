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

import { ActualizarEstadoSuscripcionListener } from './application/listeners/actualizar-estado-suscripcion.listener';
import { AccesoComunidadListener } from './application/listeners/acceso-comunidad.listener';
import { NotificacionEmailListener } from './application/listeners/notificacion-email.listener';
import { DesactivarSuscripcionListener } from './application/listeners/desactivar-suscripcion.listener';
import { RemoverMiembroComunidadListener } from './application/listeners/remover-miembro-comunidad.listener';
import { NotificacionEmailCancelacionListener } from './application/listeners/notificacion-email-cancelacion.listener';
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
    // Registrar los listeners como providers para poder inyectar sus dependencias
    {
      provide: ActualizarEstadoSuscripcionListener,
      useFactory: (suscripcionesRepository: ISuscripcionesRepository) =>
        new ActualizarEstadoSuscripcionListener(suscripcionesRepository),
      inject: [ISuscripcionesRepository],
    },
    {
      provide: AccesoComunidadListener,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        miembroService: IMiembroService,
      ) =>
        new AccesoComunidadListener(
          suscripcionesRepository,
          planesService,
          miembroService,
        ),
      inject: [ISuscripcionesRepository, IPlanesService, IMiembroService],
    },
    {
      provide: NotificacionEmailListener,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        usuariosService: IUsuariosService,
        comunidadService: IComunidadService,
      ) =>
        new NotificacionEmailListener(
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
      provide: DesactivarSuscripcionListener,
      useFactory: (suscripcionesRepository: ISuscripcionesRepository) =>
        new DesactivarSuscripcionListener(suscripcionesRepository),
      inject: [ISuscripcionesRepository],
    },
    {
      provide: RemoverMiembroComunidadListener,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        miembroService: IMiembroService,
      ) =>
        new RemoverMiembroComunidadListener(
          suscripcionesRepository,
          planesService,
          miembroService,
        ),
      inject: [ISuscripcionesRepository, IPlanesService, IMiembroService],
    },
    {
      provide: NotificacionEmailCancelacionListener,
      useFactory: (
        suscripcionesRepository: ISuscripcionesRepository,
        planesService: IPlanesService,
        usuariosService: IUsuariosService,
        comunidadService: IComunidadService,
      ) =>
        new NotificacionEmailCancelacionListener(
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
    private readonly activarSuscripcion: ActualizarEstadoSuscripcionListener,
    private readonly accesoComunidad: AccesoComunidadListener,
    private readonly notificacionEmail: NotificacionEmailListener,
    private readonly desactivarSuscripcion: DesactivarSuscripcionListener,
    private readonly removerMiembro: RemoverMiembroComunidadListener,
    private readonly notificacionEmailCancelacion: NotificacionEmailCancelacionListener,
  ) {}

  public onModuleInit(): void {
    Pago.events.subscribe('pagoAprobado', this.activarSuscripcion);
    Pago.events.subscribe('pagoAprobado', this.accesoComunidad);
    Pago.events.subscribe('pagoAprobado', this.notificacionEmail);

    Pago.events.subscribe('pagoRechazado', this.desactivarSuscripcion);
    Pago.events.subscribe('pagoRechazado', this.removerMiembro);
    Pago.events.subscribe('pagoRechazado', this.notificacionEmailCancelacion);
  }

  public onModuleDestroy(): void {
    Pago.events.unsubscribe('pagoAprobado', this.activarSuscripcion);
    Pago.events.unsubscribe('pagoAprobado', this.accesoComunidad);
    Pago.events.unsubscribe('pagoAprobado', this.notificacionEmail);

    Pago.events.unsubscribe('pagoRechazado', this.desactivarSuscripcion);
    Pago.events.unsubscribe('pagoRechazado', this.removerMiembro);
    Pago.events.unsubscribe('pagoRechazado', this.notificacionEmailCancelacion);
  }
}
