import React, { useState } from 'react';
import { MegaWheelSegmentValue, MegaWheelResult } from '../types/megaWheel';
import { MEGA_WHEEL_SEGMENTS, simulateMegaWheelSpin } from '../utils/megaWheelEngine';
import { ChipValue } from '../types/roulette';
import { formatCurrency } from '../utils/rouletteEngine';
import { Sparkles, Trophy, RotateCcw, Zap } from 'lucide-react';
import { ChipRack } from './ChipRack';

interface MegaWheelTableProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  showToast: (msg: string, icon?: string) => void;
  winRate: number;
  onTriggerParticles?: () => void;
}

const AVAILABLE_BETS: MegaWheelSegmentValue[] = [1, 2, 5, 10, 20, 40, 100, 500, 1000];

export const MegaWheelTable: React.FC<MegaWheelTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate,
  onTriggerParticles
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [bets, setBets] = useState<Record<number, number>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<MegaWheelResult | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  const totalBet = Object.values(bets).reduce((a, b) => a + (b || 0), 0);

  const handlePlaceBet = (val: number) => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      showToast('Saldo tidak cukup untuk chip ini!', '💳');
      return;
    }
    onUpdateBalance(balance - selectedChip);
    setBets(prev => ({ ...prev, [val]: (prev[val] || 0) + selectedChip }));
  };

  const handleClearBets = () => {
    if (isSpinning || totalBet === 0) return;
    onUpdateBalance(balance + totalBet);
    setBets({});
    showToast('Taruhan Mega Wheel dibersihkan.', '🧹');
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    if (totalBet <= 0) {
      showToast('Pasang taruhan pada segmen roda!', '☝️');
      return;
    }

    setIsSpinning(true);
    const result = simulateMegaWheelSpin(winRate, bets);

    // Calculate target angle to land on segment
    const segmentDegree = 360 / MEGA_WHEEL_SEGMENTS.length;
    const targetSegIndex = result.winningSegment.id;
    const randomSpins = 5 + Math.floor(Math.random() * 5); // 5 to 9 full rotations
    const newAngle = rotationAngle + (360 * randomSpins) + (targetSegIndex * segmentDegree);

    setRotationAngle(newAngle);

    setTimeout(() => {
      setLastResult(result);
      onTriggerParticles?.();
      if (result.payoutMultiplier > 0) {
        const winAmount = (bets[result.winningSegment.value] || 0) * result.winningSegment.value + (bets[result.winningSegment.value] || 0);
        onUpdateBalance(balance + winAmount);
        showToast(`Mega Wheel MENANG x${result.winningSegment.value}! +${formatCurrency(winAmount)}`, '🎉');
      } else {
        showToast(`Roda berhenti di x${result.winningSegment.value}. Coba lagi!`, '💫');
      }

      setIsSpinning(false);
      setBets({});
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 select-none">
      <div className="relative w-full bg-gradient-to-b from-stone-950 via-purple-950/40 to-stone-950 border-4 border-amber-500/50 rounded-3xl p-6 shadow-2xl">
        <div className="absolute top-3 left-6 flex items-center gap-2 text-amber-400 font-bold text-sm tracking-widest uppercase">
          <Zap className="w-4 h-4 text-purple-400 animate-pulse" /> Mega Wheel Fortune x1000
        </div>

        {/* Wheel Graphic */}
        <div className="flex flex-col items-center justify-center my-6 relative">
          <div className="absolute -top-3 z-20 w-8 h-10 bg-gradient-to-b from-amber-400 to-amber-600 clip-triangle shadow-xl border border-white" />
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-amber-400 bg-black shadow-2xl relative overflow-hidden flex items-center justify-center p-2">
            <div
              className="w-full h-full rounded-full relative transition-transform duration-[3000ms] cubic-bezier(0.15, 0.95, 0.15, 1)"
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                background: 'conic-gradient(#eab308 0deg 18deg, #a855f7 18deg 36deg, #3b82f6 36deg 54deg, #ec4899 54deg 72deg, #10b981 72deg 90deg, #f97316 90deg 108deg, #ef4444 108deg 126deg, #8b5cf6 126deg 144deg, #fbbf24 144deg 162deg, #3b82f6 162deg 180deg, #eab308 180deg 198deg, #a855f7 198deg 216deg, #ec4899 216deg 234deg, #10b981 234deg 252deg, #f97316 252deg 270deg, #ef4444 270deg 288deg, #8b5cf6 288deg 306deg, #fbbf24 306deg 324deg, #eab308 324deg 342deg, #3b82f6 342deg 360deg)'
              }}
            >
              {MEGA_WHEEL_SEGMENTS.map((seg, idx) => {
                const angle = idx * 18 + 9;
                return (
                  <div
                    key={seg.id}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span
                      className="absolute text-[10px] sm:text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                      style={{ transform: 'translateY(-75px) rotate(90deg)' }}
                    >
                      {seg.value >= 1000 ? '1K' : seg.value >= 500 ? '500' : `x${seg.value}`}
                    </span>
                  </div>
                );
              })}

              <div className="absolute inset-10 rounded-full bg-black/85 flex items-center justify-center border-4 border-amber-400/60 shadow-inner">
                <span className="text-amber-400 font-extrabold text-sm sm:text-lg tracking-widest">MEGA</span>
              </div>
            </div>
          </div>
          {lastResult && (
            <div className="mt-4 px-6 py-2 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-extrabold text-sm animate-pulse">
              Hasil Putaran: x{lastResult.winningSegment.value}
            </div>
          )}
        </div>

        {/* Betting Options */}
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-6">
          {AVAILABLE_BETS.map(val => (
            <button
              key={val}
              onClick={() => handlePlaceBet(val)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                (bets[val] || 0) > 0
                  ? 'bg-amber-500/30 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-black/50 border-stone-800 hover:border-amber-500/50'
              }`}
            >
              <span className="text-amber-300 font-black text-base">x{val}</span>
              {(bets[val] || 0) > 0 && (
                <span className="mt-1 px-1.5 py-0.5 bg-amber-500 text-black font-extrabold rounded text-[10px]">
                  {formatCurrency(bets[val] || 0)}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <ChipRack
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            balance={balance}
            showToast={showToast}
            disabled={isSpinning}
          />
        </div>

        {/* Action Dock */}
        <div className="flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-stone-800">
          <div className="flex items-center gap-3">
            <span className="text-stone-400 text-sm">
              Total Taruhan: <strong className="text-amber-400">{formatCurrency(totalBet)}</strong>
            </span>
            <button
              onClick={handleClearBets}
              disabled={isSpinning || totalBet === 0}
              className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-50 text-xs font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <button
            onClick={handleSpinWheel}
            disabled={isSpinning || totalBet === 0}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> PUTAR RODA
          </button>
        </div>
      </div>
    </div>
  );
};
