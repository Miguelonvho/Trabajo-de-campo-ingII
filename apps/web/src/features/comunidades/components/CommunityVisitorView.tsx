import { Sparkles, CreditCard, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { IComunidad, IPlanComunidad } from '@repo/types';

interface Props {
  comunidad: IComunidad;
  planesComunidad: IPlanComunidad[];
  slug: string;
}

export function CommunityVisitorView({ comunidad, planesComunidad, slug }: Props) {
  const formatFrecuencia = (ciclo: IPlanComunidad['ciclo_pago']) => {
    if (!ciclo) return 'Mensual';
    const unidad = ciclo.tipo_frecuencia === 'months' ? 'meses' : 'días';
    if (ciclo.frecuencia === 1 && ciclo.tipo_frecuencia === 'months') return 'Mensual';
    if (ciclo.frecuencia === 12 && ciclo.tipo_frecuencia === 'months') return 'Anual';
    return `Cada ${ciclo.frecuencia} ${unidad}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navegación y Cabecera */}
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <Link 
              href="/comunidades" 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver al panel
            </Link>
          </div>

          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-10 items-center animate-fade-in">
            <div 
              className="w-32 h-32 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-inner ring-8 ring-slate-50 shrink-0"
              style={{ background: 'linear-gradient(135deg, #0f172a, #334155)' }}
            >
              {comunidad.nombre[0]}
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
                {comunidad.nombre}
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-2xl">
                {comunidad.descripcion || 'Sin descripción disponible.'}
              </p>
            </div>
          </div>
        </header>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Miembros</p>
              <p className="text-2xl font-black text-slate-900">0</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Planes</p>
              <p className="text-2xl font-black text-slate-900">{planesComunidad.length}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Estado</p>
              <p className="text-2xl font-black text-slate-900">{comunidad.activa ? 'Publicada' : 'Borrador'}</p>
            </div>
          </div>
        </div>

        {/* Sección de Planes */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Planes de Suscripción</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planesComunidad.map((plan: IPlanComunidad) => (
              <div key={plan.id_plan_comunidad} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    plan.activa 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {plan.activa ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-950">{plan.titulo}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2">
                    {plan.descripcion || 'Sin descripción'}
                  </p>
                  <div className="pt-4 flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-950">${Number(plan.precio).toFixed(0)}</span>
                    <span className="text-slate-400 text-sm font-bold mb-1">
                      / {formatFrecuencia(plan.ciclo_pago).toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 w-full">
                  {plan.activa ? (
                    <Link 
                      href={`/comunidades/${slug}/checkout/${plan.id_plan_comunidad}`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-600 text-white font-black rounded-2xl hover:bg-sky-500 hover:-translate-y-0.5 transition-all text-sm shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 duration-200"
                    >
                      <CreditCard size={18} />
                      Suscribirse al Plan
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-400 font-bold rounded-2xl text-sm cursor-not-allowed"
                    >
                      No disponible
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
