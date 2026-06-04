import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { IComunidadService } from '../../application/services/comunidad.service.interface';
import { CrearComunidadDto } from '../dtos/crear-comunidad.dto';
import { ActualizarComunidadDto } from '../dtos/actualizar-comunidad.dto';
import type { IUsuario } from '@repo/types';
import { ComunidadResponseDto } from '../dtos/comunidad-response.dto';
import { ComunidadOwnerGuard } from '../../../common/guards/comunidad-owner.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * Controlador de Comunidades.
 *
 * Expone los puntos de entrada (endpoints) para la gestión de comunidades,
 * incluyendo la creación, consulta, actualización y reactivación de las mismas.
 * Se encarga de validar la autenticación y los permisos de autoría mediante Guards.
 */
@ApiTags('Comunidades')
@Controller('comunidades')
export class ComunidadController {
  public constructor(
    private readonly comunidadService: IComunidadService,
  ) { }

  /**
   * Crea una nueva comunidad.
   * Requiere que el usuario esté autenticado. El usuario que crea la comunidad
   * se asigna automáticamente como miembro con el rol de CREADOR.
   *
   * @param dto - Datos de la comunidad a crear (nombre, descripción, categoría, etc.).
   * @param req - Objeto de petición que contiene el usuario autenticado.
   * @returns Los datos de la comunidad recién creada.
   */
  @ApiOperation({ summary: 'Crea una nueva comunidad' })
  @ApiResponse({
    status: 201,
    description: 'La comunidad ha sido creada exitosamente.',
    type: ComunidadResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  public async crearComunidad(
    @Body() dto: CrearComunidadDto,
    @CurrentUser() usuario: IUsuario,
  ): Promise<ComunidadResponseDto> {
    const resultado = await this.comunidadService.crearComunidad(
      {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        portada_url: dto.portada_url,
        id_categoria_comunidad: dto.id_categoria_comunidad,
      },
      usuario.id_usuario.toString(),
    );
    return ComunidadResponseDto.fromEntity(resultado);
  }

  /**
   * Obtiene la lista de todas las comunidades que están activas en el sistema.
   *
   * @returns Un arreglo con todas las comunidades activas.
   */
  @ApiOperation({ summary: 'Obtiene todas las comunidades activas' })
  @ApiResponse({
    status: 200,
    description: 'Listado de comunidades.',
    type: [ComunidadResponseDto],
  })
  @Get()
  public async getComunidades(): Promise<ComunidadResponseDto[]> {
    const comunidades = await this.comunidadService.getComunidades();
    return comunidades.map((c) => ComunidadResponseDto.fromEntity(c));
  }

  /**
   * Obtiene las comunidades creadas por el usuario autenticado.
   *
   * @param req - Objeto de petición que contiene el usuario autenticado.
   * @returns Un arreglo con las comunidades donde el usuario es el Creador.
   */
  @UseGuards(JwtAuthGuard)
  @Get('mis-comunidades')
  public async getMisComunidades(
    @CurrentUser() usuario: IUsuario,
  ): Promise<ComunidadResponseDto[]> {
    const comunidades = await this.comunidadService.getMisComunidades(
      usuario.id_usuario.toString(),
    );
    return comunidades.map((c) => ComunidadResponseDto.fromEntity(c));
  }

  /**
   * Obtiene el detalle de una comunidad específica buscando por su slug.
   *
   * @param slug - El identificador amigable de la comunidad.
   * @returns Los datos de la comunidad encontrada.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  @Get('s/:slug')
  public async getComunidadPorSlug(
    @Param('slug') slug: string,
  ): Promise<ComunidadResponseDto> {
    const resultado = await this.comunidadService.getComunidadPorSlug(slug);
    return ComunidadResponseDto.fromEntity(resultado);
  }

  /**
   * Obtiene el rol del usuario autenticado en una comunidad específica por su slug.
   *
   * @param slug - El identificador amigable de la comunidad.
   * @param usuario - El usuario autenticado.
   * @returns El rol en la comunidad o null si no es miembro.
   */
  @ApiOperation({ summary: 'Obtiene el rol del usuario autenticado en una comunidad' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('s/:slug/rol')
  public async getRolEnComunidad(
    @Param('slug') slug: string,
    @CurrentUser() usuario: IUsuario,
  ): Promise<{ rol: 'CREADOR' | 'SUSCRIPTOR' | null }> {
    const rol = await this.comunidadService.obtenerRolUsuarioEnComunidad(
      usuario.id_usuario.toString(),
      slug,
    );
    return { rol };
  }

  /**
   * Obtiene el detalle de una comunidad específica buscando por su ID único.
   *
   * @param id - Identificador único de la comunidad.
   * @returns Los datos de la comunidad encontrada.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  @Get(':id')
  public async getComunidad(
    @Param('id') id: string,
  ): Promise<ComunidadResponseDto> {
    const resultado = await this.comunidadService.getComunidad(id);
    return ComunidadResponseDto.fromEntity(resultado);
  }

  /**
   * Actualiza los datos de una comunidad existente.
   * Solo el usuario que creó la comunidad (o con permisos suficientes) puede realizar esta acción.
   *
   * @param id - Identificador único de la comunidad a modificar.
   * @param dto - Datos parciales o totales a actualizar.
   * @returns Los datos de la comunidad actualizada.
   * @throws {ForbiddenException} Si el usuario no es el dueño de la comunidad.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ComunidadOwnerGuard)
  @Patch(':id')
  public async actualizarComunidad(
    @Param('id') id: string,
    @Body() dto: ActualizarComunidadDto,
  ): Promise<ComunidadResponseDto> {
    const resultado = await this.comunidadService.actualizarComunidad(id, {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      portada_url: dto.portada_url,
      id_categoria_comunidad: dto.id_categoria_comunidad,
    });
    return ComunidadResponseDto.fromEntity(resultado);
  }

  /**
   * Realiza una desactivación lógica de la comunidad (baja lógica).
   * Solo el creador de la comunidad puede realizar esta acción.
   *
   * @param id - Identificador único de la comunidad a desactivar.
   * @returns Un mensaje confirmando la desactivación.
   * @throws {ForbiddenException} Si el usuario no es el dueño de la comunidad.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ComunidadOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  public async desactivarComunidad(
    @Param('id') id: string,
  ): Promise<{ mensaje: string }> {
    await this.comunidadService.desactivarComunidad(id);
    return {
      mensaje: `La comunidad con id ${id} fue desactivada correctamente`,
    };
  }

  /**
   * Reactiva una comunidad que fue previamente desactivada.
   * Solo el creador de la comunidad puede realizar esta acción.
   *
   * @param id - Identificador único de la comunidad a reactivar.
   * @returns Un mensaje confirmando la reactivación.
   * @throws {ForbiddenException} Si el usuario no es el dueño de la comunidad.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ComunidadOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post(':id/reactivar')
  public async reactivarComunidad(
    @Param('id') id: string,
  ): Promise<{ mensaje: string }> {
    await this.comunidadService.reactivarComunidad(id);
    return {
      mensaje: `La comunidad con id ${id} fue reactivada correctamente`,
    };
  }
}
