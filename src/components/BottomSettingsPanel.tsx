/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SlidersHorizontal, Settings, ChevronDown, ChevronUp, Sparkles, RotateCcw, ShieldCheck, Zap } from 'lucide-react';

interface BottomSettingsPanelProps {
  winRate: number;
  onWinRateChange: (rate: number) => void;
}

export function BottomSettingsPanel({ winRate, onWinRateChange }: BottomSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Status helper based on win rate value
  const getStatusInfo = (rate: number) => {
    if (rate === 0) {
      return {
        label: 'Tantangan Ekstrem',
        desc: 'House Selalu Menang (0% Kemenangan)',
        badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      };
    }
    if (rate < 50) {
      return {
        label: 'Tantangan Ketat',
        desc: 'Peluang kemenangan di bawah standar normal',
        badgeColor: 'border-slate-400/50 text-slate-300 bg-slate-900/60 shadow-[0_0_10px_rgba(148,163,184,0.3)]',
      };
    }
    if (rate === 50) {
      return {
        label: 'Seimbang Kasino',
        desc: 'Peluang standar kasino yang adil dan netral',
        badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
      };
    }
    if (rate < 100) {
      return {
        label: 'Keberuntungan Tinggi',
        desc: 'Peluang menang pemain ditingkatkan signifikan',
        badgeColor: 'border-purple-400/60 text-fuchsia-300 bg-purple-950/70 shadow-[0_0_15px_rgba(192,132,252,0.4)]',
      };
    }
    return {
      label: 'Jackpot Mutlak 100%',
      desc: 'Pasti menang di setiap putaran permainan!',
      badgeColor: 'border-amber-300 text-yellow-300 bg-gradient-to-r from-purple-950/80 via-amber-950/80 to-purple-950/80 shadow-[0_0_20px_rgba(251,191,36,0.5)]',
    };
  };

  const status = getStatusInfo(winRate);

  const presets = [
    { label: '0%', val: 0, tag: 'Min' },
    { label: '25%', val: 25, tag: 'Hard' },
    { label: '50%', val: 50, tag: 'Normal' },
    { label: '75%', val: 75, tag: 'Lucky' },
    { label: '100%', val: 100, tag: 'Jackpot' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-3xl pointer-events-auto transition-all duration-300">
      {/* Outer Shell: Deep Black + Silver Edge + Neon Purple Glow + Gold Accents */}
      <div className="relative rounded-2xl bg-black/95 backdrop-blur-xl border border-slate-400/30 shadow-[0_0_30px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/40 overflow-hidden">
        
        {/* Top Metallic Trim: Silver & Neon Purple Gradient Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500 via-amber-400 to-transparent opacity-80" />

        {/* Collapsed Bar State */}
        {!isExpanded ? (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-black via-zinc-950 to-black">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                <Settings className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-slate-200">
                  Pengaturan Kasino
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">|</span>
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <span>Win Rate:</span>
                  <span className="font-mono font-bold text-fuchsia-300">{winRate}%</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeColor}`}>
                {status.label}
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-amber-300 bg-zinc-900 border border-amber-400/40 hover:border-purple-400 hover:text-white transition-all shadow-[0_0_10px_rgba(251,191,36,0.2)] cursor-pointer"
              >
                <span>Buka Pengaturan</span>
                <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Full Settings Panel */
          <div className="p-3.5 sm:p-4 bg-gradient-to-b from-zinc-950 via-black to-[#090812]">
            {/* Header: Title, Real-Time Indicator & Controls */}
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-950 via-zinc-900 to-black border border-purple-500/70 flex items-center justify-center text-amber-400 shadow-[0_0_16px_rgba(168,85,247,0.5)]">
                  <SlidersHorizontal className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-slate-100 to-amber-300 bg-clip-text text-transparent">
                      Pengaturan Kasino
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-purple-900/60 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                      Real-Time
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Sesuaikan persentase peluang kemenangan (0% - 100%) untuk seluruh permainan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => onWinRateChange(50)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-zinc-800 border border-slate-700/50 transition-all cursor-pointer"
                  title="Reset ke Standar (50%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Minimize button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-zinc-900 border border-slate-700/60 hover:border-purple-500/50 transition-all cursor-pointer"
                  title="Sembunyikan Pengaturan"
                >
                  <span className="text-[11px]">Tutup</span>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Slider & Presets Row */}
            <div className="space-y-3">
              {/* Slider Control */}
              <div className="bg-black/60 rounded-xl p-3 border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Peluang Kemenangan (Win Rate)
                    </span>
                  </div>

                  {/* Prominent Win Rate Badge: Black, Gold, Silver, Neon Purple */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      {status.desc}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black border border-amber-400/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-sm sm:text-base font-black text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-purple-200 bg-clip-text">
                        {winRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Range Slider Track */}
                <div className="relative flex items-center py-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={winRate}
                    onChange={e => onWinRateChange(Number(e.target.value))}
                    className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-zinc-900 border border-slate-700/60 accent-fuchsia-500 hover:accent-fuchsia-400 transition-all"
                    style={{
                      background: `linear-gradient(to right, #9333ea 0%, #d946ef ${winRate}%, #27272a ${winRate}%, #27272a 100%)`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 px-1 mt-1">
                  <span className="text-rose-400">0% (Pasti Kalah)</span>
                  <span className="text-slate-300">25%</span>
                  <span className="text-amber-300">50% (Normal)</span>
                  <span className="text-purple-300">75%</span>
                  <span className="text-yellow-300 font-extrabold text-[11px] flex items-center gap-0.5">
                    100% (Pasti Menang)
                  </span>
                </div>
              </div>

              {/* Quick Presets & Status Footnote */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Presets buttons styled in Black, Gold, Silver, Neon Purple */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                    Preset:
                  </span>
                  {presets.map(p => {
                    const isSelected = winRate === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => onWinRateChange(p.val)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/80 text-amber-300 border border-amber-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-1 ring-purple-400/50'
                            : 'bg-zinc-900/90 text-slate-300 border border-slate-700/70 hover:border-purple-500/60 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <span>{p.label}</span>
                        <span className={`text-[9px] font-normal px-1 py-0.2 rounded ${isSelected ? 'text-fuchsia-300 bg-purple-900/60' : 'text-slate-400'}`}>
                          {p.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Status Indicator Tag */}
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${status.badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{status.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
