import { comunidadService } from '@/features/comunidades/services/comunidadService';
import { planService } from '@/features/planes/services/planService';
import { authService } from '@/features/auth/services/authService';
import { CheckoutForm } from '@/features/suscripciones/components/CheckoutForm';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IComunidad, IPlanComunidad } from '@repo/types';

interface Props {
  params: Promise<{
    slug: string;
    planId: string;
  }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { slug, planId } = await params;

  let comunidad: IComunidad;
  let plan: IPlanComunidad;
  let userEmail = '';

  try {
    // 1. Obtener la comunidad por slug
    comunidad = await comunidadService.getComunidadBySlug(slug);
    
    // 2. Obtener el plan de suscripción por ID
    plan = await planService.getPlan(planId);

    // Validamos que el plan pertenezca a esta comunidad
    if (String(plan.id_comunidad) !== String(comunidad.id_comunidad)) {
      console.warn('El plan solicitado no corresponde a la comunidad especificada.');
      return notFound();
    }

    // 3. Obtener el perfil del usuario autenticado para extraer el email
    try {
      const perfil = await authService.getPerfil();
      userEmail = perfil.email || '';
    } catch (err) {
      console.error('Error cargando el perfil del usuario autenticado en checkout:', err);
      // Fallback por si la cookie no está o falló la API
      userEmail = 'invitado@komu.com';
    }
  } catch (error) {
    console.error('Error cargando los datos en la página de checkout:', error);
    return notFound();
  }

  const formatFrecuencia = (ciclo: IPlanComunidad['ciclo_pago']) => {
    if (!ciclo) return 'Mensual';
    const unidad = ciclo.tipo_frecuencia === 'months' ? 'meses' : 'días';
    if (ciclo.frecuencia === 1 && ciclo.tipo_frecuencia === 'months') return 'Mensual';
    if (ciclo.frecuencia === 12 && ciclo.tipo_frecuencia === 'months') return 'Anual';
    return `Cada ${ciclo.frecuencia} ${unidad}`;
  };

  const planPriceNumber = Number(plan.precio);

  return (
    <div className="min-h-screen bg-slate-50/50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera / Volver */}
        <header className="mb-10">
          <Link 
            href={`/comunidades/${slug}`} 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver a la comunidad
          </Link>
        </header>

        {/* CONTENEDOR DIVIDIDO (STRIPE STYLE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* DETALLES DE COMPRA (LADO IZQUIERDO) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-sky-50 border border-sky-100 text-sky-600 uppercase tracking-wider">
                <Sparkles size={12} className="fill-sky-500/20" />
                Tu Suscripción Premium
              </span>
              
              <h1 className="text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Sumate a <br />
                <span className="text-sky-600">{comunidad.nombre}</span>
              </h1>
              
              <p className="text-slate-500 text-base font-medium leading-relaxed">
                Adquirí acceso exclusivo a todo el contenido del creador, cursos premium, foro privado y sesiones en vivo para acelerar tu aprendizaje.
              </p>
            </div>

            {/* CARD RESUMEN DEL PLAN */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Seleccionado</p>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">{plan.titulo}</h3>
                <p className="text-slate-500 text-sm font-medium">
                  {plan.descripcion || 'Sin descripción adicional'}
                </p>
              </div>

              <div className="flex items-end gap-1.5 pt-4 border-t border-slate-50">
                <span className="text-4xl font-black text-slate-950">${planPriceNumber.toLocaleString('es-AR')}</span>
                <span className="text-slate-400 text-sm font-bold mb-1">
                  ARS / {formatFrecuencia(plan.ciclo_pago).toLowerCase()}
                </span>
              </div>

              {/* Beneficios */}
              <ul className="space-y-3 pt-6 border-t border-slate-50">
                <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                  <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                  <span>Acceso ilimitado a canales premium</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                  <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                  <span>Soporte prioritario del mentor</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                  <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                  <span>Cancelación flexible en cualquier momento</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FORMULARIO DE PAGO INTERACTIVO (LADO DERECHO) */}
          <div className="lg:col-span-7 bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Detalles de Facturación</h2>
              <p className="text-slate-500 text-sm font-medium">
                Completá los datos de tu tarjeta de prueba para simular el cobro.
              </p>
            </div>

            <CheckoutForm
              planId={planId}
              email={userEmail}
              slug={slug}
              planName={plan.titulo}
              planPrice={planPriceNumber}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
