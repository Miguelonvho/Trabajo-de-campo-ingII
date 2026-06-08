/**
 * ============================================================================
 * GUÍA DE USO Y COMANDOS DE EJECUCIÓN
 * ============================================================================
 * 
 * Este archivo contiene las pruebas unitarias (Unit Tests) para el servicio
 * de suscripciones. NO requiere que la base de datos o el servidor estén encendidos.
 * 
 * 🚀 CÓMO EJECUTAR ESTAS PRUEBAS:
 * 
 * OPCIÓN 1 (Recomendada) - Ejecutar todas las pruebas desde la raíz:
 *   $ pnpm --filter api test -- src/suscripciones/application/services/suscripciones.service.spec.ts
 * 
 * OPCIÓN 2 - Ejecutar solo las pruebas de "crearSuscripcion" (crear suscripción):
 *   $ pnpm --filter api test -- src/suscripciones/application/services/suscripciones.service.spec.ts -t "crearSuscripcion"
 * 
 * OPCIÓN 3 - Moviéndose primero a la carpeta de la API:
 *   $ cd apps/api
 *   $ npm run test -- src/suscripciones/application/services/suscripciones.service.spec.ts
 * ============================================================================
 */

// ============================================================================
// 1. MOCK DE DEPENDENCIAS EXTERNAS
// ============================================================================
jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () => (target: any, key: string, descriptor: PropertyDescriptor) => {
      return descriptor;
    },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';

import { SuscripcionesService } from './suscripciones.service';
import { ISuscripcionesRepository } from '../../domain/ports/suscripciones.repository.interface';
import { IPlanesService } from '../../../planes/application/services/planes.service.interface';
import { IMercadoPagoService } from '../../../mercadopago/services/mercadopago.service.interface';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { PlanNotFoundException } from '../../../planes/domain/exceptions';
import { Suscripcion } from '../../domain/entities/suscripcion.entity';
import type { CrearSuscripcionCommand } from '../commands/suscripciones.commands';

// ============================================================================
// 2. DATOS DE PRUEBA (FIXTURES)
// ============================================================================
// ─── Datos base reutilizables ─────────────────────────────────────────────────
const comandoValido: CrearSuscripcionCommand = {
  id_plan_comunidad: 'plan-uuid-123',
  token_tarjeta: 'card-token-abc',
  email: 'usuario@test.com',
};

const planMock = {
  id_plan_comunidad: 'plan-uuid-123',
  mp_preapproval_plan_id: 'mp-plan-abc123',
  titulo: 'Plan Mensual',
  activa: true,
};

