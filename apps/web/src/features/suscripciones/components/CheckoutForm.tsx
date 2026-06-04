'use client';

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { crearSuscripcionAction, simularWebhookAction } from '../actions/suscripcionActions';
import Link from 'next/link';

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

    // Basic Validation
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Por favor, ingresá los 16 dígitos de la tarjeta');
      return;
    }
    if (!cardName.trim()) {
      setError('Por favor, ingresá el nombre del titular');
      return;
    }
    if (expiry.length < 5) {
      setError('Por favor, ingresá una fecha de expiración válida (MM/AA)');
      return;
    }
    if (cvv.length < 3) {
      setError('Por favor, ingresá el código de seguridad (CVV)');
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

  // Determinar la red de la tarjeta para mostrar logos visuales
  const getCardType = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'Mastercard';
    if (num.startsWith('3')) return 'Amex';
    return 'Generic';
  };

  if (success) {
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

  return (
    <div className="space-y-10">
      
      {/* MOCKUP INTERACTIVO DE TARJETA 3D */}
      <div className="perspective-1000 w-full max-w-[400px] mx-auto h-56 relative group">
        <div 
          className={`w-full h-full rounded-[24px] duration-700 preserve-3d relative shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRENTE DE LA TARJETA */}
          <div 
            className="absolute inset-0 backface-hidden rounded-[24px] p-6 text-white flex flex-col justify-between overflow-hidden shadow-inner"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%)',
            }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1500 transition-transform"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tarjeta de Simulación</p>
                <div className="h-8 w-11 bg-amber-400/20 backdrop-blur-md rounded-md mt-1.5 relative overflow-hidden border border-amber-400/30 flex items-center justify-center">
                  {/* Chip lines */}
                  <div className="w-full h-[1px] bg-amber-400/20 absolute top-1/2"></div>
                  <div className="w-full h-[1px] bg-amber-400/20 absolute top-1/3"></div>
                  <div className="w-full h-[1px] bg-amber-400/20 absolute bottom-1/3"></div>
                  <div className="h-full w-[1px] bg-amber-400/20 absolute left-1/2"></div>
                </div>
              </div>
              <span className="font-display font-black italic text-lg tracking-tight">KOMU</span>
            </div>

            <div className="space-y-4">
              {/* Número de Tarjeta */}
              <p className="text-xl md:text-2xl font-mono tracking-widest font-medium">
                {cardNumber || '•••• •••• •••• ••••'}
              </p>
              
              <div className="flex justify-between items-end">
                {/* Titular */}
                <div className="flex-1 mr-4">
                  <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Titular</p>
                  <p className="text-xs font-bold uppercase truncate tracking-wider">
                    {cardName || 'Nombre del Titular'}
                  </p>
                </div>
                
                {/* Vencimiento */}
                <div className="shrink-0 text-right">
                  <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Vence</p>
                  <p className="text-xs font-mono font-bold">{expiry || 'MM/AA'}</p>
                </div>
              </div>
            </div>

            {/* Red / Tipo de Tarjeta */}
            <div className="absolute right-6 top-6 opacity-85">
              {getCardType() === 'Visa' && <span className="font-black italic text-xl">Visa</span>}
              {getCardType() === 'Mastercard' && <span className="font-black italic text-xl">Mastercard</span>}
              {getCardType() === 'Amex' && <span className="font-black italic text-xl">Amex</span>}
            </div>
          </div>

          {/* DORSO DE LA TARJETA (CVV) */}
          <div 
            className="absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] py-6 text-white flex flex-col justify-between overflow-hidden shadow-inner"
            style={{
              background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
            }}
          >
            <div className="w-full h-11 bg-slate-950 mt-2"></div>
            
            <div className="px-6 space-y-4">
              <div className="flex items-center gap-4">
                {/* CVV Box */}
                <div className="flex-1 h-10 bg-white rounded-md flex items-center justify-end px-3 text-slate-900 font-mono font-bold tracking-widest text-sm">
                  {cvv || '•••'}
                </div>
                <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold w-24">
                  Código de Seguridad
                </div>
              </div>
              
              <p className="text-[8px] text-slate-500 font-medium leading-normal">
                Esta tarjeta se utiliza exclusivamente para la simulación del flujo de Mercado Pago en Komu. No posee valor comercial real ni está vinculada a cuentas bancarias reales.
              </p>
            </div>

            <div className="px-6 flex justify-between items-center">
              <span className="text-[8px] text-slate-500 font-black tracking-widest">MOCK CARD</span>
              <span className="font-display font-black italic text-xs tracking-tight text-slate-600">KOMU</span>
            </div>
          </div>
        </div>
      </div>

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
