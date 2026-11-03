import React from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import { SpinResult } from '../types/roulette';
import { formatCurrency, getColor } from '../utils/rouletteEngine';

interface WinModalProps {
  isOpen: boolean;
  result: SpinResult | null;
  onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({ isOpen, result, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result || result.totalWon <= 0) return null;

  const color = result.color;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.3)] text-center relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>

        <h2 className="text-2xl font-extrabold font-serif-royal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wide mb-1">
          KEMENANGAN!
        </h2>
        <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-4 font-semibold">
          Roulette Royale Payout
        </p>

        {/* Winning Number Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/60 border border-white/10 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg text-white shadow-md ${
              color === 'green'
                ? 'bg-emerald-600 border border-emerald-400'
                : color === 'red'
                ? 'bg-red-600 border border-red-400'
                : 'bg-zinc-900 border border-zinc-700'
            }`}
          >
            {result.winningNumber}
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Angka Pemenang
            </span>
            <span className="text-sm font-bold text-slate-200 capitalize">
              {result.winningNumber === 0 ? 'Nol Hijau (Zero)' : `${result.winningNumber} ${color === 'red' ? 'Merah' : 'Hitam'}`}
            </span>
          </div>
        </div>

        {/* Amount Won */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4">
          <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider block mb-1">
            Total Pembayaran
          </span>
          <span className="text-3xl font-extrabold font-mono text-amber-400 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] tabular-nums">
            +{formatCurrency(result.totalWon)}
          </span>
          <span className="text-xs text-emerald-400 font-medium block mt-1">
            Laba Bersih: +{formatCurrency(result.netPayout)}
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-xl cursor-pointer transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          Lanjut Bermain
        </button>
      </div>
    </div>
  );
};
