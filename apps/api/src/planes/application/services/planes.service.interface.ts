import type { CrearPlanCommand } from '../commands/planes.commands';
import type { ICreatePlanResponse } from '@repo/types';

import { PlanComunidad } from '../../domain/entities/plan.entity';
import { CicloPago } from '../../domain/entities/ciclo-pago.entity';

/**
 * Interfaz que define el contrato para el servicio de Planes.
 */
export abstract class IPlanesService {
  /**
   * Registra un nuevo plan de suscripción asociado a una comunidad.
   *
   * @param command - Datos del plan a crear.
   * @returns Una promesa con la respuesta de creación del plan.
   */
  public abstract crearPlan(
    command: CrearPlanCommand,
  ): Promise<ICreatePlanResponse>;

  /**
   * Obtiene la lista de todos los ciclos de pago configurados en el sistema.
   *
   * @returns Una promesa con el arreglo de ciclos de pago.
   */
  public abstract getValidCiclosPago(): Promise<CicloPago[]>;

  /**
   * Obtiene todos los planes de suscripción asociados a una comunidad.
   *
   * @param id_comunidad - ID de la comunidad.
   * @returns Una promesa con el arreglo de planes encontrados.
   */
  public abstract getPlanesPorComunidad(
    id_comunidad: string,
  ): Promise<PlanComunidad[]>;

  public abstract getPlan(
    id: string,
    onlyActive?: boolean,
  ): Promise<PlanComunidad>;


  /**
   * Desactiva un plan de suscripción.
   *
   * @param id - ID del plan.
   */
  public abstract desactivarPlanComunidad(id: string): Promise<void>;

  /**
   * Reactiva un plan de suscripción.
   *
   * @param id - ID del plan.
   */
  public abstract reactivarPlanComunidad(id: string): Promise<void>;
}
