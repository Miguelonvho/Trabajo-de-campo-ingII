import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ISuscripcionesService } from '../../application/services/suscripciones.service.interface';
import { CrearSuscripcionDto } from '../dtos/crear-suscripcion.dto';
import { SuscripcionResponseDto } from '../dtos/suscripcion-response.dto';
import type { IUsuario } from '@repo/types';

/**
 * Controlador de Suscripciones.
 *
 * Expone los endpoints para registrar y gestionar el ciclo de vida de los contratos de suscripción.
 */
@ApiTags('Suscripciones')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('suscripciones')
export class SuscripcionesController {
  public constructor(
    private readonly suscripcionesService: ISuscripcionesService,
  ) {}

  /**
   * Crea una nueva intención de suscripción (contrato) en Mercado Pago y la guarda localmente como PENDIENTE.
   *
   * @param dto - Datos del plan y tarjeta de crédito tokenizada.
   * @param req - Objeto de petición HTTP conteniendo el usuario autenticado.
   */
  @ApiOperation({ summary: 'Crea una intención de suscripción en Mercado Pago y localmente' })
  @ApiResponse({
    status: 201,
    description: 'La intención de suscripción ha sido registrada exitosamente en estado PENDIENTE.',
    type: SuscripcionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Plan de comunidad no encontrado.' })
  @Post('comunidad')
  @HttpCode(HttpStatus.CREATED)
  public async crearSuscripcion(
    @Body() dto: CrearSuscripcionDto,
    @Req() req: { user: IUsuario },
  ): Promise<SuscripcionResponseDto> {
    const resultado = await this.suscripcionesService.crearSuscripcion(
      {
        id_plan_comunidad: dto.id_plan_comunidad,
        token_tarjeta: dto.token_tarjeta,
        email: dto.email,
        back_url: dto.back_url,
      },
      req.user.id_usuario.toString(),
    );

    return SuscripcionResponseDto.fromEntity(resultado);
  }
}
