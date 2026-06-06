import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface CheckoutSuccessScreenProps {
  planName: string;
  planPrice: number;
  slug: string;
}

export function CheckoutSuccessScreen({ planName, planPrice, slug }: CheckoutSuccessScreenProps) {
  return (
    <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center space-y-6 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner ring-8 ring-emerald-50/50 animate-bounce">
        <CheckCircle2 size={44} className="stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-950 tracking-tight">¡Suscripción Activada!</h2>
        <p className="text-slate-500 font-medium max-w-md">
          Tu pago por el plan <span className="text-slate-900 font-bold">{planName}</span> se procesó y aprobó con éxito mediante la simulación de Mercado Pago.
        </p>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl w-full text-left space-y-3 border border-slate-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 font-bold">Concepto:</span>
          <span className="text-slate-900 font-bold">{planName}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 font-bold">Monto Cobrado:</span>
          <span className="text-slate-900 font-black">${planPrice.toLocaleString('es-AR')} ARS</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 font-bold">Estado:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVA
          </span>
        </div>
      </div>

      <Link
        href={`/comunidades/${slug}`}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-slate-950 text-white font-black rounded-2xl shadow-xl shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-900 transition-all text-base group"
      >
        Ingresar a la Comunidad
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
