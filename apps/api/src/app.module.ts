import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './common/config/env.validation';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ComunidadModule } from './comunidad/comunidad.module';
import { PlanesModule } from './planes/planes.module';
import { CategoriaComunidadModule } from './categoria-comunidad/categoria-comunidad.module';
import { SuscripcionesModule } from './suscripciones/suscripciones.module';
import { PagosModule } from './pagos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
    }),
    PrismaModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
          }),
        }),
      ],
    }),
    AuthModule,
    UsuariosModule,
    ComunidadModule,
    PlanesModule,
    CategoriaComunidadModule,
    SuscripcionesModule,
    PagosModule,
  ],


})
export class AppModule {}
