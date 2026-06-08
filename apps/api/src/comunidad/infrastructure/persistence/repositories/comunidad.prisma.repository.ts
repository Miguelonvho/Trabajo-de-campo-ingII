import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Comunidad } from '../../../domain/entities/comunidad.entity';
import { IComunidadRepository } from '../../../domain/ports/comunidad.repository.interface';
import { ComunidadMapper } from '../mappers/comunidad.mapper';
import { ROLES } from '../../../../common/constants/roles';

/**
 * Adaptador de persistencia para Comunidades usando Prisma.
 * Utiliza nestjs-cls para gestionar el contexto transaccional de forma transparente.
 */
@Injectable()
export class PrismaComunidadRepository implements IComunidadRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  /**
   * Persiste una nueva comunidad en la base de datos.
   *
   * @param comunidad - La entidad comunidad a crear.
   * @returns La comunidad persistida mapeada al dominio.
   */
  public async crearComunidad(comunidad: Comunidad): Promise<Comunidad> {
    const persistida = await this.txHost.tx.comunidad.create({
      data: {
        id_comunidad: comunidad.id_comunidad,
        nombre: comunidad.nombre,
        slug: comunidad.slug,
        activa: comunidad.activa,
        fecha_creacion: comunidad.fecha_creacion,
        descripcion: comunidad.descripcion,
        portada_url: comunidad.portada_url,
        id_categoria_comunidad: comunidad.id_categoria_comunidad,
      },
      include: { categoria_comunidad: true },
    });
    return ComunidadMapper.toIComunidad(persistida);
  }

  /**
   * Actualiza una comunidad existente en la base de datos.
   *
   * @param comunidad - La entidad comunidad con los datos actualizados.
   * @returns La comunidad actualizada mapeada al dominio.
   */
  public async actualizarComunidad(comunidad: Comunidad): Promise<Comunidad> {
    const result = await this.txHost.tx.$queryRaw<any[]>`
      SELECT * FROM actualizar_comunidad(
        ${comunidad.id_comunidad}::uuid,
        ${comunidad.nombre}::text,
        ${comunidad.slug}::text,
        ${comunidad.activa}::boolean,
        ${comunidad.descripcion}::text,
        ${comunidad.portada_url}::text,
        ${comunidad.id_categoria_comunidad}::uuid
      );
    `;

    const c = result[0];
    return ComunidadMapper.toIComunidad({
      id_comunidad: c.id_comunidad,
      nombre: c.nombre,
      slug: c.slug,
      portada_url: c.portada_url,
      activa: c.activa,
      fecha_creacion: new Date(c.fecha_creacion),
      descripcion: c.descripcion,
      id_categoria_comunidad: c.id_categoria_comunidad,
      categoria_comunidad: {
        id_categoria_comunidad: c.id_categoria_comunidad,
        descripcion: c.categoria_descripcion,
        activa: c.categoria_activa,
      },
    });
  }

  /**
   * Recupera una comunidad por su ID incluyendo su categoría.
   *
   * @param id_comunidad - UUID de la comunidad.
   * @returns IComunidad o null si no se encuentra.
   */
  public async buscarComunidadPorId(
    id_comunidad: string,
  ): Promise<Comunidad | null> {
    const comunidad = await this.txHost.tx.comunidad.findUnique({
      where: { id_comunidad },
      include: { categoria_comunidad: true },
    });

    if (!comunidad) return null;
    return ComunidadMapper.toIComunidad(comunidad);
  }

  /**
   * Recupera una comunidad por su slug.
   *
   * @param slug - Slug único de la comunidad.
   * @returns IComunidad o null si no se encuentra.
   */
  public async buscarComunidadPorSlug(slug: string): Promise<Comunidad | null> {
    const comunidad = await this.txHost.tx.comunidad.findUnique({
      where: { slug },
      include: { categoria_comunidad: true },
    });

    if (!comunidad) return null;
    return ComunidadMapper.toIComunidad(comunidad);
  }

  /**
   * Obtiene la lista de todas las comunidades activas ordenadas por novedad.
   *
   * @returns Lista de comunidades activas.
   */
  public async buscarComunidadesActivas(): Promise<Comunidad[]> {
    const comunidadesRaw = await this.txHost.tx.$queryRaw<any[]>`
      SELECT * FROM obtener_comunidades_activas();
    `;

    return comunidadesRaw.map((c) =>
      ComunidadMapper.toIComunidad({
        id_comunidad: c.id_comunidad,
        nombre: c.nombre,
        slug: c.slug,
        portada_url: c.portada_url,
        activa: c.activa,
        fecha_creacion: new Date(c.fecha_creacion),
        descripcion: c.descripcion,
        id_categoria_comunidad: c.id_categoria_comunidad,
        categoria_comunidad: {
          id_categoria_comunidad: c.id_categoria_comunidad,
          descripcion: c.categoria_descripcion,
          activa: c.categoria_activa,
        },
      }),
    );
  }

  /**
   * Busca en la tabla asociativa de miembros para encontrar comunidades creadas por el usuario.
   * El rol de creador es un detalle de infraestructura encapsulado aquí.
   *
   * @param id_usuario - UUID del usuario.
   * @returns Lista de comunidades encontradas.
   */
  public async buscarComunidadesDelCreador(
    id_usuario: string,
  ): Promise<Comunidad[]> {
    const miembros = await this.txHost.tx.miembro_comunidad.findMany({
      where: {
        id_usuario,
        id_rol_comunidad: ROLES.CREADOR,
      },
      include: {
        comunidad: {
          include: { categoria_comunidad: true },
        },
      },
    });

    return miembros.map((m) => ComunidadMapper.toIComunidad(m.comunidad));
  }

  /**
   * Comprueba si un slug ya está siendo utilizado por alguna comunidad.
   * @param slug - Slug a verificar.
   * @returns True si existe, false en caso contrario.
   */
  public async verificarSiSlugEstaEnUso(slug: string): Promise<boolean> {
    const count = await this.txHost.tx.comunidad.count({
      where: { slug },
    });
    return count > 0;
  }
}
