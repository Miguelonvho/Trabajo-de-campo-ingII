'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PowerOff, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { deactivateComunidadAction, activateComunidadAction } from '../actions/comunidadActions';
import { useRouter } from 'next/navigation';

interface DeactivateCommunityButtonProps {
  idComunidad: string;
  isActive: boolean;
}

export function DeactivateCommunityButton({ idComunidad, isActive }: DeactivateCommunityButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      let result;
      if (isActive) {
        result = await deactivateComunidadAction(idComunidad);
      } else {
        result = await activateComunidadAction(idComunidad);
      }

      if (result.success) {
        router.refresh();
        setShowModal(false);
      } else {
        alert(result.error);
      }
    } catch {
      alert('Error de conectividad al cambiar el estado.');
    } finally {
      setIsPending(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {isActive ? '¿Confirmar baja de la comunidad?' : '¿Confirmar alta de la comunidad?'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {isActive 
                ? 'La comunidad se desactivará y dejará de ser visible públicamente para los usuarios.'
                : 'La comunidad se reactivará y volverá a ser visible públicamente para los usuarios.'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            disabled={isPending}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`px-5 py-2.5 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 ${
              isActive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
            }`}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isActive ? 'Confirmar Baja' : 'Confirmar Alta'}
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
        className={isActive 
          ? "flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 font-black rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all text-sm shadow-sm disabled:opacity-70"
          : "flex items-center gap-2 px-6 py-3 bg-white border border-emerald-200 text-emerald-600 font-black rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all text-sm shadow-sm disabled:opacity-70"
        }
      >
        {isPending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isActive ? (
          <PowerOff size={18} />
        ) : (
          <CheckCircle size={18} />
        )}
        {isActive ? 'Dar de baja' : 'Dar de alta'}
      </button>

      {showModal && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
