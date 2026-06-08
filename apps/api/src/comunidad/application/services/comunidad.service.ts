import {
  Injectable,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ComunidadNotFoundException, SinComunidadesActivasException } from '../../domain/exceptions';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { Comunidad } from '../../domain/entities/comunidad.entity';
import { ROLES } from '../../../common/constants/roles';
import { IComunidadRepository } from '../../domain/ports/comunidad.repository.interface';
import type {
  CrearComunidadCommand,
  ActualizarComunidadCommand,
} from '../commands/comunidad.commands';

import { IComunidadService } from './comunidad.service.interface';
import { ICategoriaComunidadService } from '../../../categoria-comunidad/services/categoria-comunidad.service.interface';

/**
 * Servicio encargado de la lógica de negocio de Comunidades.
 * Utiliza interfaces de comando (CrearComunidadCommand) para desacoplarse de la capa HTTP.
 */
// @Injectable() registra esta clase en el contenedor de dependencias de NestJS.
// Gracias a eso, Nest puede crear una instancia de ComunidadService e inyectarla
// donde se la necesite, por ejemplo en controllers u otros servicios.
@Injectable()
export class ComunidadService implements IComunidadService {
  private readonly logger = new Logger(ComunidadService.name);

  public constructor(
    private readonly comunidadRepository: IComunidadRepository,
    private readonly miembroService: IMiembroService,
    private readonly categoriaComunidadService: ICategoriaComunidadService,
  ) {}

