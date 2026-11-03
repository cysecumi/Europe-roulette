import React from 'react';
import { ChipValue } from '../types/roulette';
import { playChipClick } from '../utils/soundEngine';
import { Flame } from 'lucide-react';

interface ChipRackProps {
  selectedChip: ChipValue | number;
  onSelectChip: (value: number) => void;
  balance?: number;
  showToast?: (msg: string, icon?: string) => void;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const CHIP_CONFIGS: { value: ChipValue; label: string; bgStyle: string; borderStyle: string; textColor: string }[] = [
  {
    value: 5,
    label: '5',
    bgStyle: 'bg-radial from-red-500 to-red-800',
    borderStyle: 'border-red-300/80',
    textColor: 'text-white'
  },
  {
    value: 10,
    label: '10',
    bgStyle: 'bg-radial from-blue-500 to-blue-800',
    borderStyle: 'border-blue-300/80',
    textColor: 'text-white'
  },
  {
    value: 25,
    label: '25',
    bgStyle: 'bg-radial from-emerald-500 to-emerald-800',
    borderStyle: 'border-emerald-300/80',
    textColor: 'text-white'
  },
  {
    value: 50,
    label: '50',
    bgStyle: 'bg-radial from-purple-500 to-purple-800',
    borderStyle: 'border-purple-300/80',
    textColor: 'text-white'
  },
  {
    value: 100,
    label: '100',
    bgStyle: 'bg-radial from-slate-800 via-slate-900 to-black',
    borderStyle: 'border-amber-400/90',
    textColor: 'text-amber-300'
  },
  {
    value: 500,
    label: '500',
    bgStyle: 'bg-radial from-amber-400 via-amber-600 to-amber-900',
    borderStyle: 'border-amber-200',
    textColor: 'text-amber-950'
  }
];

export const ChipRack: React.FC<ChipRackProps> = ({
  selectedChip,
  onSelectChip,
  balance,
  showToast,
  disabled = false,
  orientation = 'horizontal'
}) => {
  const isAllInSelected = balance !== undefined && selectedChip === balance && balance > 0;

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-black/80 border border-amber-500/30 backdrop-blur-md shadow-2xl">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Chip Selector
        </span>
        <div className="flex flex-col items-center gap-2">
          {CHIP_CONFIGS.map((chip, idx) => {
            const isSelected = selectedChip === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  playChipClick();
                  onSelectChip(chip.value);
                }}
                title={`Pilih chip $${chip.value} [Shortcut: Shift+${idx + 1}]`}
                className={`relative group flex items-center justify-center w-13 h-13 rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  chip.bgStyle
                } ${
                  isSelected
                    ? 'scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.7),0_0_16px_rgba(234,179,8,0.6)] ring-3 ring-amber-400'
                    : 'hover:scale-105 hover:shadow-lg shadow-[0_4px_10px_rgba(0,0,0,0.5)]'
                }`}
              >
                <div
                  className={`absolute inset-1 rounded-full border-2 border-dashed ${chip.borderStyle} pointer-events-none opacity-85`}
                />
                <div className="w-7 h-7 rounded-full bg-black/25 flex items-center justify-center backdrop-blur-[1px]">
                  <span className={`text-xs font-extrabold tracking-tighter ${chip.textColor}`}>
                    {chip.label}
                  </span>
                </div>
              </button>
            );
          })}

          {/* ALL IN VERTICAL */}
          {balance !== undefined && (
            <button
              type="button"
              disabled={disabled || balance <= 0}
              onClick={() => {
                playChipClick();
                if (balance <= 0) {
                  showToast?.('Saldo habis, tidak dapat All In!', '💳');
                  return;
                }
                onSelectChip(balance);
                showToast?.(`ALL IN! Chip diset ke $${balance.toLocaleString()}`, '🔥');
              }}
              title={`Bertaruh seluruh saldo ($${balance.toLocaleString()}) [Shortcut: A]`}
              className={`relative group flex flex-col items-center justify-center w-13 h-13 rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-radial from-purple-950 via-black to-slate-950 border-2 ${
                isAllInSelected
                  ? 'scale-110 ring-3 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.9),0_0_12px_rgba(234,179,8,0.7)] border-amber-400'
                  : 'border-amber-500/70 hover:border-amber-400 hover:scale-105 shadow-[0_4px_12px_rgba(0,0,0,0.6),0_0_10px_rgba(168,85,247,0.4)]'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-[9px] font-extrabold uppercase tracking-tighter text-amber-300">
                ALL
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-black/60 border border-amber-500/25 backdrop-blur-md shadow-xl">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
        Chip:
      </span>
      <div className="flex items-center gap-2 sm:gap-2.5">
        {CHIP_CONFIGS.map((chip, idx) => {
          const isSelected = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                playChipClick();
                onSelectChip(chip.value);
              }}
              title={`Pilih chip $${chip.value} [Shortcut: Shift+${idx + 1}]`}
              className={`relative group flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                chip.bgStyle
              } ${
                isSelected
                  ? '-translate-y-2 scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.7),0_0_16px_rgba(234,179,8,0.5)] ring-3 ring-amber-400'
                  : 'hover:-translate-y-1 hover:shadow-lg shadow-[0_4px_10px_rgba(0,0,0,0.5)]'
              }`}
            >
              {/* Dashed outer casino chip edge notches */}
              <div
                className={`absolute inset-1 rounded-full border-2 border-dashed ${chip.borderStyle} pointer-events-none opacity-85`}
              />

              {/* Inner ring */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/25 flex items-center justify-center backdrop-blur-[1px]">
                <span
                  className={`text-xs sm:text-sm font-extrabold tracking-tighter ${chip.textColor}`}
                >
                  {chip.label}
                </span>
              </div>
            </button>
          );
        })}

        {/* ALL IN BUTTON BESIDE CHIP RACK */}
        {balance !== undefined && (
          <button
            type="button"
            disabled={disabled || balance <= 0}
            onClick={() => {
              playChipClick();
              if (balance <= 0) {
                showToast?.('Saldo habis, tidak dapat All In!', '💳');
                return;
              }
              onSelectChip(balance);
              showToast?.(`ALL IN! Chip diset ke $${balance.toLocaleString()}`, '🔥');
            }}
            title={`Bertaruh seluruh saldo ($${balance.toLocaleString()}) [Shortcut: A]`}
            className={`relative group flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-radial from-purple-950 via-black to-slate-950 border-2 ${
              isAllInSelected
                ? '-translate-y-1.5 scale-105 ring-3 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8),0_0_10px_rgba(234,179,8,0.6)] border-amber-400'
                : 'border-amber-500/70 hover:border-amber-400 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.6),0_0_10px_rgba(168,85,247,0.4)]'
            }`}
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-900/60 border border-purple-400/80 flex items-center justify-center text-amber-300 shadow-inner">
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                ALL IN
              </span>
              <span className="text-xs sm:text-sm font-mono font-extrabold text-slate-100 tabular-nums">
                {balance > 1000000 ? `$${(balance / 1000000).toFixed(1)}M` : balance > 10000 ? `$${(balance / 1000).toFixed(1)}k` : `$${balance}`}
              </span>
            </div>
          </button>
        )}
      </div>
      <span className="text-[10px] text-slate-500 font-mono hidden md:inline ml-1">
        [←] [→] [A=AllIn]
      </span>
    </div>
  );
};

