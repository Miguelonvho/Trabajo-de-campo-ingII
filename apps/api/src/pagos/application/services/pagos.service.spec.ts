jest.mock('@nestjs-cls/transactional', () => ({
  Transactional: () => (target: any, key: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PagosService } from './pagos.service';
import { IPagosRepository } from '../../domain/ports/pagos.repository.interface';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IMercadoPagoService } from '../../../mercadopago/services/mercadopago.service.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { PagoListener } from '../../domain/pago-listener.interface';

describe('PagosService', () => {
  let service: PagosService;
  let pagosRepoMock: jest.Mocked<IPagosRepository>;
  let suscripcionesRepoMock: jest.Mocked<ISuscripcionesRepository>;
  let mpServiceMock: jest.Mocked<IMercadoPagoService>;

  beforeEach(async () => {
    pagosRepoMock = {
      crearPago: jest.fn(),
      actualizarPago: jest.fn(),
      buscarPagoPorId: jest.fn(),
      buscarPagoPorMpId: jest.fn(),
      buscarEstadoIdPorNombre: jest.fn(),
      buscarMonedaIdPorNombre: jest.fn(),
    } as any;

    suscripcionesRepoMock = {
      crearSuscripcion: jest.fn(),
      actualizarSuscripcion: jest.fn(),
      buscarSuscripcionPorId: jest.fn(),
      buscarSuscripcionPorMpId: jest.fn(),
      buscarEstadoIdPorNombre: jest.fn(),
    } as any;

    mpServiceMock = {
      createPreapprovalPlan: jest.fn(),
      cancelPreapprovalPlan: jest.fn(),
      createSubscription: jest.fn(),
      getPayment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        { provide: IPagosRepository, useValue: pagosRepoMock },
        { provide: ISuscripcionesRepository, useValue: suscripcionesRepoMock },
        { provide: IMercadoPagoService, useValue: mpServiceMock },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
  });

  it('debe ignorar el procesamiento si el pago ya existe (idempotencia)', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue({} as any);

    await service.procesarNotificacionPago('mp-payment-123');

    expect(mpServiceMock.getPayment).not.toHaveBeenCalled();
  });

  it('debe crear un pago y notificar a los observadores si se aprueba', async () => {
    // 1. Configurar mocks de repositorios y servicios externos
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue({
      id: 'mp-payment-123',
      preapproval_id: 'mp-sub-123',
      transaction_amount: 1000,
      currency_id: 'ARS',
      status: 'approved',
      payment_method_id: 'visa',
      description: 'Suscripción mensual',
    });

    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue({
      suscripcion_id: 'sub-123',
      id_usuario: 'user-123',
      id_plan_comunidad: 'plan-123',
      id_estado: 'pendiente-uuid',
    } as any);

    pagosRepoMock.buscarEstadoIdPorNombre.mockImplementation(async (nombre) => {
      if (nombre === 'PENDIENTE') return 'uuid-pago-pendiente';
      if (nombre === 'APROBADO') return 'uuid-pago-aprobado';
      return null;
    });

    pagosRepoMock.buscarMonedaIdPorNombre.mockResolvedValue('uuid-moneda-ars');
    pagosRepoMock.crearPago.mockImplementation(async (p: Pago) => p);
    pagosRepoMock.actualizarPago.mockImplementation(async (p: Pago) => p);

    // 2. Suscribir un Mock Listener para verificar el patrón Observer
    const mockListener: PagoListener = {
      update: jest.fn(),
    };
    Pago.events.subscribe('pagoAprobado', mockListener);

    // 3. Ejecutar el webhook
    await service.procesarNotificacionPago('mp-payment-123');

    // 4. Verificar aserciones
    expect(pagosRepoMock.crearPago).toHaveBeenCalled();
    expect(pagosRepoMock.actualizarPago).toHaveBeenCalled();
    expect(mockListener.update).toHaveBeenCalled();

    // Limpiar suscripción del test anterior
    Pago.events.unsubscribe('pagoAprobado', mockListener);
  });
});
