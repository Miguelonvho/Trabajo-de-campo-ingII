import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Param,
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
  @ApiOperation({
    summary: 'Crea una intención de suscripción en Mercado Pago y localmente',
  })
  @ApiResponse({
    status: 201,
    description:
      'La intención de suscripción ha sido registrada exitosamente en estado PENDIENTE.',
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

  /**
   * Cancela de forma lógica una suscripción de la que el usuario logueado es titular.
   *
   * @param idSuscripcion - UUID de la suscripción.
   * @param req - Objeto de petición conteniendo el usuario autenticado.
   */
  @ApiOperation({
    summary: 'Cancela de forma lógica una suscripción del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'La suscripción ha sido cancelada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para cancelar esta suscripción.' })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada.' })
  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  public async cancelarSuscripcion(
    @Param('id') idSuscripcion: string,
    @Req() req: { user: IUsuario },
  ): Promise<void> {
    await this.suscripcionesService.cancelarSuscripcion(
      idSuscripcion,
      req.user.id_usuario.toString(),
    );
  }

  /**
   * Obtiene la suscripción activa del usuario para una comunidad específica.
   */
  @ApiOperation({
    summary: 'Obtiene la suscripción activa del usuario para una comunidad específica',
  })
  @ApiResponse({
    status: 200,
    description: 'La suscripción activa encontrada.',
    type: SuscripcionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Suscripción activa no encontrada.' })
  @Get('comunidad/:idComunidad/activa')
  @HttpCode(HttpStatus.OK)
  public async obtenerSuscripcionActiva(
    @Param('idComunidad') idComunidad: string,
    @Req() req: { user: IUsuario },
  ): Promise<SuscripcionResponseDto | null> {
    const resultado = await this.suscripcionesService.obtenerSuscripcionActiva(
      idComunidad,
      req.user.id_usuario.toString(),
    );
    return resultado ? SuscripcionResponseDto.fromEntity(resultado) : null;
  }
}
