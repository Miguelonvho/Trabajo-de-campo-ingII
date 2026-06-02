import { PagoEventManager } from '../domain/pago-event-manager';
import { PagoListener } from '../domain/pago-listener.interface';

/**
 * Clase pura de TypeScript encargada de realizar el cableado de eventos y observadores (Listeners).
 * Desacopla la lógica de suscripción de la infraestructura del framework.
 */
export class PagoEventsRegistry {
  /**
   * Conecta los observadores pasivos con el gestor de eventos de pagos.
   *
   * @param eventManager - Gestor de eventos.
   * @param activarSuscripcion - Listener que activa la suscripción en BD.
   * @param accesoComunidad - Listener que otorga membresía a la comunidad.
   * @param notificacionEmail - Listener que despacha emails informativos.
   */
  public static registrar(
    eventManager: PagoEventManager,
    activarSuscripcion: PagoListener,
    accesoComunidad: PagoListener,
    notificacionEmail: PagoListener,
  ): void {
    eventManager.subscribe('pagoAprobado', activarSuscripcion);
    eventManager.subscribe('pagoAprobado', accesoComunidad);
    eventManager.subscribe('pagoAprobado', notificacionEmail);
  }
}
