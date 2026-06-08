import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { PlanesModule } from '../planes/planes.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { DomainExceptionFilter } from '../common/filters/domain-exception.filter';
import { SuscripcionesController } from './presentation/controllers/suscripciones.controller';
import { ISuscripcionesService } from './application/services/suscripciones.service.interface';
import { SuscripcionesService } from './application/services/suscripciones.service';
import { ISuscripcionesRepository } from './domain/ports/suscripciones.repository.interface';
import { PrismaSuscripcionesRepository } from './infrastructure/persistence/repositories/suscripciones.prisma.repository';
import { MiembroModule } from '../miembro/miembro.module';

@Module({
  imports: [PrismaModule, PlanesModule, MercadoPagoModule, MiembroModule],
  controllers: [SuscripcionesController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    {
      provide: ISuscripcionesService,
      useClass: SuscripcionesService,
    },
    {
      provide: ISuscripcionesRepository,
      useClass: PrismaSuscripcionesRepository,
    },
  ],
  exports: [ISuscripcionesService, ISuscripcionesRepository],
})
export class SuscripcionesModule {}