// ============================================================================
// 3. SUITE DE PRUEBAS PARA SuscripcionesService
// ============================================================================
describe('SuscripcionesService', () => {
  let service: SuscripcionesService;
  let repoMock: jest.Mocked<ISuscripcionesRepository>;
  let planesServiceMock: jest.Mocked<IPlanesService>;
  let mpServiceMock: jest.Mocked<IMercadoPagoService>;
  let miembroServiceMock: jest.Mocked<IMiembroService>;

  // ============================================================================
  // CONFIGURACIÓN INICIAL (Se ejecuta ANTES de cada 'it')
  // ============================================================================
  beforeEach(async () => {
    // 1. Creamos los Mocks
    repoMock = {
      crearSuscripcion: jest.fn(),
      actualizarSuscripcion: jest.fn(),
      buscarSuscripcionPorId: jest.fn(),
      buscarSuscripcionPorMpId: jest.fn(),
      buscarEstadoIdPorNombre: jest.fn(),
      buscarSuscripcionActiva: jest.fn(),
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

    miembroServiceMock = {
      agregarMiembro: jest.fn(),
      cambiarRolMiembro: jest.fn(),
      esCreador: jest.fn(),
      buscarMiembro: jest.fn(),
      removerMiembro: jest.fn(),
    } as any;

    // 2. Módulo de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuscripcionesService,
        { provide: ISuscripcionesRepository, useValue: repoMock },
        { provide: IPlanesService, useValue: planesServiceMock },
        { provide: IMercadoPagoService, useValue: mpServiceMock },
        { provide: IMiembroService, useValue: miembroServiceMock },
      ],
    }).compile();

    service = module.get<SuscripcionesService>(SuscripcionesService);
  });

  // ============================================================================
  // PRUEBAS PARA crearSuscripcion()
  // ============================================================================
  describe('crearSuscripcion()', () => {

  // ── CP1: flujo exitoso ────────────────────────────────────────────────────
  // Verifica el "Happy Path" de una suscripción
  it('CP1 - debe crear la suscripción correctamente en estado PENDIENTE cuando todos los datos son válidos', async () => {
    // ARRANGE
    planesServiceMock.getPlan.mockResolvedValue(planMock as any);
    mpServiceMock.createSubscription.mockResolvedValue({
      mp_subscription_id: 'mp-sub-xyz789',
      init_point: 'https://mp.com/checkout',
    });
    repoMock.buscarEstadoIdPorNombre.mockResolvedValue('uuid-pendiente');
    repoMock.crearSuscripcion.mockImplementation(async (s: Suscripcion) => s);

    // ACT
    const resultado = await service.crearSuscripcion(comandoValido, 'user-uuid-456');

    // ASSERT
    expect(resultado).toBeDefined();
    expect(resultado.mp_subscription_id).toBe('mp-sub-xyz789');
    expect(resultado.id_estado).toBe('uuid-pendiente'); // Por defecto debe crearse como pendiente
    expect(resultado.id_usuario).toBe('user-uuid-456');
    expect(resultado.id_plan_comunidad).toBe('plan-uuid-123');
    
    // Verificamos integración con otros módulos
    expect(planesServiceMock.getPlan).toHaveBeenCalledWith('plan-uuid-123');
    expect(mpServiceMock.createSubscription).toHaveBeenCalledWith(
      'mp-plan-abc123',
      'usuario@test.com',
      'card-token-abc',
    );
  });

  // ── CP2: plan no existe ───────────────────────────────────────────────────
  it('CP2 - debe lanzar PlanNotFoundException con mensaje "Plan no encontrado" cuando el plan solicitado no existe', async () => {
    planesServiceMock.getPlan.mockRejectedValue(
      new PlanNotFoundException('plan-uuid-invalido'),
    );

    await expect(
      service.crearSuscripcion(
        { ...comandoValido, id_plan_comunidad: 'plan-uuid-invalido' },
        'user-uuid-456',
      ),
    ).rejects.toThrow(PlanNotFoundException);

    // Verificamos que se detenga el flujo
    expect(mpServiceMock.createSubscription).not.toHaveBeenCalled();
    expect(repoMock.crearSuscripcion).not.toHaveBeenCalled();
  });

  // ── CP3: plan sin mp_preapproval_plan_id ──────────────────────────────────
  it('CP3 - debe lanzar InternalServerErrorException con mensaje "El plan no está correctamente registrado en Mercado Pago" cuando el plan no tiene mp_preapproval_plan_id', async () => {
    // Simulamos un plan que nunca se registró en MercadoPago
    const planSinMpId = { ...planMock, mp_preapproval_plan_id: null };
    planesServiceMock.getPlan.mockResolvedValue(planSinMpId as any);

    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow('El plan no está correctamente registrado en Mercado Pago');

    expect(mpServiceMock.createSubscription).not.toHaveBeenCalled();
  });

  // ── CP4: falla Mercado Pago ───────────────────────────────────────────────
  // Verifica el manejo de errores externos (Pasarela de pagos caída)
  it('CP4 - debe propagar InternalServerErrorException con mensaje "Error de comunicación con la pasarela de pagos. No se pudo procesar la suscripción." cuando MP falla', async () => {
    planesServiceMock.getPlan.mockResolvedValue(planMock as any);
    mpServiceMock.createSubscription.mockRejectedValue(
      new InternalServerErrorException(
        'Error de comunicación con la pasarela de pagos. No se pudo procesar la suscripción.',
      ),
    );

    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow('Error de comunicación con la pasarela de pagos. No se pudo procesar la suscripción.');

    expect(repoMock.crearSuscripcion).not.toHaveBeenCalled();
  });

  // ── CP5: estado 'pending' no configurado en BD ────────────────────────────
  it('CP5 - debe lanzar InternalServerErrorException con mensaje "El estado pending no se encuentra configurado en la base de datos" cuando falta en BD', async () => {
    planesServiceMock.getPlan.mockResolvedValue(planMock as any);
    mpServiceMock.createSubscription.mockResolvedValue({
      mp_subscription_id: 'mp-sub-xyz789',
      init_point: 'https://mp.com/checkout',
    });
    // Simulamos un error de configuración de la BD (falta el estado pending)
    repoMock.buscarEstadoIdPorNombre.mockResolvedValue(null);

    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow('El estado pending no se encuentra configurado en la base de datos');
  });

  // ── CP6: falla la persistencia en BD ─────────────────────────────────────
  it('CP6 - debe lanzar InternalServerErrorException con mensaje "Error interno al guardar la suscripción, intente nuevamente" cuando falla la persistencia en BD', async () => {
    planesServiceMock.getPlan.mockResolvedValue(planMock as any);
    mpServiceMock.createSubscription.mockResolvedValue({
      mp_subscription_id: 'mp-sub-xyz789',
      init_point: 'https://mp.com/checkout',
    });
    repoMock.buscarEstadoIdPorNombre.mockResolvedValue('uuid-pendiente');
    // Simulamos una caída de la base de datos al momento de guardar
    repoMock.crearSuscripcion.mockRejectedValue(new Error('DB timeout'));

    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.crearSuscripcion(comandoValido, 'user-uuid-456'),
    ).rejects.toThrow('Error interno al guardar la suscripción, intente nuevamente');
  });
  });

  // ============================================================================
  // PRUEBAS PARA cancelarSuscripcion()
  // ============================================================================
  describe('cancelarSuscripcion()', () => {
    it('debe lanzar NotFoundException cuando la suscripción no existe', async () => {
      repoMock.buscarSuscripcionPorId.mockResolvedValue(null);

      await expect(
        service.cancelarSuscripcion('sub-uuid-123', 'user-uuid-456'),
      ).rejects.toThrow(NotFoundException);

      expect(repoMock.actualizarSuscripcion).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenException cuando el usuario no es el titular de la suscripción', async () => {
      const suscripcionFicticia = Suscripcion.crearSuscripcion({
        id_usuario: 'usuario-diferente',
        id_plan_comunidad: 'plan-uuid',
        id_estado_pendiente: 'pendiente-uuid',
        mp_subscription_id: 'mp-sub-id',
        init_point: 'init-point',
        back_url: null,
      });
      repoMock.buscarSuscripcionPorId.mockResolvedValue(suscripcionFicticia);

      await expect(
        service.cancelarSuscripcion(suscripcionFicticia.suscripcion_id, 'user-uuid-456'),
      ).rejects.toThrow(ForbiddenException);

      expect(repoMock.actualizarSuscripcion).not.toHaveBeenCalled();
    });

    it('debe lanzar InternalServerErrorException cuando el estado cancelled no está configurado en la BD', async () => {
      const suscripcionFicticia = Suscripcion.crearSuscripcion({
        id_usuario: 'user-uuid-456',
        id_plan_comunidad: 'plan-uuid',
        id_estado_pendiente: 'pendiente-uuid',
        mp_subscription_id: 'mp-sub-id',
        init_point: 'init-point',
        back_url: null,
      });
      repoMock.buscarSuscripcionPorId.mockResolvedValue(suscripcionFicticia);
      repoMock.buscarEstadoIdPorNombre.mockResolvedValue(null);

      await expect(
        service.cancelarSuscripcion(suscripcionFicticia.suscripcion_id, 'user-uuid-456'),
      ).rejects.toThrow(InternalServerErrorException);

      expect(repoMock.actualizarSuscripcion).not.toHaveBeenCalled();
    });

    it('debe cancelar la suscripción correctamente cambiándola a estado cancelado y removiendo al miembro de la comunidad', async () => {
      const suscripcionFicticia = Suscripcion.crearSuscripcion({
        id_usuario: 'user-uuid-456',
        id_plan_comunidad: 'plan-uuid',
        id_estado_pendiente: 'pendiente-uuid',
        mp_subscription_id: 'mp-sub-id',
        init_point: 'init-point',
        back_url: null,
      });
      repoMock.buscarSuscripcionPorId.mockResolvedValue(suscripcionFicticia);
      repoMock.buscarEstadoIdPorNombre.mockResolvedValue('uuid-estado-cancelada');
      planesServiceMock.getPlan.mockResolvedValue({
        id_plan_comunidad: 'plan-uuid',
        id_comunidad: 'comunidad-uuid-123',
      } as any);
      repoMock.actualizarSuscripcion.mockImplementation(async (s) => s);
      miembroServiceMock.removerMiembro.mockResolvedValue(undefined);

      await service.cancelarSuscripcion(suscripcionFicticia.suscripcion_id, 'user-uuid-456');

      expect(suscripcionFicticia.id_estado).toBe('uuid-estado-cancelada');
      expect(repoMock.actualizarSuscripcion).toHaveBeenCalledWith(suscripcionFicticia);
      expect(miembroServiceMock.removerMiembro).toHaveBeenCalledWith({
        id_usuario: 'user-uuid-456',
        id_comunidad: 'comunidad-uuid-123',
      });
    });
  });

  describe('obtenerSuscripcionActiva()', () => {
    it('debe obtener la suscripción activa correctamente', async () => {
      const suscripcionFicticia = Suscripcion.crearSuscripcion({
        id_usuario: 'user-uuid-456',
        id_plan_comunidad: 'plan-uuid',
        id_estado_pendiente: 'pendiente-uuid',
        mp_subscription_id: 'mp-sub-id',
        init_point: 'init-point',
        back_url: null,
      });
      repoMock.buscarSuscripcionActiva.mockResolvedValue(suscripcionFicticia);

      const res = await service.obtenerSuscripcionActiva('comunidad-uuid', 'user-uuid-456');

      expect(res).toBe(suscripcionFicticia);
      expect(repoMock.buscarSuscripcionActiva).toHaveBeenCalledWith('comunidad-uuid', 'user-uuid-456');
    });

    it('debe retornar null si no hay suscripción activa', async () => {
      repoMock.buscarSuscripcionActiva.mockResolvedValue(null);

      const res = await service.obtenerSuscripcionActiva('comunidad-uuid', 'user-uuid-456');

      expect(res).toBeNull();
    });

    it('debe lanzar InternalServerErrorException si el repositorio falla', async () => {
      repoMock.buscarSuscripcionActiva.mockRejectedValue(new Error('DB Timeout'));

      await expect(
        service.obtenerSuscripcionActiva('comunidad-uuid', 'user-uuid-456'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});