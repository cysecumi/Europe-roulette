import React from 'react';
import { BetId } from '../types/roulette';
import { formatChipBadge, getColor, isRed } from '../utils/rouletteEngine';
import { playChipClick } from '../utils/soundEngine';

interface BettingTableProps {
  bets: Record<BetId, number>;
  onPlaceBet: (id: BetId) => void;
  onRemoveBet: (id: BetId) => void;
  disabled?: boolean;
  winningNumber: number | null;
  winningBetIds?: BetId[];
}

export const BettingTable: React.FC<BettingTableProps> = ({
  bets,
  onPlaceBet,
  onRemoveBet,
  disabled = false,
  winningNumber,
  winningBetIds = []
}) => {
  // Helper to get chip visual style based on amount
  const getChipStyle = (amount: number) => {
    if (amount >= 500) {
      return {
        bg: 'bg-radial from-amber-400 via-amber-600 to-amber-900',
        text: 'text-amber-950',
        border: 'border-amber-200'
      };
    }
    if (amount >= 100) {
      return {
        bg: 'bg-radial from-slate-800 to-black',
        text: 'text-amber-300',
        border: 'border-amber-400'
      };
    }
    if (amount >= 50) {
      return {
        bg: 'bg-radial from-purple-500 to-purple-800',
        text: 'text-white',
        border: 'border-purple-300'
      };
    }
    if (amount >= 25) {
      return {
        bg: 'bg-radial from-emerald-500 to-emerald-800',
        text: 'text-white',
        border: 'border-emerald-300'
      };
    }
    if (amount >= 10) {
      return {
        bg: 'bg-radial from-blue-500 to-blue-800',
        text: 'text-white',
        border: 'border-blue-300'
      };
    }
    return {
      bg: 'bg-radial from-red-500 to-red-800',
      text: 'text-white',
      border: 'border-red-300'
    };
  };

  const renderChip = (amount?: number) => {
    if (!amount || amount <= 0) return null;
    const style = getChipStyle(amount);

    return (
      <div
        className={`absolute inset-0 m-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] sm:text-xs z-20 pointer-events-none shadow-[0_4px_10px_rgba(0,0,0,0.8)] border border-dashed ${style.border} ${style.bg} ${style.text} animate-scale-in`}
      >
        <span className="drop-shadow-sm">{formatChipBadge(amount)}</span>
      </div>
    );
  };

  const handleCellClick = (id: BetId) => {
    if (disabled) return;
    playChipClick();
    onPlaceBet(id);
  };

  const handleContextMenu = (e: React.MouseEvent, id: BetId) => {
    e.preventDefault();
    if (disabled) return;
    onRemoveBet(id);
  };

  return (
    <div className="w-full bg-[#072418] border-4 border-[#3b240f] rounded-2xl p-3 sm:p-5 shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_12px_36px_rgba(0,0,0,0.6)]">
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[680px] max-w-[820px] mx-auto select-none">
          {/* Main Table Grid */}
          <div
            className="grid gap-[3px] p-2 bg-[#0c402b]/60 rounded-xl border border-amber-500/20"
            style={{
              gridTemplateColumns: '56px repeat(12, minmax(42px, 1fr)) 54px',
              gridTemplateRows: 'repeat(3, 48px) 42px 42px'
            }}
          >
            {/* Zero (0) - Spans 3 rows */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleCellClick('n-0')}
              onContextMenu={e => handleContextMenu(e, 'n-0')}
              className={`relative col-start-1 row-start-1 row-span-3 flex flex-col items-center justify-center gap-1 font-extrabold text-lg text-emerald-100 rounded-l-md transition-all duration-150 cursor-pointer disabled:cursor-not-allowed ${
                winningNumber === 0 ? 'ring-3 ring-amber-300 brightness-130 animate-pulse' : ''
              } bg-emerald-700/85 hover:brightness-120 active:scale-95 border border-emerald-500/40`}
              title="Shortcut: Tekan tombol [0]"
            >
              <span className="z-10 drop-shadow">0</span>
              <kbd className="z-10 text-[9px] font-mono text-emerald-300/80 bg-black/50 px-1 py-0.2 rounded border border-emerald-400/30">
                0
              </kbd>
              {renderChip(bets['n-0'])}
            </button>

            {/* Numbers 1-36 Grid */}
            {Array.from({ length: 12 }).map((_, c) => {
              const colNums = [3 + c * 3, 2 + c * 3, 1 + c * 3]; // Row 1 = 3,6,9...; Row 2 = 2,5,8...; Row 3 = 1,4,7...
              return colNums.map((num, r) => {
                const betId: BetId = `n-${num}`;
                const isRedNum = isRed(num);
                const isWin = winningNumber === num;

                return (
                  <button
                    key={num}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleCellClick(betId)}
                    onContextMenu={e => handleContextMenu(e, betId)}
                    style={{
                      gridColumn: c + 2,
                      gridRow: r + 1
                    }}
                    className={`relative flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer disabled:cursor-not-allowed border border-white/10 rounded-xs ${
                      isRedNum
                        ? 'bg-red-700 text-white hover:bg-red-600'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    } ${
                      isWin ? 'ring-3 ring-amber-300 brightness-135 z-10 animate-pulse' : ''
                    } active:scale-95`}
                  >
                    <span className="z-10 drop-shadow-sm">{num}</span>
                    {renderChip(bets[betId])}
                  </button>
                );
              });
            })}

            {/* Column Bets (2:1) on the Right */}
            {[
              { id: 'col3' as BetId, row: 1 },
              { id: 'col2' as BetId, row: 2 },
              { id: 'col1' as BetId, row: 3 }
            ].map(col => {
              const isWin = winningBetIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleCellClick(col.id)}
                  onContextMenu={e => handleContextMenu(e, col.id)}
                  style={{
                    gridColumn: 14,
                    gridRow: col.row
                  }}
                  className={`relative flex items-center justify-center font-bold text-xs uppercase tracking-wider text-amber-200 border border-amber-500/30 rounded-r-md transition-all cursor-pointer disabled:cursor-not-allowed bg-[#083020]/90 hover:bg-[#0c452e] ${
                    isWin ? 'ring-2 ring-amber-300 brightness-125' : ''
                  } active:scale-95`}
                >
                  <span className="z-10">2:1</span>
                  {renderChip(bets[col.id])}
                </button>
              );
            })}

            {/* Dozen Bets (Row 4) */}
            {[
              { id: 'dozen1' as BetId, label: '1st 12', colStart: 2, hotkey: '1' },
              { id: 'dozen2' as BetId, label: '2nd 12', colStart: 6, hotkey: '2' },
              { id: 'dozen3' as BetId, label: '3rd 12', colStart: 10, hotkey: '3' }
            ].map(dozen => {
              const isWin = winningBetIds.includes(dozen.id);
              return (
                <button
                  key={dozen.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleCellClick(dozen.id)}
                  onContextMenu={e => handleContextMenu(e, dozen.id)}
                  style={{
                    gridColumn: `${dozen.colStart} / span 4`,
                    gridRow: 4
                  }}
                  title={`Shortcut: Tekan tombol [${dozen.hotkey}]`}
                  className={`relative flex items-center justify-between px-3 font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-100 border border-amber-500/30 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed bg-[#072d1e]/85 hover:bg-[#0c452e] ${
                    isWin ? 'ring-2 ring-amber-300 brightness-125' : ''
                  } active:scale-95`}
                >
                  <span className="z-10">{dozen.label}</span>
                  <kbd className="z-10 text-[9px] font-mono text-amber-300/80 bg-black/40 px-1 py-0.2 rounded border border-amber-500/20">
                    {dozen.hotkey}
                  </kbd>
                  {renderChip(bets[dozen.id])}
                </button>
              );
            })}

            {/* Bottom Outside Bets (Row 5: 1-18, EVEN, RED, BLACK, ODD, 19-36) */}
            {[
              { id: 'low' as BetId, label: '1 - 18', colStart: 2, isColor: false, hotkey: '4' },
              { id: 'even' as BetId, label: 'EVEN', colStart: 4, isColor: false, hotkey: '5' },
              { id: 'red' as BetId, label: 'RED', colStart: 6, isColor: 'red', hotkey: '6' },
              { id: 'black' as BetId, label: 'BLACK', colStart: 8, isColor: 'black', hotkey: '7' },
              { id: 'odd' as BetId, label: 'ODD', colStart: 10, isColor: false, hotkey: '8' },
              { id: 'high' as BetId, label: '19 - 36', colStart: 12, isColor: false, hotkey: '9' }
            ].map(outBet => {
              const isWin = winningBetIds.includes(outBet.id);
              return (
                <button
                  key={outBet.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleCellClick(outBet.id)}
                  onContextMenu={e => handleContextMenu(e, outBet.id)}
                  style={{
                    gridColumn: `${outBet.colStart} / span 2`,
                    gridRow: 5
                  }}
                  title={`Shortcut: Tekan tombol [${outBet.hotkey}]`}
                  className={`relative flex items-center justify-between px-2 font-bold text-xs uppercase tracking-wider border rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed ${
                    outBet.isColor === 'red'
                      ? 'bg-red-700/80 text-white border-red-500/40 hover:bg-red-600'
                      : outBet.isColor === 'black'
                      ? 'bg-zinc-900/90 text-white border-zinc-700 hover:bg-zinc-800'
                      : 'bg-[#072d1e]/85 text-amber-100 border-amber-500/30 hover:bg-[#0c452e]'
                  } ${isWin ? 'ring-2 ring-amber-300 brightness-125' : ''} active:scale-95`}
                >
                  {outBet.isColor === 'red' ? (
                    <div className="flex items-center gap-1.5 z-10">
                      <div className="w-3.5 h-3.5 bg-red-500 rotate-45 border border-white/60 shadow-sm" />
                      <span className="font-extrabold">RED</span>
                    </div>
                  ) : outBet.isColor === 'black' ? (
                    <div className="flex items-center gap-1.5 z-10">
                      <div className="w-3.5 h-3.5 bg-zinc-950 rotate-45 border border-amber-400/80 shadow-sm" />
                      <span className="font-extrabold">BLACK</span>
                    </div>
                  ) : (
                    <span className="z-10">{outBet.label}</span>
                  )}
                  <kbd className="z-10 text-[9px] font-mono text-amber-300/80 bg-black/50 px-1 py-0.2 rounded border border-amber-500/20">
                    {outBet.hotkey}
                  </kbd>
                  {renderChip(bets[outBet.id])}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Help hint */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-500/10 text-[11px] text-emerald-300/60 px-1">
        <span>Klik untuk pasang chip · Klik kanan untuk hapus taruhan</span>
        <span className="font-mono">Pemberian 35:1 (Angka) · 2:1 (Kolom/Dozen) · 1:1 (Luar)</span>
      </div>
    </div>
  );
};
