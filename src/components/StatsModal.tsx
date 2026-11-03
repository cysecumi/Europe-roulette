import React from 'react';
import { X, Flame, Snowflake, Trophy, RefreshCw } from 'lucide-react';
import { HistoryItem } from '../types/roulette';
import { computeStats, formatCurrency } from '../utils/rouletteEngine';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  totalSpins: number;
  totalWagered: number;
  highestWin: number;
  onResetStats?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  history,
  totalSpins,
  totalWagered,
  highestWin,
  onResetStats
}) => {
  if (!isOpen) return null;

  const stats = computeStats(history);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-400 font-bold">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-royal text-amber-200">
                Statistik Putaran Meja
              </h2>
              <p className="text-xs text-slate-400">
                Berdasarkan {totalSpins} putaran dalam sesi ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 py-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Total Putaran
              </span>
              <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                {totalSpins}
              </span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Total Taruhan
              </span>
              <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                {formatCurrency(totalWagered)}
              </span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Kemenangan Tertinggi
              </span>
              <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {formatCurrency(highestWin)}
              </span>
            </div>
          </div>

          {/* Color Distribution */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-medium">
              <span>Distribusi Warna</span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-red-400 font-bold">Merah: {stats.redPct}%</span>
                <span className="text-slate-300 font-bold">Hitam: {stats.blackPct}%</span>
                <span className="text-emerald-400 font-bold">Nol: {stats.greenPct}%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${stats.redPct}%` }}
                className="h-full bg-red-600 transition-all duration-300"
              />
              <div
                style={{ width: `${stats.blackPct}%` }}
                className="h-full bg-zinc-900 transition-all duration-300"
              />
              <div
                style={{ width: `${stats.greenPct}%` }}
                className="h-full bg-emerald-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Even vs Odd */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-medium">
              <span>Genap vs Ganjil (Kecuali 0)</span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-amber-300 font-bold">Genap: {stats.evenPct}%</span>
                <span className="text-amber-100 font-bold">Ganjil: {stats.oddPct}%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${stats.evenPct}%` }}
                className="h-full bg-amber-500 transition-all duration-300"
              />
              <div
                style={{ width: `${stats.oddPct}%` }}
                className="h-full bg-amber-800 transition-all duration-300"
              />
            </div>
          </div>

          {/* Hot & Cold Numbers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Hot */}
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-2">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Angka Panas (Hot)</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.hotNumbers.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Menunggu data putaran...</span>
                ) : (
                  stats.hotNumbers.map(item => (
                    <div
                      key={item.num}
                      className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-red-700 text-white font-bold text-xs shadow"
                      title={`Muncul ${item.count} kali`}
                    >
                      <span>{item.num}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cold */}
            <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-2">
                <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                <span>Angka Dingin (Cold)</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.coldNumbers.slice(0, 5).map(item => (
                  <div
                    key={item.num}
                    className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs"
                    title={`Muncul ${item.count} kali`}
                  >
                    <span>{item.num}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          {onResetStats ? (
            <button
              type="button"
              onClick={onResetStats}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Statistik</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