  /**
   * Crea una nueva comunidad e inserta al creador como miembro con el rol de CREADOR.
   * Valida que la categoría proporcionada exista antes de guardar.
   *
   * @param command - Objeto que contiene los datos básicos de la comunidad (nombre, descripción, categoría, etc.).
   * @param idCreador - Identificador único del usuario que está creando la comunidad.
   * @returns Una promesa que resuelve con los datos de la comunidad recién creada.
   * @throws {NotFoundException} Si la categoría de comunidad especificada no existe.
   * @throws {InternalServerErrorException} Si ocurre un error inesperado durante la creación o asignación de permisos.
   */
  // @Transactional() hace que todo este metodo se ejecute dentro de una
  // transaccion de base de datos. Si algo falla al crear la comunidad o al
  // agregar el miembro creador, se revierte todo para no dejar datos a medias.
  @Transactional()
  public async crearComunidad(
    command: CrearComunidadCommand,
    idCreador: string,
  ): Promise<Comunidad> {
    await this.categoriaComunidadService.validarExistencia(
      command.id_categoria_comunidad,
    );

    try {
      const comunidad = await Comunidad.crearComunidad(
        command.nombre,
        command.id_categoria_comunidad,
        (slug) => this.comunidadRepository.verificarSiSlugEstaEnUso(slug),
        command.descripcion,
        command.portada_url,
      );

      const nuevaComunidad =
        await this.comunidadRepository.crearComunidad(comunidad);

      await this.miembroService.agregarMiembro({
        id_usuario: idCreador,
        id_comunidad: nuevaComunidad.id_comunidad,
        id_rol: ROLES.CREADOR,
      });

      return nuevaComunidad;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error al crear la comunidad, intentá de nuevo',
      );
    }
  }

  /**
   * Obtiene la lista de todas las comunidades que se encuentran actualmente activas.
   *
   * @returns Una promesa que resuelve con un arreglo de objetos IComunidad.
   */
  public async getComunidades(): Promise<Comunidad[]> {
    const comunidades = await this.comunidadRepository.buscarComunidadesActivas();
    if (comunidades.length === 0) {
      throw new SinComunidadesActivasException();
    }
    return comunidades;
  }

  /**
   * Obtiene las comunidades que han sido creadas por un usuario específico.
   * Filtra las comunidades donde el usuario tiene el rol de CREADOR.
   *
   * @param idCreador - Identificador único del usuario creador.
   * @returns Una promesa que resuelve con un arreglo de comunidades asociadas al creador.
   */
  public async getMisComunidades(idCreador: string): Promise<Comunidad[]> {
    return this.comunidadRepository.buscarComunidadesDelCreador(idCreador);
  }

  /**
   * Busca y retorna la información de una comunidad específica utilizando su ID.
   *
   * @param id_comunidad - Identificador único de la comunidad.
   * @returns Una promesa que resuelve con los datos de la comunidad encontrada.
   * @throws {NotFoundException} Si no se encuentra ninguna comunidad con el ID proporcionado.
   */
  public async getComunidad(id_comunidad: string): Promise<Comunidad> {
    const comunidad = await this.comunidadRepository.buscarComunidadPorId(id_comunidad);
    if (!comunidad) {
      throw new ComunidadNotFoundException(id_comunidad, 'ID');
    }
    return comunidad;
  }

  /**
   * Busca y retorna la información de una comunidad específica utilizando su slug.
   * El slug es una versión amigable del nombre para usar en URLs.
   *
   * @param slug - El slug de la comunidad a buscar.
   * @returns Una promesa que resuelve con los datos de la comunidad encontrada.
   * @throws {NotFoundException} Si no se encuentra ninguna comunidad con el slug proporcionado.
   */
  public async getComunidadPorSlug(slug: string): Promise<Comunidad> {
    const comunidad =
      await this.comunidadRepository.buscarComunidadPorSlug(slug);
    if (!comunidad) {
      throw new ComunidadNotFoundException(slug, 'slug');
    }
    return comunidad;
  }

  /**
   * Actualiza los datos de una comunidad existente.
   * Verifica previamente que la comunidad exista y que el usuario solicitante sea el creador.
   * Si el nombre cambia, se genera un nuevo slug único.
   *
   * @param id_comunidad - Identificador único de la comunidad a actualizar.
   * @param command - Objeto con los campos parciales a actualizar (nombre, descripción, etc.).
   * @returns Una promesa que resuelve con los datos de la comunidad actualizada.
   * @throws {NotFoundException} Si la comunidad o la nueva categoría especificada no existen.
   */
  // @Transactional() agrupa la lectura, validaciones y guardado final en una
  // misma transaccion. Si el update falla, los cambios no quedan aplicados
  // parcialmente.
  @Transactional()
  public async actualizarComunidad(
    id_comunidad: string,
    command: ActualizarComunidadCommand,
  ): Promise<Comunidad> {
    const comunidad = await this.getComunidad(id_comunidad);

    // 1. Optimización: Solo validar categoría si realmente está cambiando
    if (
      command.id_categoria_comunidad !== undefined &&
      command.id_categoria_comunidad !== comunidad.id_categoria_comunidad
    ) {
      await this.categoriaComunidadService.validarExistencia(
        command.id_categoria_comunidad,
      );
    }

    // 2. Delegar actualización a la entidad (ella decide si regenera el slug)
    await comunidad.actualizarComunidad(
      command.nombre,
      command.descripcion,
      command.portada_url,
      command.id_categoria_comunidad,
      (s) => this.comunidadRepository.verificarSiSlugEstaEnUso(s),
    );

    return this.comunidadRepository.actualizarComunidad(comunidad);
  }

  /**
   * Desactiva una comunidad realizando una baja lógica (activa: false).
   * Requiere que el usuario sea el creador de la comunidad.
   *
   * @param id_comunidad - Identificador único de la comunidad a desactivar.
   * @returns Una promesa que resuelve cuando la comunidad ha sido desactivada.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  // @Transactional() protege la baja logica: se busca la comunidad, se cambia
  // su estado en la entidad y se guarda como una sola operacion consistente.
  @Transactional()
  public async desactivarComunidad(id_comunidad: string): Promise<void> {
    const comunidad = await this.getComunidad(id_comunidad);
    comunidad.desactivarComunidad();
    await this.comunidadRepository.actualizarComunidad(comunidad);
  }

  /**
   * Reactiva una comunidad que fue previamente desactivada (activa: true).
   *
   * @param id_comunidad - Identificador único de la comunidad a reactivar.
   * @returns Una promesa que resuelve cuando la comunidad ha sido reactivada.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  // @Transactional() protege la reactivacion: si ocurre un error al guardar,
  // la base de datos conserva el estado anterior de la comunidad.
  @Transactional()
  public async reactivarComunidad(id_comunidad: string): Promise<void> {
    const comunidad = await this.getComunidad(id_comunidad);
    comunidad.reactivarComunidad();
    await this.comunidadRepository.actualizarComunidad(comunidad);
  }

  /**
   * Obtiene el rol de un usuario en una comunidad específica a partir de su slug.
   */
  public async obtenerRolUsuarioEnComunidad(
    idUsuario: string,
    slug: string,
  ): Promise<'CREADOR' | 'SUSCRIPTOR' | null> {
    try {
      const comunidad = await this.getComunidadPorSlug(slug);
      const miembro = await this.miembroService.buscarMiembro(
        idUsuario,
        comunidad.id_comunidad.toString(),
      );
      if (!miembro) {
        return null;
      }

      if (miembro.id_rol_comunidad === ROLES.CREADOR) {
        return 'CREADOR';
      }
      if (miembro.id_rol_comunidad === ROLES.SUSCRIPTOR) {
        return 'SUSCRIPTOR';
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
