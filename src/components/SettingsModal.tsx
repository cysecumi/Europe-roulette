import React, { useState } from 'react';
import {
  X,
  Settings,
  SlidersHorizontal,
  Coins,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  PlusCircle,
  Play
} from 'lucide-react';
import { formatCurrency } from '../utils/rouletteEngine';
import {
  getSoundEnabled,
  setSoundEnabled,
  getSoundVolume,
  setSoundVolume,
  playChipClick,
  playWinChime
} from '../utils/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  winRate: number;
  onWinRateChange: (rate: number) => void;
  balance: number;
  onAddFunds: (amount: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  winRate,
  onWinRateChange,
  balance,
  onAddFunds,
  soundOn,
  onToggleSound
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'winrate' | 'topup' | 'volume'>('all');
  const [customTopUp, setCustomTopUp] = useState<string>('');
  const [volume, setVolumeState] = useState<number>(() => Math.round(getSoundVolume() * 100));

  if (!isOpen) return null;

  const handleVolumeChange = (newVal: number) => {
    setVolumeState(newVal);
    setSoundVolume(newVal / 100);
    if (!soundOn && newVal > 0) {
      setSoundEnabled(true);
    }
  };

  const handleTestSound = () => {
    playChipClick();
    setTimeout(() => {
      playWinChime();
    }, 150);
  };

  const handleCustomTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customTopUp.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      onAddFunds(parsed);
      setCustomTopUp('');
      playWinChime();
    }
  };

  const getStatusInfo = (rate: number) => {
    if (rate === 0) {
      return {
        label: 'Tantangan Ekstrem',
        desc: 'House Selalu Menang (0% Kemenangan)',
        badgeColor: 'border-rose-500/50 text-rose-300 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
      };
    }
    if (rate < 50) {
      return {
        label: 'Tantangan Ketat',
        desc: 'Peluang kemenangan di bawah standar normal',
        badgeColor: 'border-slate-400/50 text-slate-300 bg-slate-900/60 shadow-[0_0_10px_rgba(148,163,184,0.3)]'
      };
    }
    if (rate === 50) {
      return {
        label: 'Seimbang Kasino',
        desc: 'Peluang standar kasino yang adil dan netral',
        badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
      };
    }
    if (rate < 100) {
      return {
        label: 'Keberuntungan Tinggi',
        desc: 'Peluang menang pemain ditingkatkan signifikan',
        badgeColor: 'border-purple-400/60 text-fuchsia-300 bg-purple-950/70 shadow-[0_0_15px_rgba(192,132,252,0.4)]'
      };
    }
    return {
      label: 'Jackpot Mutlak 100%',
      desc: 'Pasti menang di setiap putaran permainan!',
      badgeColor: 'border-amber-300 text-yellow-300 bg-gradient-to-r from-purple-950/80 via-amber-950/80 to-purple-950/80 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
    };
  };

  const status = getStatusInfo(winRate);

  const presets = [
    { label: '0%', val: 0, tag: 'Min' },
    { label: '25%', val: 25, tag: 'Hard' },
    { label: '50%', val: 50, tag: 'Normal' },
    { label: '75%', val: 75, tag: 'Lucky' },
    { label: '100%', val: 100, tag: 'Jackpot' }
  ];

  const topUpPresets = [500, 1000, 2500, 5000, 10000, 50000];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-zinc-950 via-black to-[#090812] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_40px_rgba(168,85,247,0.3)] relative text-slate-100 flex flex-col gap-5 ring-1 ring-purple-500/30"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-950 via-zinc-900 to-black border border-purple-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Settings className="w-5 h-5 text-amber-300 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 leading-tight">
                Pengaturan Kasino
              </h2>
              <p className="text-[11px] text-slate-400">
                Sesuaikan peluang kemenangan, isi saldo, dan atur volume suara
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-zinc-800 border border-slate-800 transition-colors cursor-pointer"
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters for Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-black/70 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-950/90 text-amber-300 border border-amber-400/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('winrate')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'winrate'
                ? 'bg-purple-950/90 text-amber-300 border border-amber-400/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Peluang</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topup')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'topup'
                ? 'bg-purple-950/90 text-amber-300 border border-amber-400/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Isi Saldo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('volume')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'volume'
                ? 'bg-purple-950/90 text-amber-300 border border-amber-400/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Volume</span>
          </button>
        </div>

        {/* Section 1: ATUR TINGKAT KEMENANGAN (WIN RATE) */}
        {(activeTab === 'all' || activeTab === 'winrate') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/25 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-200">
                    Tingkat Kemenangan (Win Rate)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Berlaku otomatis ke seluruh game meja, roda, dan minigame
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onWinRateChange(50)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-zinc-900 border border-slate-800 transition-all cursor-pointer"
                  title="Reset ke Standar (50%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 py-1 rounded-xl bg-black border border-amber-400/60 shadow-[0_0_12px_rgba(168,85,247,0.4)] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-sm sm:text-base font-black text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-purple-200 bg-clip-text">
                    {winRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1.5 pt-1">
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
                    background: `linear-gradient(to right, #9333ea 0%, #d946ef ${winRate}%, #27272a ${winRate}%, #27272a 100%)`
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 px-1">
                <span className="text-rose-400">0% (Pasti Kalah)</span>
                <span className="text-slate-300">25%</span>
                <span className="text-amber-300">50% (Normal)</span>
                <span className="text-purple-300">75%</span>
                <span className="text-yellow-300 font-extrabold flex items-center gap-0.5">
                  100% (Jackpot)
                </span>
              </div>
            </div>

            {/* Presets and status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
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
                          ? 'bg-purple-950/90 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.5)] ring-1 ring-purple-400/50'
                          : 'bg-zinc-900 text-slate-300 border border-slate-800 hover:border-purple-500/60 hover:text-white'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span
                        className={`text-[9px] font-normal px-1 py-0.2 rounded ${
                          isSelected ? 'text-fuchsia-300 bg-purple-900/60' : 'text-slate-500'
                        }`}
                      >
                        {p.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${status.badgeColor}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>{status.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: ISI SALDO (TOP-UP CREDIT) */}
        {(activeTab === 'all' || activeTab === 'topup') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/25 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-200">
                    Isi Saldo Kredit Kasino
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Tambah kredit instan untuk melanjutkan taruhan dan minigame
                  </span>
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-black border border-amber-400/40 text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Saldo</span>
                <span className="font-mono font-extrabold text-amber-400 text-xs sm:text-sm">
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>

            {/* Quick Top-Up Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
              {topUpPresets.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    onAddFunds(amt);
                    playWinChime();
                  }}
                  className="py-2 px-2 rounded-xl text-xs font-mono font-bold bg-zinc-900 border border-slate-800 hover:border-amber-400 hover:bg-amber-500/10 text-amber-300 transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-[9px] uppercase font-sans text-slate-400">+Kredit</span>
                  <span>+{amt >= 1000 ? `${amt / 1000}k` : amt}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <form onSubmit={handleCustomTopUp} className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Jumlah nominal custom..."
                  value={customTopUp}
                  onChange={e => setCustomTopUp(e.target.value)}
                  className="w-full py-2 pl-7 pr-3 rounded-xl bg-black border border-slate-700 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={!customTopUp || parseInt(customTopUp, 10) <= 0}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Isi</span>
              </button>
            </form>
          </div>
        )}

        {/* Section 3: MENGATUR VOLUME / SUARA */}
        {(activeTab === 'all' || activeTab === 'volume') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/25 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  {soundOn && volume > 0 ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-200">
                    Pengaturan Volume Suara
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Sesuaikan efek audio Web Audio API kasino
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    soundOn
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundOn ? 'Suara Aktif' : 'Mute'}</span>
                </button>
              </div>
            </div>

            {/* Volume Range Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[11px]">Tingkat Volume:</span>
                <span className="text-amber-400 font-bold">{soundOn ? `${volume}%` : '0% (Muted)'}</span>
              </div>
              <div className="relative flex items-center py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={soundOn ? volume : 0}
                  onChange={e => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-900 border border-slate-700/60 accent-amber-400 hover:accent-amber-300 transition-all"
                  style={{
                    background: `linear-gradient(to right, #eab308 0%, #f59e0b ${soundOn ? volume : 0}%, #27272a ${
                      soundOn ? volume : 0
                    }%, #27272a 100%)`
                  }}
                />
              </div>

              {/* Volume Presets & Test Sound */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1">
                  {[0, 25, 50, 75, 100].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleVolumeChange(v)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        volume === v && soundOn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                          : 'bg-zinc-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-zinc-900 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-400/50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Tes Suara</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info & close */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono">
            Royale Casino v2.5 · Black Gold Neon Theme
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
