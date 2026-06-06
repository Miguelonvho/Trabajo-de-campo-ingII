'use client';

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { crearSuscripcionAction, simularWebhookAction } from '../actions/suscripcionActions';
import { validateCheckoutForm } from '../utils/cardValidation';
import { MockCreditCard } from './MockCreditCard';
import { CheckoutSuccessScreen } from './CheckoutSuccessScreen';

interface CheckoutFormProps {
  planId: string;
  email: string;
  slug: string;
  planName: string;
  planPrice: number;
}

export function CheckoutForm({ planId, email, slug, planName, planPrice }: CheckoutFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-format card number: "XXXX XXXX XXXX XXXX"
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);

    // Group by 4 digits
    const matches = value.match(/.{1,4}/g);
    const formatted = matches ? matches.join(' ') : '';
    setCardNumber(formatted);
  };

  // Auto-format expiration: "MM/AA"
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateCheckoutForm(cardNumber, cardName, expiry, cvv);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setLoadingStep('Generando token de pago seguro...');

      // 1. Crear la suscripción (Fase 1: Intención en estado PENDIENTE)
      // Generamos un token dummy que comienza con mock_token_
      const mockToken = `mock_token_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

      const res = await crearSuscripcionAction({
        id_plan_comunidad: planId,
        token_tarjeta: mockToken,
        email,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Error al crear la suscripción');
      }

      const suscripcion = res.data;
      const mpSubId = suscripcion.mp_subscription_id;
      if (!mpSubId) {
        throw new Error('No se pudo generar el ID de suscripción de Mercado Pago');
      }

      // 2. Retardo artificial de 2 segundos para simular la carga y experiencia del usuario
      setLoadingStep('Procesando pago de forma segura...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Simulación de Webhook Directa
      setLoadingStep('Finalizando cobro y habilitando acceso...');
      const webhookRes = await simularWebhookAction(mpSubId);
      if (!webhookRes.success) {
        throw new Error(webhookRes.error || 'Error al procesar el webhook de cobro');
      }

      // 4. Éxito
      setSuccess(true);
    } catch (err: any) {
      console.error('Error durante el flujo de pago:', err);
      setError(err.message || 'Ocurrió un error inesperado al procesar el pago. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <CheckoutSuccessScreen planName={planName} planPrice={planPrice} slug={slug} />;
  }

  return (
    <div className="space-y-10">
      
      <MockCreditCard 
        cardNumber={cardNumber} 
        cardName={cardName} 
        expiry={expiry} 
        cvv={cvv} 
        isFlipped={isFlipped} 
      />

      {/* FORMULARIO DE PAGO */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3 text-sm font-medium animate-shake">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Email (Readonly) */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email del Pagador</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium text-base cursor-not-allowed outline-none"
            />
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Número de Tarjeta</label>
            <div className="relative">
              <input
                type="text"
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={handleCardNumberChange}
                required
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-medium text-base outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400"
              />
              <CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre del Titular</label>
            <input
              type="text"
              placeholder="Juan Pérez"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-medium text-base outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400 uppercase"
            />
          </div>

          {/* Expiry & CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Vencimiento</label>
              <input
                type="text"
                placeholder="MM/AA"
                value={expiry}
                onChange={handleExpiryChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-medium text-base outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400 text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CVV</label>
              <input
                type="password"
                placeholder="123"
                value={cvv}
                onChange={handleCvvChange}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-medium text-base outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400 text-center font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-8 py-4.5 bg-slate-950 text-white font-black rounded-2xl shadow-xl shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-900 transition-all text-base disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed duration-200"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>Pagar e Inscribirse</span>
            </>
          )}
        </button>

        {/* Security / Sim information */}
        <div className="flex items-center gap-2 justify-center text-xs text-slate-400 font-bold bg-slate-50 py-3 px-4 rounded-xl border border-slate-100">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Simulador Híbrido Mercado Pago activo</span>
        </div>
      </form>

      {/* DIÁLOGO/MODAL DE CARGA ARTIFICIAL */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-6 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner relative">
              <Loader2 size={32} className="animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-950">Procesando Cobro</h3>
              <p className="text-slate-500 font-medium text-sm">
                No cierres esta pestaña ni refresques la página.
              </p>
            </div>

            <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider animate-pulse">
              {loadingStep}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
