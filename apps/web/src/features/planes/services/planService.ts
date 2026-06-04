import { api } from '@/shared/lib/api/client';
import { ICreatePlanRequest, ICreatePlanResponse, ICicloPago, IPlanComunidad } from '@repo/types';

export const planService = {
  /**
   * Crea un nuevo plan de suscripción en la comunidad y en Mercado Pago
   */
  async crearPlan(dto: ICreatePlanRequest): Promise<ICreatePlanResponse> {
    return api.post<ICreatePlanResponse>('/planes', dto);
  },

  /**
   * Obtiene la lista de planes asociados a una comunidad.
   * Devuelve todos los planes (activos e inactivos).
   */
  async getPlanesPorComunidad(idComunidad: string): Promise<IPlanComunidad[]> {
    return api.get<IPlanComunidad[]>(`/planes/comunidad/${idComunidad}`);
  },

  /**
   * Obtiene la configuración de ciclos de pago válidos (frecuencia/tipo)
   */
  async getCiclosPago(): Promise<ICicloPago[]> {
    return api.get<ICicloPago[]>('/planes/config/ciclos-pago');
  },

  /**
   * Obtiene la información detallada de un plan de suscripción por su ID
   */
  async getPlan(id: string): Promise<IPlanComunidad> {
    return api.get<IPlanComunidad>(`/planes/${id}`);
  }
};
