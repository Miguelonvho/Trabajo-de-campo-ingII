jest.mock('@nestjs-cls/transactional', () => ({
  Transactional: () => (target: any, key: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SuscripcionesService } from './suscripciones.service';
import { ISuscripcionesRepository } from '../infrastructure/suscripciones.repository.interface';
import { IPlanesService } from '../../planes/services/planes.service.interface';
import { IMercadoPagoService } from '../../mercadopago/services/mercadopago.service.interface';
import { NotFoundException } from '@nestjs/common';
import { Suscripcion } from '../models/suscripcion.entity';

describe('SuscripcionesService', () => {
  let service: SuscripcionesService;
  let repoMock: jest.Mocked<ISuscripcionesRepository>;
  let planesServiceMock: jest.Mocked<IPlanesService>;
  let mpServiceMock: jest.Mocked<IMercadoPagoService>;

  beforeEach(async () => {
    repoMock = {
      crearSuscripcion: jest.fn(),
      actualizarSuscripcion: jest.fn(),
      buscarSuscripcionPorId: jest.fn(),
      buscarSuscripcionPorMpId: jest.fn(),
      buscarEstadoIdPorNombre: jest.fn(),
    } as any;

    planesServiceMock = {
      getPlan: jest.fn(),
      crearPlan: jest.fn(),
      getValidCiclosPago: jest.fn(),
      getPlanesPorComunidad: jest.fn(),
      desactivarPlanComunidad: jest.fn(),
      reactivarPlanComunidad: jest.fn(),
    } as any;

    mpServiceMock = {
      createPreapprovalPlan: jest.fn(),
      cancelPreapprovalPlan: jest.fn(),
      createSubscription: jest.fn(),
      getPayment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuscripcionesService,
        { provide: ISuscripcionesRepository, useValue: repoMock },
        { provide: IPlanesService, useValue: planesServiceMock },
        { provide: IMercadoPagoService, useValue: mpServiceMock },
      ],
    }).compile();

    service = module.get<SuscripcionesService>(SuscripcionesService);
  });

  it('debe crear una suscripción exitosamente en estado PENDIENTE', async () => {
    const planMock = {
      id_plan_comunidad: 'plan-123',
      mp_preapproval_plan_id: 'mp-plan-123',
    } as any;

    planesServiceMock.getPlan.mockResolvedValue(planMock);
    mpServiceMock.createSubscription.mockResolvedValue({
      mp_subscription_id: 'mp-sub-123',
      init_point: 'http://init.point',
    });
    repoMock.buscarEstadoIdPorNombre.mockResolvedValue('uuid-pendiente');
    repoMock.crearSuscripcion.mockImplementation(async (s: Suscripcion) => s);

    const resultado = await service.crearSuscripcion(
      {
        id_plan_comunidad: 'plan-123',
        token_tarjeta: 'token-123',
        email: 'test@email.com',
      },
      'user-123',
    );

    expect(resultado).toBeDefined();
    expect(resultado.mp_subscription_id).toBe('mp-sub-123');
    expect(resultado.id_estado).toBe('uuid-pendiente');
    expect(resultado.id_usuario).toBe('user-123');
    expect(resultado.id_plan_comunidad).toBe('plan-123');
    expect(planesServiceMock.getPlan).toHaveBeenCalledWith('plan-123');
    expect(mpServiceMock.createSubscription).toHaveBeenCalledWith('mp-plan-123', 'test@email.com', 'token-123');
  });

  it('debe arrojar NotFoundException si el plan no existe', async () => {
    planesServiceMock.getPlan.mockRejectedValue(new NotFoundException());

    await expect(
      service.crearSuscripcion(
        {
          id_plan_comunidad: 'plan-invalid',
          token_tarjeta: 'token-123',
          email: 'test@email.com',
        },
        'user-123',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
