import React from 'react';
import { HistoryItem } from '../types/roulette';
import { BarChart3 } from 'lucide-react';

interface HistoryTrayProps {
  history: HistoryItem[];
  onOpenStats: () => void;
}

export const HistoryTray: React.FC<HistoryTrayProps> = ({ history, onOpenStats }) => {
  const displayHistory = history.slice(0, 12);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold shrink-0">
          Riwayat:
        </span>
        {displayHistory.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Belum ada putaran</span>
        ) : (
          displayHistory.map((item, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={`${item.number}-${item.timestamp}-${idx}`}
                className={`relative shrink-0 flex items-center justify-center w-7 h-7 rounded-full font-extrabold text-xs text-white shadow-md transition-all duration-300 ${
                  item.color === 'green'
                    ? 'bg-emerald-600 border border-emerald-400'
                    : item.color === 'red'
                    ? 'bg-red-600 border border-red-400'
                    : 'bg-zinc-900 border border-zinc-700'
                } ${isLatest ? 'ring-2 ring-amber-400 scale-110 shadow-[0_0_10px_rgba(234,179,8,0.6)]' : ''}`}
                title={`Angka ${item.number} (${item.color.toUpperCase()})`}
              >
                {item.number}
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={onOpenStats}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
        title="Lihat statistik putaran"
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Statistik</span>
      </button>
    </div>
  );
};
