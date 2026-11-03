import React from 'react';
import { ChipValue } from '../types/roulette';

interface ChipRackProps {
  selectedChip: ChipValue;
  onSelectChip: (value: ChipValue) => void;
  disabled?: boolean;
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
  disabled = false
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2 px-4 rounded-2xl bg-black/40 border border-amber-500/15 backdrop-blur-md">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
        Chip:
      </span>
      <div className="flex items-center gap-2 sm:gap-3">
        {CHIP_CONFIGS.map((chip, idx) => {
          const isSelected = selectedChip === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelectChip(chip.value)}
              title={`Pilih chip $${chip.value} [Shortcut: Shift+${idx + 1}]`}
              className={`relative group flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
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
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/25 flex items-center justify-center backdrop-blur-[1px]">
                <span
                  className={`text-xs sm:text-sm font-extrabold tracking-tighter ${chip.textColor}`}
                >
                  {chip.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <span className="text-[10px] text-slate-500 font-mono hidden md:inline ml-1">
        [←] [→]
      </span>
    </div>
  );
};
