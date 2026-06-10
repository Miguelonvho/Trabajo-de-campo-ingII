'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, AlertTriangle, XOctagon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSuscripcionActivaAction, cancelarSuscripcionAction } from '../../suscripciones/actions/suscripcionActions';

interface CancelSubscriptionButtonProps {
  idComunidad: string;
  slug: string;
}

export function CancelSubscriptionButton({ idComunidad, slug }: CancelSubscriptionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [idSuscripcion, setIdSuscripcion] = useState<string | null>(null);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Cargar la suscripción activa al montar
    async function loadSuscripcion() {
      try {
        const result = await getSuscripcionActivaAction(idComunidad);
        if (result.success && result.data) {
          setIdSuscripcion(result.data.id_suscripcion);
        }
      } catch (err) {
        console.error('Error al cargar la suscripción activa:', err);
      } finally {
        setLoadingSuscripcion(false);
      }
    }

    loadSuscripcion();
    
    return () => setMounted(false);
  }, [idComunidad]);

  const handleCancel = async () => {
    if (!idSuscripcion) return;
    setIsPending(true);
    try {
      const result = await cancelarSuscripcionAction(idSuscripcion, slug);

      if (result.success) {
        setShowModal(false);
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch {
      alert('Error de conectividad al cancelar la suscripción.');
    } finally {
      setIsPending(false);
    }
  };

  if (loadingSuscripcion || !idSuscripcion) {
    // Si no cargó la suscripción activa o no tiene una activa, no mostramos el botón
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl shrink-0 bg-rose-50 text-rose-600">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              ¿Confirmar cancelación de la suscripción?
            </h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              Al confirmar esta acción, perderás de inmediato el acceso a las aulas y contenidos exclusivos de esta comunidad. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            disabled={isPending}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm border border-slate-200 transition-all disabled:opacity-50"
          >
            Volver atrás
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all shadow-sm shadow-rose-100 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-rose-200 text-rose-600 font-black rounded-xl hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-all text-sm shadow-sm disabled:opacity-70 shrink-0"
      >
        {isPending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <XOctagon size={18} />
        )}
        Cancelar Suscripción
      </button>

      {showModal && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
