import { NestFactory, Reflector } from '@nestjs/core';
import { parsearOrigenCors } from './common/utils/cors.utils';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: parsearOrigenCors(process.env.CORS_ORIGIN),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Configuración de ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new DomainExceptionFilter(), new HttpExceptionFilter());

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('KOMU API')
    .setDescription(
      'Documentación de la API para el Trabajo de Campo de Ingeniería de Software II',
    )
    .setVersion('1.0')
    .addBearerAuth() // Para soportar JWT en la UI de Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  const logger = new Logger('Bootstrap');
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
});
