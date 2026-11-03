import React from 'react';
import { RotateCcw, Trash2, ArrowUpCircle, Play, History } from 'lucide-react';
import { formatCurrency } from '../utils/rouletteEngine';

interface ControlDockProps {
  totalBet: number;
  canUndo: boolean;
  canClear: boolean;
  canDouble: boolean;
  canRebet: boolean;
  isSpinning: boolean;
  onUndo: () => void;
  onClear: () => void;
  onDouble: () => void;
  onRebet: () => void;
  onSpin: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  totalBet,
  canUndo,
  canClear,
  canDouble,
  canRebet,
  isSpinning,
  onUndo,
  onClear,
  onDouble,
  onRebet,
  onSpin
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-md shadow-xl">
      {/* Bet summary display */}
      <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Taruhan Aktif
        </span>
        <span className="text-lg font-extrabold text-amber-400 font-mono tabular-nums">
          {formatCurrency(totalBet)}
        </span>
      </div>

      {/* Button controls */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Undo */}
        <button
          type="button"
          disabled={!canUndo || isSpinning}
          onClick={onUndo}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
          title="Batalkan taruhan terakhir [Shortcut: Z]"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Undo</span>
          <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">Z</kbd>
        </button>

        {/* Clear */}
        <button
          type="button"
          disabled={!canClear || isSpinning}
          onClick={onClear}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
          title="Hapus semua taruhan di meja [Shortcut: C]"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Clear</span>
          <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">C</kbd>
        </button>

        {/* Double (2x) */}
        <button
          type="button"
          disabled={!canDouble || isSpinning}
          onClick={onDouble}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
          title="Gandakan semua taruhan saat ini (2x) [Shortcut: D]"
        >
          <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>2x Double</span>
          <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">D</kbd>
        </button>

        {/* Rebet */}
        <button
          type="button"
          disabled={!canRebet || isSpinning}
          onClick={onRebet}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
          title="Ulangi taruhan putaran sebelumnya [Shortcut: R]"
        >
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span>Rebet</span>
          <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">R</kbd>
        </button>

        {/* SPIN Button */}
        <button
          type="button"
          disabled={totalBet === 0 || isSpinning}
          onClick={onSpin}
          title="Mulai putaran roulette [Shortcut: Space atau Enter]"
          className="w-full sm:w-auto flex-1 sm:flex-none min-w-[140px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:from-slate-700 disabled:to-slate-800 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_4px_16px_rgba(234,179,8,0.4)] active:scale-95"
        >
          {isSpinning ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>SPINNING...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>SPIN</span>
              <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-slate-950 bg-amber-300/90 px-1.5 py-0.2 rounded border border-amber-600/30">
                Space
              </kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
