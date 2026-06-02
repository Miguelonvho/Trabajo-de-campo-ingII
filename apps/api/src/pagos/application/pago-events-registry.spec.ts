import { PagoEventsRegistry } from './pago-events-registry';
import { PagoEventManager } from '../domain/pago-event-manager';
import { Pago } from '../domain/entities/pago.entity';
import { ActualizarEstadoSuscripcionListener } from './listeners/actualizar-estado-suscripcion.listener';
import { AccesoComunidadListener } from './listeners/acceso-comunidad.listener';
import { NotificacionEmailListener } from './listeners/notificacion-email.listener';

describe('PagoEventsRegistry & Listeners', () => {
  let eventManager: PagoEventManager;
  let activarSuscripcionMock: any;
  let accesoComunidadMock: any;
  let notificacionEmailMock: any;

  beforeEach(() => {
    eventManager = new PagoEventManager();
    activarSuscripcionMock = { update: jest.fn() };
    accesoComunidadMock = { update: jest.fn() };
    notificacionEmailMock = { update: jest.fn() };
  });

  it('debe registrar todos los listeners pasivos en el evento pagoAprobado', () => {
    PagoEventsRegistry.registrar(
      eventManager,
      activarSuscripcionMock,
      accesoComunidadMock,
      notificacionEmailMock,
    );

    const listeners = eventManager.getListeners('pagoAprobado');
    expect(listeners).toHaveLength(3);
    expect(listeners).toContain(activarSuscripcionMock);
    expect(listeners).toContain(accesoComunidadMock);
    expect(listeners).toContain(notificacionEmailMock);
  });

  it('debe notificar e invocar el método update de los listeners cuando se ejecuta notify', () => {
    PagoEventsRegistry.registrar(
      eventManager,
      activarSuscripcionMock,
      accesoComunidadMock,
      notificacionEmailMock,
    );

    const mockPago = {} as Pago;
    eventManager.notify('pagoAprobado', mockPago);

    expect(activarSuscripcionMock.update).toHaveBeenCalledWith(mockPago);
    expect(accesoComunidadMock.update).toHaveBeenCalledWith(mockPago);
    expect(notificacionEmailMock.update).toHaveBeenCalledWith(mockPago);
  });
});
