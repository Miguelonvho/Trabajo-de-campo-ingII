import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { IMiembroService } from '../../miembro/services/miembro.service.interface';
import { stringToSlug } from '../../common/utils/slug.utils';
import { Comunidad } from '../models/comunidad.entity';
import { ROLES } from '../../common/constants/roles';
import {
  IComunidadRepository,
} from '../infrastructure/comunidad.repository.interface';
import type {
  CrearComunidadCommand,
  ActualizarComunidadCommand,
} from './comunidad.commands';

import { IComunidadService } from './comunidad.service.interface';
import { ICategoriaComunidadService } from '../../categoria-comunidad/services/categoria-comunidad.service.interface';

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
  ) { }

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
    const slug = await this.generarSlugUnico(command.nombre);

    const existeCategoria = await this.categoriaComunidadService.existeCategoria(
      command.id_categoria_comunidad,
    );
    if (!existeCategoria) {
      throw new NotFoundException(
        `La categoría con id ${command.id_categoria_comunidad} no existe`,
      );
    }

    try {
      const comunidad = Comunidad.crearComunidad(
        command.nombre,
        slug,
        command.id_categoria_comunidad,
        command.descripcion,
        command.portada_url,
      );

      const nuevaComunidad = await this.comunidadRepository.crearComunidad(comunidad);

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
    return this.comunidadRepository.buscarComunidadesActivas();
  }

  /**
   * Obtiene las comunidades que han sido creadas por un usuario específico.
   * Filtra las comunidades donde el usuario tiene el rol de CREADOR.
   *
   * @param idCreador - Identificador único del usuario creador.
   * @returns Una promesa que resuelve con un arreglo de comunidades asociadas al creador.
   */
  public async getMisComunidades(idCreador: string): Promise<Comunidad[]> {
    return this.comunidadRepository.buscarComunidadesPorCreador(idCreador, ROLES.CREADOR);
  }

  /**
   * Busca y retorna la información de una comunidad específica utilizando su ID.
   *
   * @param id - Identificador único de la comunidad.
   * @returns Una promesa que resuelve con los datos de la comunidad encontrada.
   * @throws {NotFoundException} Si no se encuentra ninguna comunidad con el ID proporcionado.
   */
  public async getComunidad(id: string): Promise<Comunidad> {
    const comunidad = await this.comunidadRepository.buscarComunidadPorId(id);
    if (!comunidad) {
      throw new NotFoundException(`La comunidad no fue encontrada`);
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
    const comunidad = await this.comunidadRepository.buscarComunidadPorSlug(slug);
    if (!comunidad) {
      throw new NotFoundException(`La comunidad no fue encontrada`);
    }
    return comunidad;
  }

  /**
   * Actualiza los datos de una comunidad existente.
   * Verifica previamente que la comunidad exista y que el usuario solicitante sea el creador.
   * Si el nombre cambia, se genera un nuevo slug único.
   *
   * @param id - Identificador único de la comunidad a actualizar.
   * @param command - Objeto con los campos parciales a actualizar (nombre, descripción, etc.).
   * @returns Una promesa que resuelve con los datos de la comunidad actualizada.
   * @throws {NotFoundException} Si la comunidad o la nueva categoría especificada no existen.
   */
  // @Transactional() agrupa la lectura, validaciones y guardado final en una
  // misma transaccion. Si el update falla, los cambios no quedan aplicados
  // parcialmente.
  @Transactional()
  public async actualizarComunidad(
    id: string,
    command: ActualizarComunidadCommand,
  ): Promise<Comunidad> {
    const comunidad = await this.getComunidad(id);

    let slug: string | undefined;
    if (command.nombre !== undefined) {
      slug = await this.generarSlugUnico(command.nombre);
    }

    if (command.id_categoria_comunidad !== undefined) {
      const existeCat = await this.categoriaComunidadService.existeCategoria(
        command.id_categoria_comunidad,
      );
      if (!existeCat) throw new NotFoundException(`La categoría no existe`);
    }

    comunidad.actualizarComunidad(
      command.nombre,
      slug,
      command.descripcion,
      command.portada_url,
      command.id_categoria_comunidad,
    );

    return this.comunidadRepository.actualizarComunidad(comunidad);
  }

  /**
   * Desactiva una comunidad realizando una baja lógica (activa: false).
   * Requiere que el usuario sea el creador de la comunidad.
   *
   * @param id - Identificador único de la comunidad a desactivar.
   * @returns Una promesa que resuelve cuando la comunidad ha sido desactivada.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  // @Transactional() protege la baja logica: se busca la comunidad, se cambia
  // su estado en la entidad y se guarda como una sola operacion consistente.
  @Transactional()
  public async desactivarComunidad(id: string): Promise<void> {
    const comunidad = await this.getComunidad(id);
    comunidad.desactivarComunidad();
    await this.comunidadRepository.actualizarComunidad(comunidad);
  }


  /**
   * Reactiva una comunidad que fue previamente desactivada (activa: true).
   *
   * @param id - Identificador único de la comunidad a reactivar.
   * @returns Una promesa que resuelve cuando la comunidad ha sido reactivada.
   * @throws {NotFoundException} Si la comunidad no existe.
   */
  // @Transactional() protege la reactivacion: si ocurre un error al guardar,
  // la base de datos conserva el estado anterior de la comunidad.
  @Transactional()
  public async reactivarComunidad(id: string): Promise<void> {
    const comunidad = await this.getComunidad(id);
    comunidad.reactivarComunidad();
    await this.comunidadRepository.actualizarComunidad(comunidad);
  }

  /**
   * Genera un slug único basado en el nombre de la comunidad.
   * Si el slug base ya existe, añade un sufijo numérico incremental hasta encontrar uno disponible.
   *
   * @param nombre - El nombre de la comunidad para generar el slug.
   * @returns Una promesa que resuelve con el slug único generado.
   * @private
   */
  private async generarSlugUnico(nombre: string): Promise<string> {
    const base = stringToSlug(nombre);
    let slug = base;
    let contador = 2;

    while (await this.comunidadRepository.buscarComunidadPorSlug(slug)) {
      slug = `${base}-${contador}`;
      contador++;
    }

    return slug;
  }
}
