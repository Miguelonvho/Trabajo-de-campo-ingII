'use client';

import React, { useState} from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Tag, ArrowRight, Loader2, DollarSign, CheckCircle2 } from 'lucide-react';
import { crearPlan } from '../actions/planActions';
import { ICicloPago } from '@repo/types';

interface CreatePlanFormProps {
  idComunidad: string;
  slug: string;
  ciclos: ICicloPago[];
}

export function CreatePlanForm({ idComunidad, slug, ciclos }: CreatePlanFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{titulo?: string; precio?: string; descripcion?: string}>({});
  const [selectedCiclo, setSelectedCiclo] = useState<string>(
    ciclos.length > 0 ? ciclos[0].id_ciclo_pago : ''
  );

  const currentCiclo = ciclos.find(c => c.id_ciclo_pago === selectedCiclo);

  /**
   * Helper para traducir tipos de frecuencia a español amigable
   */
  const formatCiclo = (c: ICicloPago) => {
    const unit = c.tipo_frecuencia === 'months' ? (c.frecuencia === 1 ? 'Mes' : 'Meses') : (c.frecuencia === 1 ? 'Día' : 'Días');
    if (c.frecuencia === 1 && c.tipo_frecuencia === 'months') return 'Mensual (1 mes)';
    if (c.frecuencia === 3 && c.tipo_frecuencia === 'months') return 'Trimestral (3 meses)';
    if (c.frecuencia === 6 && c.tipo_frecuencia === 'months') return 'Semestral (6 meses)';
    if (c.frecuencia === 1 && c.tipo_frecuencia === 'days') return 'Diario (1 día)';
    return `${c.frecuencia} ${unit}`;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setFormErrors({});

    const formData = new FormData(event.currentTarget);
    
    // Validaciones del lado del cliente
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const precioRaw = formData.get('precio') as string;
    const precio = Number(precioRaw);
    const newErrors: {titulo?: string; precio?: string; descripcion?: string} = {};

    if (!titulo || !titulo.trim()) {
      newErrors.titulo = 'El título es un campo obligatorio';
    } else if (titulo.trim().length < 3) {
      newErrors.titulo = 'El título debe tener al menos 3 caracteres';
    } else if (titulo.length > 100) {
      newErrors.titulo = 'El título no puede superar los 100 caracteres';
    }

    if (!descripcion || !descripcion.trim()) {
      newErrors.descripcion = 'La descripción es un campo obligatorio';
    } else if (descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    } else if (descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede superar los 500 caracteres';
    }
    
    if (!precioRaw || isNaN(precio) || precio <= 0) {
      newErrors.precio = 'El precio debe ser mayor a cero';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setIsPending(false);
      return;
    }

    formData.append('id_comunidad', idComunidad);
    
    try {
      const result = await crearPlan(formData);
      if (result.success) {
        // Redirigir usando el SLUG de la comunidad, no el ID numérico
        router.push(`/comunidades/${slug}`);
      } else {
        setError(result.error || 'Error al crear el plan');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Tag size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">Detalles del Plan</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="titulo" className="text-sm font-bold text-slate-700 ml-1">
                Título del plan
              </label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                placeholder="Ej: Plan Premium Mensual"
                className={`w-full px-5 py-4 bg-slate-50 border ${formErrors.titulo ? 'border-red-400' : 'border-slate-200'} rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 placeholder:text-slate-400 font-medium`}
              />
              {formErrors.titulo && (
                <p className="text-red-500 text-xs font-bold mt-1 ml-1">{formErrors.titulo}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="descripcion" className="text-sm font-bold text-slate-700 ml-1">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                placeholder="¿Qué incluye este plan?"
                className={`w-full px-5 py-4 bg-slate-50 border ${formErrors.descripcion ? 'border-red-400' : 'border-slate-200'} rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 placeholder:text-slate-400 font-medium resize-none`}
              />
              {formErrors.descripcion && (
                <p className="text-red-500 text-xs font-bold mt-1 ml-1">{formErrors.descripcion}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <DollarSign size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">Precio y Recurrencia</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="precio" className="text-sm font-bold text-slate-700 ml-1">
                Precio
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input
                  id="precio"
                  name="precio"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-10 pr-5 py-4 bg-slate-50 border ${formErrors.precio ? 'border-red-400' : 'border-slate-200'} rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-emerald-500 font-black`}
                />
              </div>
              {formErrors.precio && (
                <p className="text-red-500 text-xs font-bold mt-1 ml-1">{formErrors.precio}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="moneda" className="text-sm font-bold text-slate-700 ml-1">
                Moneda
              </label>
              <div className="relative">
                <select
                  id="moneda"
                  name="moneda"
                  disabled
                  className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 outline-none font-bold appearance-none cursor-not-allowed"
                >
                  <option value="ARS">Peso Argentino (ARS)</option>
                </select>
                <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                <input type="hidden" name="moneda" value="ARS" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Solo pesos admitidos por Mercado Pago</p>
            </div>
          </div>

            <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="ciclo_id" className="text-sm font-bold text-slate-700 ml-1">
                Frecuencia del cobro
              </label>
              <div className="relative">
                <select
                  id="ciclo_id"
                  value={selectedCiclo}
                  onChange={(e) => setSelectedCiclo(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none transition-all focus:bg-white focus:border-emerald-500 font-bold appearance-none cursor-pointer"
                >
                  {ciclos.map(c => (
                    <option key={c.id_ciclo_pago} value={c.id_ciclo_pago}>
                      {formatCiclo(c)}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Inputs ocultos para mantener compatibilidad con el action sin cambiar el DTO */}
            <input type="hidden" name="frecuencia" value={currentCiclo?.frecuencia || 1} />
            <input type="hidden" name="tipo_frecuencia" value={currentCiclo?.tipo_frecuencia || 'months'} />
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
          className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Registrando en Mercado Pago...
            </>
          ) : (
            <>
              Crear Plan de Suscripción
              <ArrowRight size={20} />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
