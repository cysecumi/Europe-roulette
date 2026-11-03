import React from 'react';
import { Coins, X } from 'lucide-react';
import { formatCurrency } from '../utils/rouletteEngine';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (amount: number) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onAddFunds }) => {
  if (!isOpen) return null;

  const AMOUNTS = [500, 1000, 2500, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative text-center text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <Coins className="w-6 h-6 text-amber-400" />
        </div>

        <h3 className="text-xl font-bold font-serif-royal text-amber-300 mb-1">
          Kredit Meja Kasino
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Pilih jumlah saldo kredit tambahan untuk melanjutkan permainan Anda:
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {AMOUNTS.map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                onAddFunds(amount);
                onClose();
              }}
              className="py-3 px-3 rounded-xl font-mono font-bold text-sm bg-slate-800 hover:bg-amber-500/20 hover:border-amber-400/60 border border-slate-700 text-amber-300 transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-[10px] uppercase font-sans text-slate-400">Tambah</span>
              <span>+{formatCurrency(amount)}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  );
};
