import { ApiProperty } from '@nestjs/swagger';
import { Suscripcion } from '../../domain/entities/suscripcion.entity';

export class SuscripcionResponseDto {
  @ApiProperty() id_suscripcion: string;
  @ApiProperty() fecha_suscripcion: string | Date;
  @ApiProperty({ required: false }) fecha_inicio?: string | Date | null;
  @ApiProperty({ required: false }) fecha_fin?: string | Date | null;
  @ApiProperty({ required: false }) external_reference?: string | null;
  @ApiProperty({ required: false }) mp_subscription_id?: string | null;
  @ApiProperty({ required: false }) init_point?: string | null;
  @ApiProperty({ required: false }) fecha_actualizacion?: string | Date | null;
  @ApiProperty({ required: false }) fecha_proximo_pago?: string | Date | null;
  @ApiProperty({ required: false }) back_url?: string | null;
  @ApiProperty() id_usuario: string;
  @ApiProperty() id_plan_comunidad: string;
  @ApiProperty() id_estado: string;

  public static fromEntity(entity: Suscripcion): SuscripcionResponseDto {
    const dto = new SuscripcionResponseDto();
    dto.id_suscripcion = entity.suscripcion_id;
    dto.fecha_suscripcion = entity.fecha_suscripcion;
    dto.fecha_inicio = entity.fecha_inicio;
    dto.fecha_fin = entity.fecha_fin;
    dto.external_reference = entity.external_reference;
    dto.mp_subscription_id = entity.mp_subscription_id;
    dto.init_point = entity.init_point;
    dto.fecha_actualizacion = entity.fecha_actualizacion;
    dto.fecha_proximo_pago = entity.fecha_proximo_pago;
    dto.back_url = entity.back_url;
    dto.id_usuario = entity.id_usuario;
    dto.id_plan_comunidad = entity.id_plan_comunidad;
    dto.id_estado = entity.id_estado;
    return dto;
  }
}
