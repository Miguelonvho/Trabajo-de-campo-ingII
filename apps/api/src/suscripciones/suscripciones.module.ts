import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlanesModule } from '../planes/planes.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { SuscripcionesController } from './controllers/suscripciones.controller';
import { ISuscripcionesService } from './services/suscripciones.service.interface';
import { SuscripcionesService } from './services/suscripciones.service';
import { ISuscripcionesRepository } from './infrastructure/suscripciones.repository.interface';
import { PrismaSuscripcionesRepository } from './repositories/suscripciones.prisma.repository';

@Module({
  imports: [PrismaModule, PlanesModule, MercadoPagoModule],
  controllers: [SuscripcionesController],
  providers: [
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
