/**
 * ============================================================================
 * GUÍA DE USO Y COMANDOS DE EJECUCIÓN
 * ============================================================================
 * 
 * Este archivo contiene las pruebas unitarias (Unit Tests) para el servicio
 * de miembros. NO requiere que la base de datos o el servidor estén encendidos.
 * 
 * 🚀 CÓMO EJECUTAR ESTAS PRUEBAS:
 * 
 * OPCIÓN 1 (Recomendada) - Ejecutar desde la raíz del monorepo usando pnpm:
 *   $ pnpm --filter api test -- src/miembro/application/services/miembro.service.spec.ts
 * 
 * OPCIÓN 2 - Moviéndote primero a la carpeta de la API:
 *   $ cd apps/api
 *   $ npm run test -- src/miembro/application/services/miembro.service.spec.ts
 * 
 * EJECUCIÓN ESPECÍFICA (Opcional):
 * - Si deseas ejecutar solo una prueba en particular y omitir el resto,
 *   cambia la palabra "it" por "it.only" en el caso de prueba deseado.
 * ============================================================================
 */

// ============================================================================
// 1. MOCK DE DEPENDENCIAS EXTERNAS
// ============================================================================
// Aquí simulamos (mockeamos) el decorador @Transactional de NestJS. 
// Como en las pruebas unitarias no nos conectamos a una base de datos real,
// anulamos la lógica de transacciones SQL para evitar errores de conexión.
jest.mock('@nestjs-cls/transactional', () => ({
    Transactional:
        () => (target: any, key: string, descriptor: PropertyDescriptor) => {
            return descriptor;
        },
}));

import { Test, TestingModule } from '@nestjs/testing';

import { MiembroService } from './miembro.service';
import { IMiembroRepository } from '../../domain/ports/miembro.repository.interface';
import { IUsuariosService } from '../../../usuarios/services/usuarios.service.interface';
import { Miembro } from '../../domain/entities/miembro.entity';
import {
    MiembroNoEncontradoException,
    MiembroYaExistenteException,
    ComunidadNoEncontradaException,
} from '../../domain/exceptions';
import type { AgregarMiembroCommand } from '../commands/miembro.commands';

// ============================================================================
// 2. DATOS DE PRUEBA (FIXTURES)
// ============================================================================
// Estos son datos "falsos" pero válidos que usaremos repetidamente en los tests
// para no tener que escribirlos desde cero en cada uno de los casos.
// ─── Datos base reutilizables ─────────────────────────────────────────────────
const comandoValido: AgregarMiembroCommand = {
    id_usuario: 'user-uuid-123',
    id_comunidad: 'comunidad-uuid-456',
    id_rol: 'rol-suscriptor-uuid',
};

const usuarioMock = {
    id: 'user-uuid-123',
    nombre: 'Ivan',
    email: 'ivan@test.com',
};

