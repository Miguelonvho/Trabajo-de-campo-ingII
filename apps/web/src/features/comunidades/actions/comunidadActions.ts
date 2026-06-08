'use server';

import { revalidatePath } from 'next/cache';
import { comunidadService } from '../services/comunidadService';
import { uploadFileToStorage } from '@/shared/utils/storage';
import { ICreateCommunityRequest, IUpdateCommunityRequest } from '@repo/types';


export async function crearComunidad(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const descripcion = formData.get('descripcion') as string;
  const id_categoria_comunidad = formData.get('id_categoria_comunidad') as string;
  const portadaFile = formData.get('portada_url') as File | null;

  if (!nombre || !id_categoria_comunidad) {
    throw new Error('Faltan campos obligatorios');
  }

  // Validar archivo de portada si existe
  if (portadaFile && portadaFile.size > 0) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = portadaFile.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(portadaFile.type) || !extension || !allowedExtensions.includes(extension)) {
      return { success: false, error: 'El formato de la portada debe ser JPEG, PNG o WEBP' };
    }

    if (portadaFile.size > 2 * 1024 * 1024) {
      return { success: false, error: 'El tamaño de la imagen de portada no puede superar los 2MB' };
    }
  }

  const dto: ICreateCommunityRequest = {
    nombre,
    descripcion,
    id_categoria_comunidad,
  };

  try {
    // 1. Crear la comunidad base
    const comunidad = await comunidadService.crearComunidad(dto);
    
    // 2. Si hay imagen de portada, subirla a Supabase y actualizar la comunidad
    if (portadaFile && portadaFile.size > 0) {
      try {
        const path = `portadas/${comunidad.id_comunidad}/portada.jpg`;
        const publicUrl = await uploadFileToStorage(portadaFile, 'comunidades', path);
        
        await comunidadService.actualizarComunidad(comunidad.id_comunidad, {
          portada_url: publicUrl,
        });
      } catch (uploadError) {
        console.error('Error al subir la imagen de portada:', uploadError);
        // Opcional: Podríamos retornar un warning indicando que se creó pero falló la imagen,
        // pero vamos a continuar el flujo para no perder la comunidad ya creada.
      }
    }

    // Revalidamos las rutas de comunidades
    revalidatePath('/comunidades', 'layout');
    revalidatePath('/explorar');

    // Redirigimos al panel de la nueva comunidad
    return { success: true, id: comunidad.id_comunidad, slug: comunidad.slug };
  } catch (error) {
    console.error('Error al crear comunidad:', error);
    const mensajeError = error instanceof Error ? error.message : 'Ocurrió un error al crear la comunidad';
    return { success: false, error: mensajeError };
  }
}

export async function updateComunidadAction(id_comunidad: string, formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const descripcion = formData.get('descripcion') as string;
  const id_categoria_comunidad = formData.get('id_categoria_comunidad') ? formData.get('id_categoria_comunidad') as string : undefined;
  const portadaFile = formData.get('portada_url') as File | null;

  // Validar archivo de portada si existe
  if (portadaFile && portadaFile.size > 0) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = portadaFile.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(portadaFile.type) || !extension || !allowedExtensions.includes(extension)) {
      return { success: false, error: 'El formato de la portada debe ser JPEG, PNG o WEBP' };
    }

    if (portadaFile.size > 2 * 1024 * 1024) {
      return { success: false, error: 'El tamaño de la imagen de portada no puede superar los 2MB' };
    }
  }

  const dto: IUpdateCommunityRequest = {};
  if (nombre) dto.nombre = nombre;
  if (descripcion) dto.descripcion = descripcion;
  if (id_categoria_comunidad) dto.id_categoria_comunidad = id_categoria_comunidad;

  try {
    // 1. Subir la portada si hay una nueva
    if (portadaFile && portadaFile.size > 0) {
      try {
        const path = `portadas/${id_comunidad}/portada.jpg`;
        const publicUrl = await uploadFileToStorage(portadaFile, 'comunidades', path);
        // Supabase y los navegadores cachean fuertemente la misma URL de imagen.
        // Agregamos un timestamp para forzar que el cliente descargue la nueva versión.
        dto.portada_url = `${publicUrl}?t=${Date.now()}`;
      } catch (uploadError) {
        console.error('Error al subir la imagen de portada:', uploadError);
        return { success: false, error: 'Error al subir la imagen de portada' };
      }
    }

    // 2. Actualizar comunidad
    let updatedSlug = '';
    if (Object.keys(dto).length > 0) {
      const updatedComunidad = await comunidadService.actualizarComunidad(id_comunidad, dto);
      updatedSlug = updatedComunidad.slug;
    }

    // Revalidar
    revalidatePath('/comunidades', 'layout');
    revalidatePath('/explorar');

    return { success: true, slug: updatedSlug };
  } catch (error) {
    console.error('Error al actualizar comunidad:', error);
    const mensajeError = error instanceof Error ? error.message : 'Ocurrió un error al actualizar la comunidad';
    return { success: false, error: mensajeError };
  }
}

export async function deactivateComunidadAction(id_comunidad: string) {
  try {
    await comunidadService.desactivarComunidad(id_comunidad);
    
    revalidatePath('/comunidades', 'layout');
    revalidatePath('/explorar');

    return { success: true };
  } catch (error) {
    console.error('Error al desactivar comunidad:', error);
    return { success: false, error: 'Error al desactivar la comunidad' };
  }
}

export async function activateComunidadAction(id_comunidad: string) {
  try {
    await comunidadService.reactivarComunidad(id_comunidad);
    
    revalidatePath('/comunidades', 'layout');
    revalidatePath('/explorar');

    return { success: true };
  } catch (error) {
    console.error('Error al reactivar comunidad:', error);
    return { success: false, error: 'Error al reactivar la comunidad' };
  }
}
