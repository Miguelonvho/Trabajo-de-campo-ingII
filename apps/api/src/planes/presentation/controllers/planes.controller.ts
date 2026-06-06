import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IPlanesService } from '../../application/services/planes.service.interface';
import { PlanNotFoundException } from '../../domain/exceptions';

import { CrearPlanDto } from '../dtos/crear-plan.dto';
import { ICreatePlanResponse } from '@repo/types';
import { PlanResponseDto } from '../dtos/plan-response.dto';
import { PlanComunidad } from '../../domain/entities/plan.entity';
import { CicloPago } from '../../domain/entities/ciclo-pago.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ComunidadOwnerGuard } from '../../../common/guards/comunidad-owner.guard';

@ApiTags('Planes')
@ApiBearerAuth()
@Controller('planes')
@UseGuards(JwtAuthGuard)
export class PlanesController {
  public constructor(private readonly planesService: IPlanesService) {}

  /**
   * Endpoint para crear un nuevo plan de suscripción.
   * Requiere autenticación JWT.
   *
   * @param dto - Datos del plan enviados en el cuerpo de la solicitud.
   * @returns El plan creado y la información de integración con Mercado Pago.
   */
  @ApiOperation({ summary: 'Crea un nuevo plan de suscripción' })
  @ApiResponse({ status: 201, description: 'Plan creado exitosamente.' })
  @UseGuards(JwtAuthGuard, ComunidadOwnerGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async crearPlan(
    @Body() dto: CrearPlanDto,
  ): Promise<ICreatePlanResponse> {
    const resultado = await this.planesService.crearPlan({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      precio: dto.precio,
      frecuencia: dto.frecuencia,
      tipo_frecuencia: dto.tipo_frecuencia,
      moneda: dto.moneda,
      id_comunidad: dto.id_comunidad,
    });

    return {
      ...resultado,
      plan: PlanResponseDto.fromEntity(resultado.plan as PlanComunidad),
    };
  }

  /**
   * Obtiene las configuraciones de ciclos de pago válidos (frecuencia/tipo).
   * Se usa para poblar los selectores del formulario de creación de planes.
   */
  @ApiOperation({ summary: 'Obtiene los ciclos de pago válidos' })
  @ApiResponse({
    status: 200,
    description: 'Listado de ciclos de pago.',
    type: [CicloPago],
  })
  @Get('config/ciclos-pago')
  public async getCiclosPago(): Promise<CicloPago[]> {
    return this.planesService.getValidCiclosPago();
  }

  /**
   * Obtiene un plan por su ID.
   *
   * @param id - ID del plan.
   */
  @Get(':id')
  public async getPlan(@Param('id') id: string): Promise<PlanResponseDto> {
    const resultado = await this.planesService.getPlan(id, true);
    return PlanResponseDto.fromEntity(resultado);
  }


  /**
   * Obtiene la lista de planes asociados a una comunidad.
   * Devuelve todos los planes (activos e inactivos).
   *
   * @param id_comunidad ID numérico de la comunidad
   */
  @ApiOperation({ summary: 'Obtiene los planes de una comunidad' })
  @ApiResponse({
    status: 200,
    description: 'Listado de planes.',
    type: [PlanResponseDto],
  })
  @Get('comunidad/:id_comunidad')
  public async getPlanesPorComunidad(
    @Param('id_comunidad') id_comunidad: string,
  ): Promise<PlanResponseDto[]> {
    const planes = await this.planesService.getPlanesPorComunidad(id_comunidad);
    return planes.map((p) => PlanResponseDto.fromEntity(p));
  }

  /**
   * Desactiva un plan de suscripción.
   *
   * @param id - ID del plan.
   */
  @ApiOperation({ summary: 'Desactiva un plan' })
  @Delete(':id')
  public async desactivarPlan(
    @Param('id') id: string,
  ): Promise<{ mensaje: string }> {
    await this.planesService.desactivarPlanComunidad(id);
    return { mensaje: `El plan con id ${id} fue desactivado correctamente` };
  }

  /**
   * Reactiva un plan de suscripción.
   *
   * @param id - ID del plan.
   */
  @ApiOperation({ summary: 'Reactiva un plan' })
  @Post(':id/reactivar')
  public async reactivarPlan(
    @Param('id') id: string,
  ): Promise<{ mensaje: string }> {
    await this.planesService.reactivarPlanComunidad(id);
    return { mensaje: `El plan con id ${id} fue reactivado correctamente` };
  }
}