// ============================================================================
// 3. SUITE DE PRUEBAS PARA MiembroService
// ============================================================================
// 'describe' agrupa una serie de pruebas relacionadas.
describe('MiembroService - agregarMiembro()', () => {
    // Variables donde guardaremos las instancias de nuestros mocks y nuestro servicio
    let service: MiembroService;
    let repoMock: jest.Mocked<IMiembroRepository>;
    let usuariosServiceMock: jest.Mocked<IUsuariosService>;

    // ============================================================================
    // CONFIGURACIÓN INICIAL (Se ejecuta ANTES de cada 'it')
    // ============================================================================
    // El bloque beforeEach garantiza que cada prueba arranque con un entorno limpio,
    // para que los resultados de una prueba no afecten a la siguiente.
    beforeEach(async () => {
        // 1. Creamos los Mocks (Funciones Espía)
        // jest.fn() crea una función vacía que registra cuántas veces fue llamada y con qué.
        repoMock = {
            buscarMiembroPorId: jest.fn(),
            crearMiembro: jest.fn(),
            actualizarMiembro: jest.fn(),
            esCreadorDeComunidad: jest.fn(),
            existeComunidad: jest.fn(),
            existeRol: jest.fn(),
        } as any;

        usuariosServiceMock = {
            buscarPorId: jest.fn(),
            buscarPorCorreo: jest.fn(),
            crearUsuario: jest.fn(),
            actualizarDatosPersonales: jest.fn(),
            desactivarUsuario: jest.fn(),
            reactivarUsuario: jest.fn(),
        } as any;

        // 2. Creamos un Módulo de Prueba de NestJS (Un mini-backend en memoria)
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MiembroService, // El servicio REAL que queremos probar
                // Le decimos a NestJS: "Cuando el servicio te pida una dependencia, entrégale nuestro mock"
                { provide: IMiembroRepository, useValue: repoMock },
                { provide: IUsuariosService, useValue: usuariosServiceMock },
            ],
        }).compile();

        // 3. Obtenemos la instancia del servicio lista para usar en los tests
        service = module.get<MiembroService>(MiembroService);
    });

    // ============================================================================
    // CASOS DE PRUEBA (CP)
    // ============================================================================

    // ── CP1: flujo exitoso ────────────────────────────────────────────────────
    // Prueba el "Camino Feliz": Todo es correcto y se debe crear el miembro.
    it('CP1 - debe agregar al usuario como miembro correctamente cuando todos los datos son válidos', async () => {
        // ARRANGE (Preparar): Configuramos qué deben responder los mocks cuando el servicio los llame
        usuariosServiceMock.buscarPorId.mockResolvedValue(usuarioMock as any);
        repoMock.existeComunidad.mockResolvedValue(true);
        repoMock.buscarMiembroPorId.mockResolvedValue(null); // null = aún no es miembro
        repoMock.crearMiembro.mockResolvedValue(undefined);

        // ACT (Actuar): Ejecutamos el método del servicio
        await service.agregarMiembro(comandoValido);

        // ASSERT (Afirmar): Verificamos que se ejecutó lo que esperábamos
        expect(repoMock.crearMiembro).toHaveBeenCalledTimes(1); // Verificamos que se guardó en BD
        
        // Extraemos el objeto que se le pasó a crearMiembro para validar sus campos
        const miembroCreado: Miembro = repoMock.crearMiembro.mock.calls[0][0];
        expect(miembroCreado.id_usuario).toBe(comandoValido.id_usuario);
        expect(miembroCreado.id_comunidad).toBe(comandoValido.id_comunidad);
        expect(miembroCreado.id_rol_comunidad).toBe(comandoValido.id_rol);
        expect(miembroCreado.activo).toBe(true); // Debe iniciar activo
    });

    // ── CP2: usuario no existe ────────────────────────────────────────────────
    // Prueba de Regla de Negocio: Si el usuario no existe, debemos abortar.
    it('CP2 - debe lanzar MiembroNoEncontradoException con mensaje "El usuario (ID: user-uuid-123) no es miembro de la comunidad (ID: comunidad-uuid-456)" cuando el usuario no existe en el sistema', async () => {
        // ARRANGE: Simulamos que buscarPorId no encuentra a nadie
        usuariosServiceMock.buscarPorId.mockResolvedValue(null);

        // ACT & ASSERT: Esperamos que lanzar el método devuelva una excepción específica
        await expect(service.agregarMiembro(comandoValido)).rejects.toThrow(
            MiembroNoEncontradoException,
        );

        // Verificamos que el proceso se detuvo y no ejecutó pasos posteriores
        expect(repoMock.existeComunidad).not.toHaveBeenCalled();
        expect(repoMock.crearMiembro).not.toHaveBeenCalled();
    });

    // ── CP3: comunidad no existe ──────────────────────────────────────────────
    // Prueba de Regla de Negocio: Si la comunidad no existe, debemos abortar.
    it('CP3 - debe lanzar ComunidadNoEncontradaException con mensaje "La comunidad no fue encontrada (ID: comunidad-uuid-456)" cuando la comunidad no existe', async () => {
        // ARRANGE
        usuariosServiceMock.buscarPorId.mockResolvedValue(usuarioMock as any);
        repoMock.existeComunidad.mockResolvedValue(false); // La comunidad no existe

        // ACT & ASSERT
        await expect(service.agregarMiembro(comandoValido)).rejects.toThrow(
            ComunidadNoEncontradaException,
        );

        // Verificamos que se detuvo antes de buscar miembros o crear algo
        expect(repoMock.buscarMiembroPorId).not.toHaveBeenCalled();
        expect(repoMock.crearMiembro).not.toHaveBeenCalled();
    });

    // ── CP4: miembro ya activo ────────────────────────────────────────────────
    // Prueba de Regla de Negocio: No se puede agregar a alguien que ya está dentro.
    it('CP4 - debe lanzar MiembroYaExistenteException con mensaje "El usuario (ID: user-uuid-123) ya es miembro de la comunidad (ID: comunidad-uuid-456)" cuando el usuario ya es miembro activo de la comunidad', async () => {
        // ARRANGE: Creamos un objeto Miembro que representa que ya está activo
        const miembroActivo = Miembro.reconstituirMiembro({
            id_usuario: comandoValido.id_usuario,
            id_comunidad: comandoValido.id_comunidad,
            id_rol_comunidad: comandoValido.id_rol,
            fecha_ingreso: new Date(),
            activo: true, // IMPORTANTE: está activo
        });

        usuariosServiceMock.buscarPorId.mockResolvedValue(usuarioMock as any);
        repoMock.existeComunidad.mockResolvedValue(true);
        // El repositorio devuelve que ya es miembro
        repoMock.buscarMiembroPorId.mockResolvedValue(miembroActivo);

        // ACT & ASSERT
        await expect(service.agregarMiembro(comandoValido)).rejects.toThrow(
            MiembroYaExistenteException,
        );

        // Verificamos que no se crearon ni actualizaron registros
        expect(repoMock.crearMiembro).not.toHaveBeenCalled();
        expect(repoMock.actualizarMiembro).not.toHaveBeenCalled();
    });

    // ── CP5: miembro desactivado → reactivar con mismo rol ───────────────────
    // Prueba de Recuperación: Si el usuario se había salido y vuelve, se reactiva su membresía anterior.
    it('CP5 - debe reactivar la membresía sin cambiar el rol cuando el usuario tenía membresía desactivada con el mismo rol', async () => {
        // ARRANGE: Miembro que se había dado de baja (activo: false)
        const miembroDesactivado = Miembro.reconstituirMiembro({
            id_usuario: comandoValido.id_usuario,
            id_comunidad: comandoValido.id_comunidad,
            id_rol_comunidad: comandoValido.id_rol, // Tenía el mismo rol
            fecha_ingreso: new Date(),
            activo: false,
        });

        usuariosServiceMock.buscarPorId.mockResolvedValue(usuarioMock as any);
        repoMock.existeComunidad.mockResolvedValue(true);
        repoMock.buscarMiembroPorId.mockResolvedValue(miembroDesactivado);
        repoMock.actualizarMiembro.mockResolvedValue(undefined);

        // ACT
        await service.agregarMiembro(comandoValido);

        // ASSERT: Como ya existía, NO llamamos a crearMiembro, sino a actualizarMiembro
        expect(repoMock.actualizarMiembro).toHaveBeenCalledTimes(1);
        expect(repoMock.crearMiembro).not.toHaveBeenCalled();
        
        // Validamos que la actualización cambió 'activo' a true y mantuvo el rol
        const miembroActualizado: Miembro = repoMock.actualizarMiembro.mock.calls[0][0];
        expect(miembroActualizado.activo).toBe(true);
        expect(miembroActualizado.id_rol_comunidad).toBe(comandoValido.id_rol);
    });

    // ── CP6: miembro desactivado → reactivar con rol diferente ───────────────
    // Prueba de Recuperación + Actualización: Vuelve a ingresar pero con un nuevo rol.
    it('CP6 - debe reactivar la membresía y actualizar el rol cuando el usuario tenía membresía desactivada con un rol distinto', async () => {
        const rolAnterior = 'rol-creador-uuid';
        const nuevoRol = 'rol-suscriptor-uuid';

        // ARRANGE: Miembro desactivado con un rol viejo
        const miembroDesactivadoConOtroRol = Miembro.reconstituirMiembro({
            id_usuario: comandoValido.id_usuario,
            id_comunidad: comandoValido.id_comunidad,
            id_rol_comunidad: rolAnterior,
            fecha_ingreso: new Date(),
            activo: false,
        });

        // Modificamos el comando de prueba para que pida el nuevo rol
        const comandoConNuevoRol: AgregarMiembroCommand = {
            ...comandoValido,
            id_rol: nuevoRol,
        };

        usuariosServiceMock.buscarPorId.mockResolvedValue(usuarioMock as any);
        repoMock.existeComunidad.mockResolvedValue(true);
        repoMock.buscarMiembroPorId.mockResolvedValue(miembroDesactivadoConOtroRol);
        repoMock.actualizarMiembro.mockResolvedValue(undefined);

        // ACT
        await service.agregarMiembro(comandoConNuevoRol);

        // ASSERT
        expect(repoMock.actualizarMiembro).toHaveBeenCalledTimes(1);
        expect(repoMock.crearMiembro).not.toHaveBeenCalled();
        
        // Validamos que se reactivó y ADEMÁS se actualizó el rol al nuevo
        const miembroActualizado: Miembro = repoMock.actualizarMiembro.mock.calls[0][0];
        expect(miembroActualizado.activo).toBe(true);
        expect(miembroActualizado.id_rol_comunidad).toBe(nuevoRol);
    });
});