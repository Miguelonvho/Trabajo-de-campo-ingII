'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Layout, Type, ArrowRight, Loader2 } from 'lucide-react';
import { crearComunidad } from '../actions/comunidadActions';
import { ICategoriaComunidad } from '@repo/types';

interface CreateCommunityFormProps {
  categorias: ICategoriaComunidad[];
}

// Mapeador de iconos decorativos según el nombre de la categoría
const getCategoryIcon = (nombre: string) => {
  const n = nombre.toLowerCase();
  if (n.includes('progra')) return '💻';
  if (n.includes('diseñ')) return '🎨';
  if (n.includes('marke')) return '📈';
  if (n.includes('nego')) return '💼';
  if (n.includes('ia') || n.includes('intel')) return '🤖';
  return '🌟';
};

export function CreateCommunityForm({ categorias }: CreateCommunityFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await crearComunidad(formData);
      if (result.success && result.slug) {
        router.push(`/comunidades/${result.slug}`);
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Sección: Información Básica */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Type size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">Información básica</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-bold text-slate-700 ml-1">
                Nombre de la comunidad
              </label>
              <input
                required
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Ej: React Masterminds"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="descripcion" className="text-sm font-bold text-slate-700 ml-1">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                placeholder="¿De qué trata tu comunidad? Contale a tus futuros miembros qué van a aprender..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400 font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sección: Categoría y Visual */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layout size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">Categoría y Estilo</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Elegí una categoría
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categorias.map((cat) => (
                  <label key={cat.id_categoria_comunidad} className="relative cursor-pointer group" title={cat.descripcion}>
                    <input
                      type="radio"
                      name="id_categoria_comunidad"
                      value={cat.id_categoria_comunidad}
                      required
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 bg-slate-50 transition-all peer-checked:border-sky-500 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-500/20 group-hover:bg-white group-hover:border-slate-300">
                      <span className="text-2xl">{getCategoryIcon(cat.descripcion)}</span>
                      <span className="text-[10px] font-black text-slate-600 peer-checked:text-sky-600 text-center line-clamp-1">
                        {cat.descripcion}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="portada_url" className="text-sm font-bold text-slate-700 ml-1">
                URL de imagen de portada (opcional)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
                  <ImageIcon size={18} />
                </div>
                <input
                  id="portada_url"
                  name="portada_url"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 font-medium file:cursor-pointer file:bg-sky-50 file:text-sky-700 file:font-bold file:border-0 file:rounded-xl file:px-4 file:py-2 file:mr-4 hover:file:bg-sky-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
                      const extension = file.name.split('.').pop()?.toLowerCase();

                      if (!allowedTypes.includes(file.type) || !extension || !allowedExtensions.includes(extension)) {
                        setError('El formato del archivo no es válido. Solo se permiten imágenes (JPEG, PNG, WEBP)');
                        e.target.value = '';
                        return;
                      }

                      if (file.size > 2 * 1024 * 1024) {
                        setError('El tamaño de la imagen no puede superar los 2MB');
                        e.target.value = '';
                        return;
                      }

                      setError(null);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Creando comunidad...
            </>
          ) : (
            <>
              Crear Comunidad
              <ArrowRight size={20} />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
