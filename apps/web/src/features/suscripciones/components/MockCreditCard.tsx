import React from 'react';
import { getCardType } from '../utils/cardValidation';

interface MockCreditCardProps {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
  isFlipped: boolean;
}

export function MockCreditCard({ cardNumber, cardName, expiry, cvv, isFlipped }: MockCreditCardProps) {
  const cardType = getCardType(cardNumber);

  return (
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
            {cardType === 'Visa' && <span className="font-black italic text-xl">Visa</span>}
            {cardType === 'Mastercard' && <span className="font-black italic text-xl">Mastercard</span>}
            {cardType === 'Amex' && <span className="font-black italic text-xl">Amex</span>}
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
  );
}
