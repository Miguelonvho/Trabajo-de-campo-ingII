/**
 * ============================================================================
 * GUÍA DE USO Y COMANDOS DE EJECUCIÓN
 * ============================================================================
 *
 * Este archivo contiene las pruebas unitarias (Unit Tests) para los métodos
 * actualizarComunidad() y desactivarComunidad() del servicio de comunidades.
 * NO requiere que la base de datos o el servidor estén encendidos.
 *
 * 🚀 CÓMO EJECUTAR ESTAS PRUEBAS:
 *
 * OPCIÓN 1 (Recomendada) - Ejecutar todas las pruebas desde la raíz del monorepo:
 *   $ pnpm --filter api test -- src/comunidad/application/services/comunidad.service.spec.ts
 *
 * OPCIÓN 2 - Ejecutar métodos específicos por separado usando -t:
 *   Para probar actualizarComunidad():
 *   $ pnpm --filter api test -- src/comunidad/application/services/comunidad.service.spec.ts -t "actualizarComunidad"
 *
 *   Para probar desactivarComunidad():
 *   $ pnpm --filter api test -- src/comunidad/application/services/comunidad.service.spec.ts -t "desactivarComunidad"
 *
 * OPCIÓN 3 - Moviéndote primero a la carpeta de la API (todas las pruebas):
 *   $ cd apps/api
 *   $ npm run test -- src/comunidad/application/services/comunidad.service.spec.ts
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

import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ComunidadService } from './comunidad.service';
import { IComunidadRepository } from '../../domain/ports/comunidad.repository.interface';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { ICategoriaComunidadService } from '../../../categoria-comunidad/services/categoria-comunidad.service.interface';
import { Comunidad } from '../../domain/entities/comunidad.entity';
import {
  ComunidadNotFoundException,
  ComunidadYaInactivaException,
} from '../../domain/exceptions';
import { CategoriaNotFoundException } from '../../../categoria-comunidad/domain/exceptions';
import type { ActualizarComunidadCommand } from '../commands/comunidad.commands';

// ============================================================================
// 2. DATOS DE PRUEBA (FIXTURES)
// ============================================================================
const createMockComunidad = (
  props?: Partial<Parameters<typeof Comunidad.reconstituirComunidad>[0]>,
) => {
  return Comunidad.reconstituirComunidad({
    id_comunidad: 'comunidad-uuid-555',
    nombre: 'Comunidad de Prueba',
    slug: 'comunidad-de-prueba',
    activa: true,
    fecha_creacion: new Date(),
    id_categoria_comunidad: 'categoria-uuid-123',
    descripcion: 'Una descripción de prueba',
    portada_url: 'https://ejemplo.com/portada.jpg',
    ...props,
  });
};

// ============================================================================
// 3. SUITE DE PRUEBAS
// ============================================================================
describe('ComunidadService', () => {
  let service: ComunidadService;
  let repoMock: jest.Mocked<IComunidadRepository>;
  let miembroServiceMock: jest.Mocked<IMiembroService>;
  let categoriaComunidadServiceMock: jest.Mocked<ICategoriaComunidadService>;

  beforeEach(async () => {
    repoMock = {
      buscarComunidadesActivas: jest.fn(),
      buscarComunidadesDelCreador: jest.fn(),
      buscarComunidadPorId: jest.fn(),
      buscarComunidadPorSlug: jest.fn(),
      crearComunidad: jest.fn(),
      actualizarComunidad: jest.fn(),
      verificarSiSlugEstaEnUso: jest.fn(),
    } as any;

    miembroServiceMock = {
      agregarMiembro: jest.fn(),
      buscarMiembro: jest.fn(),
    } as any;

    categoriaComunidadServiceMock = {
      validarExistencia: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComunidadService,
        { provide: IComunidadRepository, useValue: repoMock },
        { provide: IMiembroService, useValue: miembroServiceMock },
        { provide: ICategoriaComunidadService, useValue: categoriaComunidadServiceMock },
      ],
    }).compile();

    service = module.get<ComunidadService>(ComunidadService);
  });

  // ==========================================================================
  // actualizarComunidad()
  // ==========================================================================
  describe('actualizarComunidad()', () => {

    // ── CP1: descripción y portada sin cambiar nombre ──────────────────────
    it('CP1 - debe actualizar descripción y portada sin validar categoría ni regenerar el slug cuando el nombre no cambia', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      const command: ActualizarComunidadCommand = {
        descripcion: 'Nueva descripción actualizada',
        portada_url: 'https://ejemplo.com/nueva-portada.jpg',
      };

      // ACT
      const resultado = await service.actualizarComunidad('comunidad-uuid-555', command);

      // ASSERT
      // No debe validar categoría ni verificar slug porque nombre no cambió
      expect(categoriaComunidadServiceMock.validarExistencia).not.toHaveBeenCalled();
      expect(repoMock.verificarSiSlugEstaEnUso).not.toHaveBeenCalled();
      expect(repoMock.actualizarComunidad).toHaveBeenCalledWith(mockComunidad);
      expect(resultado.descripcion).toBe('Nueva descripción actualizada');
      expect(resultado.portada_url).toBe('https://ejemplo.com/nueva-portada.jpg');
      // El slug debe mantenerse igual
      expect(resultado.slug).toBe('comunidad-de-prueba');
    });

    // ── CP2: nombre cambia → regenera slug ────────────────────────────────
    it('CP2 - debe regenerar el slug y verificar su disponibilidad cuando el nombre cambia', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.verificarSiSlugEstaEnUso.mockResolvedValue(false); // Slug disponible
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      const command: ActualizarComunidadCommand = {
        nombre: 'Nuevo Nombre Comunidad',
      };

      // ACT
      const resultado = await service.actualizarComunidad('comunidad-uuid-555', command);

      // ASSERT
      // Debe verificar que el nuevo slug esté disponible
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenCalledWith('nuevo-nombre-comunidad');
      expect(resultado.nombre).toBe('Nuevo Nombre Comunidad');
      expect(resultado.slug).toBe('nuevo-nombre-comunidad');
      expect(repoMock.actualizarComunidad).toHaveBeenCalledTimes(1);
    });

    // ── CP3: nombre cambia → slug en uso → sufijo numérico ────────────────
    it('CP3 - debe agregar sufijo numérico al slug cuando el slug generado por el nuevo nombre ya está en uso', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      // Primera verificación: slug base ocupado; segunda: con sufijo "-2" libre
      repoMock.verificarSiSlugEstaEnUso
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      repoMock.actualizarComunidad.mockImplementation(async (c: Comunidad) => c);

      const command: ActualizarComunidadCommand = {
        nombre: 'Nuevo Nombre Comunidad',
      };

      // ACT
      const resultado = await service.actualizarComunidad('comunidad-uuid-555', command);

      // ASSERT
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenNthCalledWith(1, 'nuevo-nombre-comunidad');
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenNthCalledWith(2, 'nuevo-nombre-comunidad-2');
      expect(resultado.slug).toBe('nuevo-nombre-comunidad-2');
    });

    // ── CP4: categoría cambia → valida existencia ──────────────────────────
    it('CP4 - debe validar la existencia de la nueva categoría cuando id_categoria_comunidad cambia', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      categoriaComunidadServiceMock.validarExistencia.mockResolvedValue(undefined);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      const command: ActualizarComunidadCommand = {
        id_categoria_comunidad: 'nueva-categoria-uuid',
      };

      // ACT
      await service.actualizarComunidad('comunidad-uuid-555', command);

      // ASSERT
      expect(categoriaComunidadServiceMock.validarExistencia).toHaveBeenCalledWith('nueva-categoria-uuid');
      expect(repoMock.actualizarComunidad).toHaveBeenCalledTimes(1);
    });

    // ── CP5: categoría no existe → excepción ──────────────────────────────
    it('CP5 - debe lanzar CategoriaNotFoundException con mensaje "Categoría no encontrada (ID: nueva-categoria-uuid)" y no persistir cuando la nueva categoría no existe', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      categoriaComunidadServiceMock.validarExistencia.mockRejectedValue(
        new CategoriaNotFoundException('nueva-categoria-uuid'),
      );

      const command: ActualizarComunidadCommand = {
        id_categoria_comunidad: 'nueva-categoria-uuid',
      };

      // ACT & ASSERT
      await expect(
        service.actualizarComunidad('comunidad-uuid-555', command),
      ).rejects.toThrow(CategoriaNotFoundException);
      await expect(
        service.actualizarComunidad('comunidad-uuid-555', command),
      ).rejects.toThrow('Categoría no encontrada (ID: nueva-categoria-uuid)');

      // No debe intentar persistir si la categoría no es válida
      expect(repoMock.actualizarComunidad).not.toHaveBeenCalled();
    });

    // ── CP6: comunidad no existe → excepción ──────────────────────────────
    it('CP6 - debe lanzar ComunidadNotFoundException con mensaje "Comunidad no encontrada (búsqueda por ID: id-inexistente)" cuando la comunidad a actualizar no existe', async () => {
      // ARRANGE
      repoMock.buscarComunidadPorId.mockResolvedValue(null);

      const command: ActualizarComunidadCommand = {
        descripcion: 'Cualquier descripción',
      };

      // ACT & ASSERT
      await expect(
        service.actualizarComunidad('id-inexistente', command),
      ).rejects.toThrow(ComunidadNotFoundException);
      await expect(
        service.actualizarComunidad('id-inexistente', command),
      ).rejects.toThrow('Comunidad no encontrada (búsqueda por ID: id-inexistente)');

      expect(repoMock.actualizarComunidad).not.toHaveBeenCalled();
    });

    // ── CP7: misma categoría → no revalida ────────────────────────────────
    it('CP7 - no debe validar la categoría cuando el id_categoria_comunidad enviado es idéntico al actual', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ id_categoria_comunidad: 'categoria-uuid-123' });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      // Enviamos la misma categoría que ya tiene la comunidad
      const command: ActualizarComunidadCommand = {
        id_categoria_comunidad: 'categoria-uuid-123',
      };

      // ACT
      await service.actualizarComunidad('comunidad-uuid-555', command);

      // ASSERT
      // No debe validar porque es la misma categoría
      expect(categoriaComunidadServiceMock.validarExistencia).not.toHaveBeenCalled();
      expect(repoMock.actualizarComunidad).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // desactivarComunidad()
  // ==========================================================================
  describe('desactivarComunidad()', () => {

    // ── CP1: desactivación exitosa ─────────────────────────────────────────
    it('CP1 - debe desactivar una comunidad activa correctamente y persistir el cambio', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: true });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      // ACT
      await service.desactivarComunidad('comunidad-uuid-555');

      // ASSERT
      expect(repoMock.buscarComunidadPorId).toHaveBeenCalledWith('comunidad-uuid-555');
      // El atributo activa debe haber cambiado a false en la entidad
      expect(mockComunidad.activa).toBe(false);
      expect(repoMock.actualizarComunidad).toHaveBeenCalledWith(mockComunidad);
    });

    // ── CP2: comunidad ya inactiva → excepción ────────────────────────────
    it('CP2 - debe lanzar ComunidadYaInactivaException con mensaje "La comunidad ya está inactiva (ID: comunidad-uuid-555)" y no persistir cuando la comunidad ya está inactiva', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: false });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);

      // ACT & ASSERT
      await expect(
        service.desactivarComunidad('comunidad-uuid-555'),
      ).rejects.toThrow(ComunidadYaInactivaException);
      await expect(
        service.desactivarComunidad('comunidad-uuid-555'),
      ).rejects.toThrow('La comunidad ya está inactiva (ID: comunidad-uuid-555)');

      // No debe intentar persistir si ya estaba inactiva
      expect(repoMock.actualizarComunidad).not.toHaveBeenCalled();
    });

    // ── CP3: comunidad no existe → excepción ─────────────────────────────
    it('CP3 - debe lanzar ComunidadNotFoundException con mensaje "Comunidad no encontrada (búsqueda por ID: id-inexistente)" cuando la comunidad a desactivar no existe', async () => {
      // ARRANGE
      repoMock.buscarComunidadPorId.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.desactivarComunidad('id-inexistente'),
      ).rejects.toThrow(ComunidadNotFoundException);
      await expect(
        service.desactivarComunidad('id-inexistente'),
      ).rejects.toThrow('Comunidad no encontrada (búsqueda por ID: id-inexistente)');

      expect(repoMock.actualizarComunidad).not.toHaveBeenCalled();
    });

    // ── CP4: retorna void ────────────────────────────────────────────────
    it('CP4 - debe retornar void (sin valor) cuando la desactivación es exitosa', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: true });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      // ACT
      const resultado = await service.desactivarComunidad('comunidad-uuid-555');

      // ASSERT
      expect(resultado).toBeUndefined();
    });

    // ── CP5: actualizarComunidad llamado exactamente una vez ─────────────
    it('CP5 - debe llamar a actualizarComunidad exactamente una vez con la entidad modificada', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: true });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      // ACT
      await service.desactivarComunidad('comunidad-uuid-555');

      // ASSERT
      expect(repoMock.actualizarComunidad).toHaveBeenCalledTimes(1);
      // La entidad enviada al repositorio ya debe tener activa = false
      const entidadPersistida: Comunidad = repoMock.actualizarComunidad.mock.calls[0][0];
      expect(entidadPersistida.activa).toBe(false);
    });

    // ── CP6: activa no cambia si hay error de persistencia ───────────────
    it('CP6 - debe propagar el error si actualizarComunidad falla en la persistencia', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: true });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockRejectedValue(new Error('DB connection error'));

      // ACT & ASSERT
      const promise = service.desactivarComunidad('comunidad-uuid-555');
      await expect(promise).rejects.toThrow(InternalServerErrorException);
      await expect(promise).rejects.toThrow('Error al desactivar la comunidad, intentá de nuevo');
    });
  });
});