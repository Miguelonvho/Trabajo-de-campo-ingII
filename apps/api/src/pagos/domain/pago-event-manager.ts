import { PagoListener } from './pago-listener.interface';
import type { Pago } from './entities/pago.entity';

/**
 * Gestor de Eventos clásico en memoria.
 * Almacena los observadores registrados por tipo de evento y los notifica.
 */
export class PagoEventManager {
  private readonly listeners = new Map<string, PagoListener[]>();

  /**
   * Suscribe un observador a un tipo de evento en particular.
   */
  public subscribe(eventType: string, listener: PagoListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    const currentListeners = this.listeners.get(eventType);

    // Evitamos duplicidad de suscripción
    if (currentListeners && !currentListeners.includes(listener)) {
      currentListeners.push(listener);
    }
  }

  /**
   * Desuscribe un observador.
   */
  public unsubscribe(eventType: string, listener: PagoListener): void {
    const currentListeners = this.listeners.get(eventType);
    if (currentListeners) {
      const index = currentListeners.indexOf(listener);
      if (index !== -1) {
        currentListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notifica a todos los observadores registrados para el tipo de evento especificado.
   */
  public notify(eventType: string, pago: Pago): void {
    const currentListeners = this.listeners.get(eventType);
    if (currentListeners) {
      currentListeners.forEach((listener) => {
        listener.update(pago);
      });
    }
  }

  /**
   * Obtiene los listeners suscritos a un evento (útil para pruebas unitarias).
   */
  public getListeners(eventType: string): PagoListener[] {
    return this.listeners.get(eventType) || [];
  }
}
