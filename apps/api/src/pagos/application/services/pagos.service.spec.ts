/**
 * ============================================================================
 * GUÍA DE USO Y COMANDOS DE EJECUCIÓN
 * ============================================================================
 * 
 * Este archivo contiene las pruebas unitarias (Unit Tests) para el servicio
 * de pagos y webhooks. NO requiere que la base de datos o el servidor estén encendidos.
 * 
 * 🚀 CÓMO EJECUTAR ESTAS PRUEBAS:
 * 
 * OPCIÓN 1 (Recomendada) - Ejecutar desde la raíz del monorepo usando pnpm:
 *   $ pnpm --filter api test -- src/pagos/application/services/pagos.service.spec.ts
 * 
 * OPCIÓN 2 - Moviéndote primero a la carpeta de la API:
 *   $ cd apps/api
 *   $ npm run test -- src/pagos/application/services/pagos.service.spec.ts
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
import { InternalServerErrorException } from '@nestjs/common';

import { PagosService } from './pagos.service';
import { IPagosRepository } from '../../domain/ports/pagos.repository.interface';
import { ISuscripcionesRepository } from '../../../suscripciones/domain/ports/suscripciones.repository.interface';
import { IMercadoPagoService } from '../../../mercadopago/services/mercadopago.service.interface';
import { Pago } from '../../domain/entities/pago.entity';
import { PagoObserver } from '../../domain/pago-observer.interface';

// ============================================================================
// 2. DATOS DE PRUEBA (FIXTURES)
// ============================================================================
// ─── Respuesta base de Mercado Pago reutilizable ─────────────────────────────
const pagoMpAprobado = {
  id: 'mp-payment-123',
  preapproval_id: 'mp-sub-123',
  transaction_amount: 5000,
  currency_id: 'ARS',
  status: 'approved',
  payment_method_id: 'visa',
  description: 'Suscripción mensual',
};

const suscripcionMock = {
  suscripcion_id: 'sub-uuid-123',
  id_usuario: 'user-uuid-123',
  id_plan_comunidad: 'plan-uuid-123',
  id_estado: 'pendiente-uuid',
};

// ============================================================================
// 3. SUITE DE PRUEBAS PARA PagosService
// ============================================================================
describe('PagosService - procesarPago()', () => {
  let service: PagosService;
  let pagosRepoMock: jest.Mocked<IPagosRepository>;
  let suscripcionesRepoMock: jest.Mocked<ISuscripcionesRepository>;
  let mpServiceMock: jest.Mocked<IMercadoPagoService>;

  // ============================================================================
  // CONFIGURACIÓN INICIAL (Se ejecuta ANTES de cada 'it')
  // ============================================================================
  beforeEach(async () => {
    // 1. Creamos los Mocks
    pagosRepoMock = {
      crearPago: jest.fn(),
      actualizarPago: jest.fn(),
      buscarPagoPorId: jest.fn(),
      buscarPagoPorMpId: jest.fn(),
      buscarEstadoIdPorNombre: jest.fn(),
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

    // 2. Módulo de prueba
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

  // ============================================================================
  // CASOS DE PRUEBA (CP)
  // ============================================================================

  // ── CP1: pago duplicado (idempotencia) ────────────────────────────────────
  // Verifica el patrón "Idempotencia": Si MP avisa de un pago 2 veces, no lo duplicamos.
  it('CP1 - debe ignorar el procesamiento si el pago ya existe en el sistema (idempotencia)', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue({} as any); // Simula que ya existe

    await service.procesarPago('mp-payment-123');

    // No debe hacer peticiones a MP ni guardar nada de nuevo
    expect(mpServiceMock.getPayment).not.toHaveBeenCalled();
    expect(pagosRepoMock.crearPago).not.toHaveBeenCalled();
  });

  // ── CP2: pago sin preapproval_id ──────────────────────────────────────────
  it('CP2 - debe retornar sin procesar si el pago de Mercado Pago no tiene preapproval_id asociado', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue({
      id: 'mp-payment-123',
      transaction_amount: 5000,
      status: 'approved',
      // No mandamos preapproval_id intencionalmente
    });

    await service.procesarPago('mp-payment-123');

    expect(suscripcionesRepoMock.buscarSuscripcionPorMpId).not.toHaveBeenCalled();
    expect(pagosRepoMock.crearPago).not.toHaveBeenCalled();
  });

  // ── CP3: suscripción local no encontrada ──────────────────────────────────
  it('CP3 - debe retornar sin procesar si no se encuentra una suscripción local vinculada al preapproval_id', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue(pagoMpAprobado);
    // MP manda el ID de suscripción, pero no existe en nuestra base de datos local
    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue(null);

    await service.procesarPago('mp-payment-123');

    expect(pagosRepoMock.buscarEstadoIdPorNombre).not.toHaveBeenCalled();
    expect(pagosRepoMock.crearPago).not.toHaveBeenCalled();
  });

  // ── CP4: estado 'pending' no configurado en BD ────────────────────────────
  // El mensaje real del servicio es diferente al de suscripciones
  it('CP4 - debe lanzar InternalServerErrorException con mensaje "Configuraciones iniciales de estados de pago no configuradas en BD" si el estado pending no está configurado', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue(pagoMpAprobado);
    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue(suscripcionMock as any);
    pagosRepoMock.buscarEstadoIdPorNombre.mockResolvedValue(null); // 'pending' falta

    await expect(service.procesarPago('mp-payment-123')).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.procesarPago('mp-payment-123')).rejects.toThrow(
      'Configuraciones iniciales de estados de pago no configuradas en BD',
    );
    expect(pagosRepoMock.crearPago).not.toHaveBeenCalled();
  });

  // ── CP5: estado 'approved' no configurado en BD ───────────────────────────
  // El mensaje es dinámico: "El estado ${status} no está configurado en BD"
  it('CP5 - debe lanzar InternalServerErrorException con mensaje "El estado approved no está configurado en BD" si el estado approved no está en BD', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue(pagoMpAprobado);
    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue(suscripcionMock as any);

    // Configuramos que SÍ encuentre pending, pero NO approved
    pagosRepoMock.buscarEstadoIdPorNombre.mockImplementation(async (nombre) => {
      if (nombre === 'pending') return 'uuid-pendiente';
      return null;
    });

    await expect(service.procesarPago('mp-payment-123')).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.procesarPago('mp-payment-123')).rejects.toThrow(
      'El estado approved no está configurado en BD',
    );
  });

  // ── CP6: pago aprobado → persiste y notifica observer ────────────────────
  // Verifica el "Camino Feliz" (Happy Path) y el uso del Patrón Observer (Eventos)
  it('CP6 - debe persistir el pago y notificar al observer cuando el pago es aprobado', async () => {
    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue(pagoMpAprobado); // Estado "approved"
    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue(suscripcionMock as any);

    pagosRepoMock.buscarEstadoIdPorNombre.mockImplementation(async (nombre) => {
      if (nombre === 'pending') return 'uuid-pendiente';
      if (nombre === 'approved') return 'uuid-aprobado';
      return null;
    });
    pagosRepoMock.crearPago.mockImplementation(async (p: Pago) => p);

    // Creamos un Observer (Observador) de prueba para validar los eventos
    const mockObserver: PagoObserver = { actualizar: jest.fn() };
    Pago.events.suscribir('pagoAprobado', mockObserver);

    await service.procesarPago('mp-payment-123');

    expect(pagosRepoMock.crearPago).toHaveBeenCalledTimes(1);
    expect(mockObserver.actualizar).toHaveBeenCalledTimes(1); // El Observer debió haber sido notificado

    // Limpieza post-prueba
    Pago.events.desuscribir('pagoAprobado', mockObserver);
  });

  // ── CP7: pago rechazado → persiste y notifica observer ───────────────────
  it('CP7 - debe persistir el pago y notificar al observer cuando el pago es rechazado', async () => {
    const pagoRechazado = { ...pagoMpAprobado, status: 'rejected' }; // Estado "rejected"

    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue(pagoRechazado);
    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue(suscripcionMock as any);

    pagosRepoMock.buscarEstadoIdPorNombre.mockImplementation(async (nombre) => {
      if (nombre === 'pending') return 'uuid-pendiente';
      if (nombre === 'rejected') return 'uuid-rechazado';
      return null;
    });
    pagosRepoMock.crearPago.mockImplementation(async (p: Pago) => p);

    const mockObserver: PagoObserver = { actualizar: jest.fn() };
    Pago.events.suscribir('pagoRechazado', mockObserver);

    await service.procesarPago('mp-payment-123');

    expect(pagosRepoMock.crearPago).toHaveBeenCalledTimes(1);
    expect(mockObserver.actualizar).toHaveBeenCalledTimes(1);

    Pago.events.desuscribir('pagoRechazado', mockObserver);
  });

  // ── CP8: status desconocido → persiste en pendiente sin notificar ─────────
  // Si MP manda un estado intermedio (in_process, mediation, etc.)
  it('CP8 - debe persistir el pago en estado pendiente sin notificar observers cuando el status es desconocido', async () => {
    const pagoEnProceso = { ...pagoMpAprobado, status: 'in_process' }; // Estado distinto

    pagosRepoMock.buscarPagoPorMpId.mockResolvedValue(null);
    mpServiceMock.getPayment.mockResolvedValue(pagoEnProceso);
    suscripcionesRepoMock.buscarSuscripcionPorMpId.mockResolvedValue(suscripcionMock as any);

    pagosRepoMock.buscarEstadoIdPorNombre.mockImplementation(async (nombre) => {
      if (nombre === 'pending') return 'uuid-pendiente';
      return null;
    });
    pagosRepoMock.crearPago.mockImplementation(async (p: Pago) => p);

    const mockObserverAprobado: PagoObserver = { actualizar: jest.fn() };
    const mockObserverRechazado: PagoObserver = { actualizar: jest.fn() };
    Pago.events.suscribir('pagoAprobado', mockObserverAprobado);
    Pago.events.suscribir('pagoRechazado', mockObserverRechazado);

    await service.procesarPago('mp-payment-123');

    // Debe guardar, pero los eventos de Aprobación/Rechazo NO deben dispararse
    expect(pagosRepoMock.crearPago).toHaveBeenCalledTimes(1);
    expect(mockObserverAprobado.actualizar).not.toHaveBeenCalled();
    expect(mockObserverRechazado.actualizar).not.toHaveBeenCalled();

    Pago.events.desuscribir('pagoAprobado', mockObserverAprobado);
    Pago.events.desuscribir('pagoRechazado', mockObserverRechazado);
  });
});