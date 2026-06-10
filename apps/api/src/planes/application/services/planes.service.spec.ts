/**
 * ============================================================================
 * GUÍA DE USO Y COMANDOS DE EJECUCIÓN
 * ============================================================================
 * 
 * Este archivo contiene las pruebas unitarias (Unit Tests) para el servicio
 * de planes. NO requiere que la base de datos o el servidor estén encendidos.
 * 
 * 🚀 CÓMO EJECUTAR ESTAS PRUEBAS:
 * 
 * OPCIÓN 1 (Recomendada) - Ejecutar desde la raíz del monorepo usando pnpm:
 *   $ pnpm --filter api test -- src/planes/application/services/planes.service.spec.ts
 * 
 * OPCIÓN 2 - Moviéndote primero a la carpeta de la API:
 *   $ cd apps/api
 *   $ npm run test -- src/planes/application/services/planes.service.spec.ts
 * ============================================================================
 */

// ============================================================================
// 1. MOCK DE DEPENDENCIAS EXTERNAS
// ============================================================================
// Aquí simulamos (mockeamos) el decorador @Transactional de NestJS.
jest.mock('@nestjs-cls/transactional', () => ({
    Transactional:
        () => (target: any, key: string, descriptor: PropertyDescriptor) => {
            return descriptor;
        },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PlanesService } from './planes.service';
import { IPlanesRepository } from '../../domain/ports/planes.repository.interface';
import { IMercadoPagoService } from '../../../mercadopago/services/mercadopago.service.interface';
import { PlanComunidad } from '../../domain/entities/plan.entity';
import type { CrearPlanCommand } from '../commands/planes.commands';

// ============================================================================
// 2. DATOS DE PRUEBA (FIXTURES)
// ============================================================================
// ─── Comando base válido reutilizable en todos los tests ────────────────────
const comandoValido: CrearPlanCommand = {
    titulo: 'Plan Mensual Premium',
    descripcion: 'Acceso completo a todos los cursos',
    precio: 5000,
    frecuencia: 1,
    tipo_frecuencia: 'months',
    moneda: 'ARS',
    id_comunidad: 'comunidad-uuid-123',
};

// ============================================================================
// 3. SUITE DE PRUEBAS PARA PlanesService
// ============================================================================
describe('PlanesService - crearPlan()', () => {
    let service: PlanesService;
    let planesRepoMock: jest.Mocked<IPlanesRepository>;
    let mpServiceMock: jest.Mocked<IMercadoPagoService>;
    let configServiceMock: jest.Mocked<ConfigService>;

    // ============================================================================
    // CONFIGURACIÓN INICIAL (Se ejecuta ANTES de cada 'it')
    // ============================================================================
    beforeEach(async () => {
        // 1. Creamos los Mocks (Funciones Espía)
        planesRepoMock = {
            crearPlan: jest.fn(),
            actualizarPlan: jest.fn(),
            buscarPlanPorId: jest.fn(),
            buscarPlanesPorComunidad: jest.fn(),
            buscarCiclosDePago: jest.fn(),
        } as any;

        mpServiceMock = {
            createPreapprovalPlan: jest.fn(),
            cancelPreapprovalPlan: jest.fn(),
            createSubscription: jest.fn(),
            getPayment: jest.fn(),
        } as any;

        configServiceMock = {
            get: jest.fn().mockReturnValue('https://miapp.com'),
        } as any;

        // 2. Creamos el Módulo de Prueba
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlanesService,
                { provide: IPlanesRepository, useValue: planesRepoMock },
                { provide: IMercadoPagoService, useValue: mpServiceMock },
                { provide: ConfigService, useValue: configServiceMock },
            ],
        }).compile();

        // 3. Obtenemos el servicio a probar
        service = module.get<PlanesService>(PlanesService);
    });

    // ============================================================================
    // CASOS DE PRUEBA (CP)
    // ============================================================================

    // ── CP1: flujo exitoso completo ────────────────────────────────────────────
    // Verifica que se integre correctamente con MercadoPago y guarde en la BD.
    it('CP1 - debe crear el plan correctamente cuando todos los datos son válidos', async () => {
        // ARRANGE
        mpServiceMock.createPreapprovalPlan.mockResolvedValue({
            mp_preapproval_plan_id: 'mp-plan-abc123',
        });
        const planCreado = { titulo: comandoValido.titulo } as PlanComunidad;
        planesRepoMock.crearPlan.mockResolvedValue(planCreado);

        // ACT
        const resultado = await service.crearPlan(comandoValido);

        // ASSERT
        expect(mpServiceMock.createPreapprovalPlan).toHaveBeenCalledTimes(1);
        expect(planesRepoMock.crearPlan).toHaveBeenCalledTimes(1);
        expect(resultado.plan).toBeDefined();
    });

    // ── CP2: precio = 0 ───────────────────────────────────────────────────────
    // Valida que el precio no pueda ser 0.
    it('CP2 - debe lanzar BadRequestException con mensaje "El precio debe ser mayor a cero" cuando el precio es igual a cero', async () => {
        const comando = { ...comandoValido, precio: 0 };

        await expect(service.crearPlan(comando)).rejects.toThrow(BadRequestException);
        await expect(service.crearPlan(comando)).rejects.toThrow('El precio debe ser mayor a cero');
        expect(mpServiceMock.createPreapprovalPlan).not.toHaveBeenCalled(); // No debe llamar a MP
    });

    // ── CP3: precio negativo ──────────────────────────────────────────────────
    // Valida que el precio no sea negativo.
    it('CP3 - debe lanzar BadRequestException con mensaje "El precio debe ser mayor a cero" cuando el precio es negativo', async () => {
        const comando = { ...comandoValido, precio: -100 };

        await expect(service.crearPlan(comando)).rejects.toThrow(BadRequestException);
        await expect(service.crearPlan(comando)).rejects.toThrow('El precio debe ser mayor a cero');
        expect(mpServiceMock.createPreapprovalPlan).not.toHaveBeenCalled();
    });

    // ── CP4: frecuencia = 0 ───────────────────────────────────────────────────
    it('CP4 - debe lanzar BadRequestException con mensaje "La frecuencia debe ser mayor a cero" cuando la frecuencia es igual a cero', async () => {
        const comando = { ...comandoValido, frecuencia: 0 };

        await expect(service.crearPlan(comando)).rejects.toThrow(BadRequestException);
        await expect(service.crearPlan(comando)).rejects.toThrow('La frecuencia debe ser mayor a cero');
        expect(mpServiceMock.createPreapprovalPlan).not.toHaveBeenCalled();
    });

    // ── CP5: combinación de frecuencia no mapeada ─────────────────────────────
    // Se asegura de que no se usen periodos de tiempo no soportados.
    it('CP5 - debe lanzar BadRequestException con mensaje "La combinación de frecuencia y tipo no es válida" cuando la combinación tipo/frecuencia no existe en el sistema', async () => {
        const comando = { ...comandoValido, tipo_frecuencia: 'weeks' as any, frecuencia: 2 };

        await expect(service.crearPlan(comando)).rejects.toThrow(BadRequestException);
        await expect(service.crearPlan(comando)).rejects.toThrow('La combinación de frecuencia y tipo no es válida');
        expect(mpServiceMock.createPreapprovalPlan).not.toHaveBeenCalled();
    });

    // ── CP6: moneda no soportada ──────────────────────────────────────────────
    it('CP6 - debe lanzar BadRequestException con mensaje "Moneda no válida" cuando la moneda no está soportada', async () => {
        const comando = { ...comandoValido, moneda: 'EUR' as any };

        await expect(service.crearPlan(comando)).rejects.toThrow(BadRequestException);
        await expect(service.crearPlan(comando)).rejects.toThrow('Moneda no válida');
        expect(mpServiceMock.createPreapprovalPlan).not.toHaveBeenCalled();
    });

    // ── CP7: falla Mercado Pago ───────────────────────────────────────────────
    // Si MercadoPago se cae o responde con error, el servicio debe manejarlo limpiamente.
    it('CP7 - debe propagar InternalServerErrorException desde MP sin llamar a crearPlan() en BD cuando Mercado Pago falla', async () => {
        mpServiceMock.createPreapprovalPlan.mockRejectedValue(
            new InternalServerErrorException('No se pudo registrar el plan en Mercado Pago, intentá de nuevo'),
        );

        await expect(service.crearPlan(comandoValido)).rejects.toThrow(InternalServerErrorException);
        expect(planesRepoMock.crearPlan).not.toHaveBeenCalled(); // No debe guardar nada en BD
    });

    // ── CP8: MP ok pero falla la BD → rollback en MP ─────────────────────────
    // Prueba un caso complejo: Se creó el plan en MP pero falló la BD local. 
    // Se DEBE cancelar en MP para que no quede huérfano.
    it('CP8 - debe cancelar el plan en MP y lanzar InternalServerErrorException con mensaje "Error al guardar el plan, intentá de nuevo" cuando falla la BD', async () => {
        mpServiceMock.createPreapprovalPlan.mockResolvedValue({
            mp_preapproval_plan_id: 'mp-plan-abc123',
        });
        planesRepoMock.crearPlan.mockRejectedValue(new Error('DB connection error'));
        mpServiceMock.cancelPreapprovalPlan.mockResolvedValue(undefined);

        await expect(service.crearPlan(comandoValido)).rejects.toThrow(InternalServerErrorException);
        await expect(service.crearPlan(comandoValido)).rejects.toThrow('Error al guardar el plan, intentá de nuevo');

        // ASSERT CLAVE: Verifica que se haya llamado a la cancelación en MP
        expect(mpServiceMock.cancelPreapprovalPlan).toHaveBeenCalledWith('mp-plan-abc123');
    });
});