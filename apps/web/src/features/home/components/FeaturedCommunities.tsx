import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { CommunityCard } from '@/features/comunidades/components/CommunityCard';
import { comunidadService } from '@/features/comunidades/services/comunidadService';
import { IComunidad } from '@repo/types';

export async function FeaturedCommunities() {
  // Obtener comunidades reales desde el servidor
  let comunidades: IComunidad[] = [];
  let errorMsg: string | null = null;
  try {
    comunidades = await comunidadService.getComunidades();
    // Tomar solo las primeras 3 para el home
    comunidades = comunidades.slice(0, 3);
  } catch (error: any) {
    if (error.message === 'Sin comunidades activas') {
      errorMsg = error.message;
    } else {
      console.error('Error cargando comunidades destacadas:', error);
    }
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-32 bg-slate-50 relative border-y border-slate-100">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-24 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold mb-8 shadow-sm uppercase tracking-widest">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            Comunidades Destacadas
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-black text-slate-950 tracking-tight mb-6">
            Comunidades de <span className="text-sky-600">Alto Impacto</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
            Seleccionamos ecosistemas con mentores activos y contenido exclusivo para acelerar tu crecimiento técnico.
          </p>
        </div>

        {comunidades.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {comunidades.map((community) => (
              <CommunityCard
                key={community.id_comunidad}
                community={community}
                href="/proximamente"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 font-extrabold text-slate-500">
            {errorMsg || 'Cargando comunidades destacadas...'}
          </div>
        )}

        <div className="text-center mt-24">
          <Link href="/explorar" className="btn-outline px-10 py-4 group border-slate-300">
            Explorar todo el ecosistema
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
