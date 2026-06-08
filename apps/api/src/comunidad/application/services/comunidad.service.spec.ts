/**
 * ============================================================================
 * GUÍA DE USO Y COMANDOS DE EJECUCIÓN
 * ============================================================================
 * 
 * Este archivo contiene las pruebas unitarias (Unit Tests) para el servicio
 * de comunidades. NO requiere que la base de datos o el servidor estén encendidos.
 * 
 * 🚀 CÓMO EJECUTAR ESTAS PRUEBAS:
 * 
 * OPCIÓN 1 (Recomendada) - Ejecutar desde la raíz del monorepo usando pnpm:
 *   $ pnpm --filter api test -- src/comunidad/application/services/comunidad.service.spec.ts
 * 
 * OPCIÓN 2 - Moviéndote primero a la carpeta de la API:
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

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ComunidadService } from './comunidad.service';
import { IComunidadRepository } from '../../domain/ports/comunidad.repository.interface';
import { IMiembroService } from '../../../miembro/application/services/miembro.service.interface';
import { ICategoriaComunidadService } from '../../../categoria-comunidad/services/categoria-comunidad.service.interface';
import { Comunidad } from '../../domain/entities/comunidad.entity';
import { ROLES } from '../../../common/constants/roles';
import {
  ComunidadNotFoundException,
  SinComunidadesActivasException,
  ComunidadYaInactivaException,
  ComunidadYaActivaException,
} from '../../domain/exceptions';
import { CategoriaNotFoundException } from '../../../categoria-comunidad/domain/exceptions';
import type {
  CrearComunidadCommand,
  ActualizarComunidadCommand,
} from '../commands/comunidad.commands';

// ============================================================================
// 2. DATOS DE PRUEBA (FIXTURES)
// ============================================================================
const commandCrearValido: CrearComunidadCommand = {
  nombre: 'Comunidad de Prueba',
  descripcion: 'Una descripción para la comunidad de prueba',
  portada_url: 'https://ejemplo.com/portada.jpg',
  id_categoria_comunidad: 'categoria-uuid-123',
};

const idCreadorValido = 'creador-uuid-999';

// Helper para reconstituir comunidad en los tests
const createMockComunidad = (props?: Partial<Parameters<typeof Comunidad.reconstituirComunidad>[0]>) => {
  return Comunidad.reconstituirComunidad({
    id_comunidad: 'comunidad-uuid-555',
    nombre: 'Comunidad de Prueba',
    slug: 'comunidad-de-prueba',
    activa: true,
    fecha_creacion: new Date(),
    id_categoria_comunidad: 'categoria-uuid-123',
    descripcion: 'Una descripción para la comunidad de prueba',
    portada_url: 'https://ejemplo.com/portada.jpg',
    ...props,
  });
};

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

  describe('crearComunidad()', () => {
    it('CP1 - debe crear una comunidad correctamente cuando todos los datos son válidos', async () => {
      // ARRANGE
      categoriaComunidadServiceMock.validarExistencia.mockResolvedValue(undefined);
      repoMock.verificarSiSlugEstaEnUso.mockResolvedValue(false); // Slug no en uso
      
      const mockComunidad = createMockComunidad({ activa: false });
      repoMock.crearComunidad.mockResolvedValue(mockComunidad);
      miembroServiceMock.agregarMiembro.mockResolvedValue({} as any);

      // ACT
      const resultado = await service.crearComunidad(commandCrearValido, idCreadorValido);

      // ASSERT
      expect(categoriaComunidadServiceMock.validarExistencia).toHaveBeenCalledWith(commandCrearValido.id_categoria_comunidad);
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenCalledWith('comunidad-de-prueba');
      expect(repoMock.crearComunidad).toHaveBeenCalledTimes(1);
      expect(miembroServiceMock.agregarMiembro).toHaveBeenCalledWith({
        id_usuario: idCreadorValido,
        id_comunidad: mockComunidad.id_comunidad,
        id_rol: ROLES.CREADOR,
      });
      expect(resultado).toBe(mockComunidad);
    });

    it('CP2 - debe lanzar CategoriaNotFoundException si la categoría de comunidad no existe', async () => {
      // ARRANGE
      const errorCategoria = new CategoriaNotFoundException(commandCrearValido.id_categoria_comunidad);
      categoriaComunidadServiceMock.validarExistencia.mockRejectedValue(errorCategoria);

      // ACT & ASSERT
      await expect(
        service.crearComunidad(commandCrearValido, idCreadorValido)
      ).rejects.toThrow(CategoriaNotFoundException);

      expect(repoMock.crearComunidad).not.toHaveBeenCalled();
      expect(miembroServiceMock.agregarMiembro).not.toHaveBeenCalled();
    });

    it('CP3 - debe generar un slug único agregando sufijo si el slug base está en uso', async () => {
      // ARRANGE
      categoriaComunidadServiceMock.validarExistencia.mockResolvedValue(undefined);
      
      // La primera verificación del slug base retorna true (en uso), la segunda (con -2) retorna false (libre)
      repoMock.verificarSiSlugEstaEnUso
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      let comunidadGuardada: Comunidad | null = null;
      repoMock.crearComunidad.mockImplementation(async (comunidad: Comunidad) => {
        comunidadGuardada = comunidad;
        return comunidad;
      });

      miembroServiceMock.agregarMiembro.mockResolvedValue({} as any);

      // ACT
      await service.crearComunidad(commandCrearValido, idCreadorValido);

      // ASSERT
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenNthCalledWith(1, 'comunidad-de-prueba');
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenNthCalledWith(2, 'comunidad-de-prueba-2');
      expect(comunidadGuardada).not.toBeNull();
      expect(comunidadGuardada!.slug).toBe('comunidad-de-prueba-2');
    });

    it('CP4 - debe lanzar InternalServerErrorException si la agregación del miembro creador falla', async () => {
      // ARRANGE
      categoriaComunidadServiceMock.validarExistencia.mockResolvedValue(undefined);
      repoMock.verificarSiSlugEstaEnUso.mockResolvedValue(false);
      
      const mockComunidad = createMockComunidad({ activa: false });
      repoMock.crearComunidad.mockResolvedValue(mockComunidad);
      miembroServiceMock.agregarMiembro.mockRejectedValue(new Error('Fallo de base de datos'));

      // ACT & ASSERT
      await expect(
        service.crearComunidad(commandCrearValido, idCreadorValido)
      ).rejects.toThrow(InternalServerErrorException);

      expect(repoMock.crearComunidad).toHaveBeenCalledTimes(1);
      expect(miembroServiceMock.agregarMiembro).toHaveBeenCalledTimes(1);
    });
  });

  describe('getComunidades()', () => {
    it('CP5 - debe retornar la lista de comunidades activas cuando existen', async () => {
      // ARRANGE
      const mockList = [createMockComunidad(), createMockComunidad({ id_comunidad: 'comunidad-2', slug: 'comunidad-2' })];
      repoMock.buscarComunidadesActivas.mockResolvedValue(mockList);

      // ACT
      const resultado = await service.getComunidades();

      // ASSERT
      expect(repoMock.buscarComunidadesActivas).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(mockList);
    });

    it('CP6 - debe lanzar SinComunidadesActivasException cuando no hay comunidades activas', async () => {
      // ARRANGE
      repoMock.buscarComunidadesActivas.mockResolvedValue([]);

      // ACT & ASSERT
      await expect(service.getComunidades()).rejects.toThrow(SinComunidadesActivasException);
      expect(repoMock.buscarComunidadesActivas).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMisComunidades()', () => {
    it('CP6b - debe retornar comunidades del creador', async () => {
      // ARRANGE
      const mockList = [createMockComunidad()];
      repoMock.buscarComunidadesDelCreador.mockResolvedValue(mockList);

      // ACT
      const resultado = await service.getMisComunidades(idCreadorValido);

      // ASSERT
      expect(repoMock.buscarComunidadesDelCreador).toHaveBeenCalledWith(idCreadorValido);
      expect(resultado).toBe(mockList);
    });
  });

  describe('getComunidad()', () => {
    it('CP7 - debe retornar una comunidad por su ID', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);

      // ACT
      const resultado = await service.getComunidad('comunidad-uuid-555');

      // ASSERT
      expect(repoMock.buscarComunidadPorId).toHaveBeenCalledWith('comunidad-uuid-555');
      expect(resultado).toBe(mockComunidad);
    });

    it('CP8 - debe lanzar ComunidadNotFoundException si el ID no existe', async () => {
      // ARRANGE
      repoMock.buscarComunidadPorId.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.getComunidad('id-inexistente')).rejects.toThrow(ComunidadNotFoundException);
      expect(repoMock.buscarComunidadPorId).toHaveBeenCalledWith('id-inexistente');
    });
  });

  describe('getComunidadPorSlug()', () => {
    it('CP8b - debe retornar una comunidad por su slug', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorSlug.mockResolvedValue(mockComunidad);

      // ACT
      const resultado = await service.getComunidadPorSlug('comunidad-de-prueba');

      // ASSERT
      expect(repoMock.buscarComunidadPorSlug).toHaveBeenCalledWith('comunidad-de-prueba');
      expect(resultado).toBe(mockComunidad);
    });

    it('CP8c - debe lanzar ComunidadNotFoundException si el slug no existe', async () => {
      // ARRANGE
      repoMock.buscarComunidadPorSlug.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.getComunidadPorSlug('slug-inexistente')).rejects.toThrow(ComunidadNotFoundException);
      expect(repoMock.buscarComunidadPorSlug).toHaveBeenCalledWith('slug-inexistente');
    });
  });

  describe('actualizarComunidad()', () => {
    it('CP9 - debe actualizar la descripción y la portada sin validar la categoría ni cambiar el slug si el nombre no cambia', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      const commandUpdate: ActualizarComunidadCommand = {
        descripcion: 'Nueva descripción',
        portada_url: 'https://ejemplo.com/nueva-portada.jpg',
      };

      // ACT
      const resultado = await service.actualizarComunidad('comunidad-uuid-555', commandUpdate);

      // ASSERT
      expect(repoMock.buscarComunidadPorId).toHaveBeenCalledWith('comunidad-uuid-555');
      expect(categoriaComunidadServiceMock.validarExistencia).not.toHaveBeenCalled();
      expect(repoMock.verificarSiSlugEstaEnUso).not.toHaveBeenCalled();
      expect(repoMock.actualizarComunidad).toHaveBeenCalledWith(mockComunidad);
      expect(resultado.descripcion).toBe('Nueva descripción');
      expect(resultado.portada_url).toBe('https://ejemplo.com/nueva-portada.jpg');
      expect(resultado.slug).toBe('comunidad-de-prueba'); // Se mantiene igual
    });

    it('CP9b - debe validar la categoría si cambia el id_categoria_comunidad', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      categoriaComunidadServiceMock.validarExistencia.mockResolvedValue(undefined);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      const commandUpdate: ActualizarComunidadCommand = {
        id_categoria_comunidad: 'nueva-categoria-uuid',
      };

      // ACT
      await service.actualizarComunidad('comunidad-uuid-555', commandUpdate);

      // ASSERT
      expect(categoriaComunidadServiceMock.validarExistencia).toHaveBeenCalledWith('nueva-categoria-uuid');
      expect(repoMock.actualizarComunidad).toHaveBeenCalledTimes(1);
    });

    it('CP10 - debe generar un nuevo slug y validarlo si el nombre cambia', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.verificarSiSlugEstaEnUso.mockResolvedValue(false);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      const commandUpdate: ActualizarComunidadCommand = {
        nombre: 'Nuevo Nombre Comunidad',
      };

      // ACT
      const resultado = await service.actualizarComunidad('comunidad-uuid-555', commandUpdate);

      // ASSERT
      expect(repoMock.verificarSiSlugEstaEnUso).toHaveBeenCalledWith('nuevo-nombre-comunidad');
      expect(resultado.nombre).toBe('Nuevo Nombre Comunidad');
      expect(resultado.slug).toBe('nuevo-nombre-comunidad');
      expect(repoMock.actualizarComunidad).toHaveBeenCalledTimes(1);
    });
  });

  describe('desactivarComunidad()', () => {
    it('CP11 - debe desactivar una comunidad activa correctamente', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: true });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      // ACT
      await service.desactivarComunidad('comunidad-uuid-555');

      // ASSERT
      expect(repoMock.buscarComunidadPorId).toHaveBeenCalledWith('comunidad-uuid-555');
      expect(mockComunidad.activa).toBe(false);
      expect(repoMock.actualizarComunidad).toHaveBeenCalledWith(mockComunidad);
    });

    it('CP12 - debe lanzar ComunidadYaInactivaException si la comunidad ya está inactiva', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: false });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);

      // ACT & ASSERT
      await expect(service.desactivarComunidad('comunidad-uuid-555')).rejects.toThrow(
        ComunidadYaInactivaException
      );
      expect(repoMock.actualizarComunidad).not.toHaveBeenCalled();
    });
  });

  describe('reactivarComunidad()', () => {
    it('CP13 - debe reactivar una comunidad inactiva correctamente', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: false });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);
      repoMock.actualizarComunidad.mockResolvedValue(mockComunidad);

      // ACT
      await service.reactivarComunidad('comunidad-uuid-555');

      // ASSERT
      expect(repoMock.buscarComunidadPorId).toHaveBeenCalledWith('comunidad-uuid-555');
      expect(mockComunidad.activa).toBe(true);
      expect(repoMock.actualizarComunidad).toHaveBeenCalledWith(mockComunidad);
    });

    it('CP14 - debe lanzar ComunidadYaActivaException si la comunidad ya está activa', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad({ activa: true });
      repoMock.buscarComunidadPorId.mockResolvedValue(mockComunidad);

      // ACT & ASSERT
      await expect(service.reactivarComunidad('comunidad-uuid-555')).rejects.toThrow(
        ComunidadYaActivaException
      );
      expect(repoMock.actualizarComunidad).not.toHaveBeenCalled();
    });
  });

  describe('obtenerRolUsuarioEnComunidad()', () => {
    it('CP15 - debe retornar CREADOR si el usuario es creador de la comunidad', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorSlug.mockResolvedValue(mockComunidad);
      miembroServiceMock.buscarMiembro.mockResolvedValue({
        id_rol_comunidad: ROLES.CREADOR,
      } as any);

      // ACT
      const resultado = await service.obtenerRolUsuarioEnComunidad('usuario-uuid', 'comunidad-de-prueba');

      // ASSERT
      expect(repoMock.buscarComunidadPorSlug).toHaveBeenCalledWith('comunidad-de-prueba');
      expect(miembroServiceMock.buscarMiembro).toHaveBeenCalledWith('usuario-uuid', mockComunidad.id_comunidad);
      expect(resultado).toBe('CREADOR');
    });

    it('CP16 - debe retornar SUSCRIPTOR si el usuario es suscriptor de la comunidad', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorSlug.mockResolvedValue(mockComunidad);
      miembroServiceMock.buscarMiembro.mockResolvedValue({
        id_rol_comunidad: ROLES.SUSCRIPTOR,
      } as any);

      // ACT
      const resultado = await service.obtenerRolUsuarioEnComunidad('usuario-uuid', 'comunidad-de-prueba');

      // ASSERT
      expect(resultado).toBe('SUSCRIPTOR');
    });

    it('CP17 - debe retornar null si el usuario no es miembro de la comunidad', async () => {
      // ARRANGE
      const mockComunidad = createMockComunidad();
      repoMock.buscarComunidadPorSlug.mockResolvedValue(mockComunidad);
      miembroServiceMock.buscarMiembro.mockResolvedValue(null);

      // ACT
      const resultado = await service.obtenerRolUsuarioEnComunidad('usuario-uuid', 'comunidad-de-prueba');

      // ASSERT
      expect(resultado).toBeNull();
    });

    it('CP18 - debe retornar null si ocurre algún error (ej. comunidad no encontrada)', async () => {
      // ARRANGE
      repoMock.buscarComunidadPorSlug.mockRejectedValue(new ComunidadNotFoundException('slug'));

      // ACT
      const resultado = await service.obtenerRolUsuarioEnComunidad('usuario-uuid', 'comunidad-de-prueba');

      // ASSERT
      expect(resultado).toBeNull();
    });
  });
});
