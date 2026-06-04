import { api } from '@/shared/lib/api/client';
import { IComunidad, ICategoriaComunidad, ICreateCommunityRequest, IUpdateCommunityRequest } from '@repo/types';

export const comunidadService = {
  /**
   * Crea una nueva comunidad
   */
  async crearComunidad(dto: ICreateCommunityRequest): Promise<IComunidad> {
    return api.post<IComunidad>('/comunidades', dto);
  },

  /**
   * Actualiza una comunidad existente
   */
  async actualizarComunidad(id: string, dto: IUpdateCommunityRequest): Promise<IComunidad> {
    return api.patch<IComunidad>(`/comunidades/${id}`, dto);
  },

  /**
   * Obtiene todas las comunidades activas (público)
   */
  async getComunidades(): Promise<IComunidad[]> {
    return api.get<IComunidad[]>('/comunidades');
  },

  /**
   * Obtiene las comunidades del usuario autenticado
   */
  async getMisComunidades(): Promise<IComunidad[]> {
    return api.get<IComunidad[]>('/comunidades/mis-comunidades');
  },

  /**
   * Obtiene una comunidad por ID
   */
  async getComunidad(id: string): Promise<IComunidad> {
    return api.get<IComunidad>(`/comunidades/${id}`);
  },

  /**
   * Obtiene una comunidad por su slug
   */
  async getComunidadBySlug(slug: string): Promise<IComunidad> {
    return api.get<IComunidad>(`/comunidades/s/${slug}`);
  },

  /**
   * Obtiene el rol del usuario autenticado en la comunidad por su slug.
   * Si no está autenticado o no es miembro, retorna { rol: null }
   */
  async getRolEnComunidad(slug: string): Promise<{ rol: 'CREADOR' | 'SUSCRIPTOR' | null }> {
    try {
      return await api.get<{ rol: 'CREADOR' | 'SUSCRIPTOR' | null }>(`/comunidades/s/${slug}/rol`);
    } catch {
      return { rol: null };
    }
  },

  /**
   * Obtiene la lista de categorías disponibles
   */
  async getCategorias(): Promise<ICategoriaComunidad[]> {
    return api.get<ICategoriaComunidad[]>('/categorias-comunidad');
  },
  /**
   * Da de baja una comunidad lógicamente
   */
  async desactivarComunidad(id: string): Promise<{ mensaje: string }> {
    return api.delete<{ mensaje: string }>(`/comunidades/${id}`);
  },
  /**
   * Reactiva una comunidad (cambia su estado activa a true)
   */
  async reactivarComunidad(id: string): Promise<{ mensaje: string }> {
    return api.post<{ mensaje: string }>(`/comunidades/${id}/reactivar`, {});
  }
};
