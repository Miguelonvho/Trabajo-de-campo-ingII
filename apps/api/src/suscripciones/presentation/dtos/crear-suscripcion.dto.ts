import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearSuscripcionDto {
  @ApiProperty({ description: 'Identificador único del plan de la comunidad (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  readonly id_plan_comunidad: string;

  @ApiProperty({ description: 'Token de la tarjeta de crédito devuelto por el SDK de Mercado Pago' })
  @IsString()
  @IsNotEmpty()
  readonly token_tarjeta: string;

  @ApiProperty({ description: 'Correo electrónico del pagador' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ description: 'URL de retorno una vez finalizada la suscripción', required: false })
  @IsString()
  @IsOptional()
  readonly back_url?: string;
}
