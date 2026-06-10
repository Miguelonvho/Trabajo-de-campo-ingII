import { PagoObserver } from './pago-observer.interface';
import type { Pago } from './entities/pago.entity';

/**
 * Gestor de Eventos clásico en memoria.
 * Almacena los observadores registrados por tipo de evento y los notifica.
 */
export class PagoEventManager {
  private readonly observers = new Map<string, PagoObserver[]>();

  /**
   * Suscribe un observador a un tipo de evento en particular.
   */
  public suscribir(tipoEvento: string, observador: PagoObserver): void {
    if (!this.observers.has(tipoEvento)) {
      this.observers.set(tipoEvento, []);
    }
    const currentObservers = this.observers.get(tipoEvento);

    // Evitamos duplicidad de suscripción
    if (currentObservers && !currentObservers.includes(observador)) {
      currentObservers.push(observador);
    }
  }

  /**
   * Desuscribe un observador.
   */
  public desuscribir(tipoEvento: string, observador: PagoObserver): void {
    const currentObservers = this.observers.get(tipoEvento);
    if (currentObservers) {
      const index = currentObservers.indexOf(observador);
      if (index !== -1) {
        currentObservers.splice(index, 1);
      }
    }
  }

  /**
   * Notifica a todos los observadores registrados para el tipo de evento especificado.
   */
  public async notificar(tipoEvento: string, pago: Pago): Promise<void> {
    const currentObservers = this.observers.get(tipoEvento);
    if (currentObservers) {
      for (const observador of currentObservers) {
        await observador.actualizar(pago);
      }
    }
  }

  /**
   * Obtiene los observadores suscritos a un evento (útil para pruebas unitarias).
   */
  public obtenerObservadores(tipoEvento: string): PagoObserver[] {
    return this.observers.get(tipoEvento) || [];
  }
}
