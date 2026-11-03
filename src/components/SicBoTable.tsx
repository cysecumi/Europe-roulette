import React, { useState } from 'react';
import { SicBoBetType, SicBoResult } from '../types/sicBo';
import { simulateSicBoRoll } from '../utils/sicBoEngine';
import { ChipValue } from '../types/roulette';
import { formatCurrency } from '../utils/rouletteEngine';
import { Sparkles, Trophy, RotateCcw, Dices } from 'lucide-react';
import { ChipRack } from './ChipRack';

interface SicBoTableProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  showToast: (msg: string, icon?: string) => void;
  winRate: number;
  onTriggerParticles?: () => void;
}

export const SicBoTable: React.FC<SicBoTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate,
  onTriggerParticles
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [bets, setBets] = useState<Record<SicBoBetType, number>>({} as Record<SicBoBetType, number>);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<SicBoResult | null>(null);

  const totalBet = Object.values(bets).reduce((a, b) => a + (b || 0), 0);

  const handlePlaceBet = (type: SicBoBetType) => {
    if (isRolling) return;
    if (balance < selectedChip) {
      showToast('Saldo tidak cukup untuk chip ini!', '💳');
      return;
    }
    onUpdateBalance(balance - selectedChip);
    setBets(prev => ({ ...prev, [type]: (prev[type] || 0) + selectedChip }));
  };

  const handleClearBets = () => {
    if (isRolling || totalBet === 0) return;
    onUpdateBalance(balance + totalBet);
    setBets({} as Record<SicBoBetType, number>);
    showToast('Semua taruhan Sic Bo dikembalikan.', '🧹');
  };

  const handleRollDice = () => {
    if (isRolling) return;
    if (totalBet <= 0) {
      showToast('Pasang taruhan pada meja dadu terlebih dahulu!', '☝️');
      return;
    }

    setIsRolling(true);
    setTimeout(() => {
      const result = simulateSicBoRoll(winRate, bets);
      setLastResult(result);

      let totalWon = 0;
      for (const [betType, amt] of Object.entries(bets)) {
        if (amt <= 0) continue;
        const b = betType as SicBoBetType;
        if (result.winningBets.includes(b)) {
          if (b === 'small' || b === 'big') totalWon += amt * 2;
          else if (b.startsWith('sum_')) {
            const s = parseInt(b.replace('sum_', ''), 10);
            if (s === 4 || s === 17) totalWon += amt * 62;
            else if (s === 5 || s === 16) totalWon += amt * 32;
            else if (s === 6 || s === 15) totalWon += amt * 20;
            else if (s === 7 || s === 14) totalWon += amt * 14;
            else if (s === 8 || s === 13) totalWon += amt * 10;
            else totalWon += amt * 8;
          } else if (b.startsWith('triple_')) totalWon += amt * 182;
          else if (b === 'any_triple') totalWon += amt * 32;
          else if (b.startsWith('single_')) {
            const val = parseInt(b.replace('single_', ''), 10);
            const count = result.dice.filter(d => d === val).length;
            totalWon += amt * (count + 1);
          }
        }
      }

      if (totalWon > 0) {
        onUpdateBalance(balance + totalWon);
        onTriggerParticles?.();
        showToast(`Sic Bo Menang! +${formatCurrency(totalWon)}`, '🎉');
      } else {
        showToast('Sayang sekali, dadu tidak berpihak pada Anda.', '💫');
      }

      setIsRolling(false);
      setBets({} as Record<SicBoBetType, number>);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 select-none">
      <div className="relative w-full bg-gradient-to-b from-stone-950 via-red-950/40 to-stone-950 border-4 border-amber-500/50 rounded-3xl p-6 shadow-2xl">
        <div className="absolute top-3 left-6 flex items-center gap-2 text-amber-400 font-bold text-sm tracking-widest uppercase">
          <Dices className="w-4 h-4 text-amber-400" /> Sic Bo / Dice Royale
        </div>

        {/* Dice Display Area */}
        <div className="flex flex-col items-center justify-center my-8">
          <div className="flex gap-6 mb-3">
            {lastResult ? (
              lastResult.dice.map((d, i) => (
                <div key={i} className="w-16 h-16 bg-gradient-to-br from-white to-stone-200 rounded-2xl border-2 border-stone-400 text-black font-black text-3xl flex items-center justify-center shadow-xl animate-bounce">
                  {d}
                </div>
              ))
            ) : (
              <div className="flex gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-16 h-16 bg-stone-900 rounded-2xl border border-stone-700 text-stone-600 font-bold text-xl flex items-center justify-center">
                    ?
                  </div>
                ))}
              </div>
            )}
          </div>
          {lastResult && (
            <div className="text-amber-300 font-bold text-sm tracking-wider">
              Total Dadu: <strong className="text-white text-lg">{lastResult.sum}</strong> ({lastResult.isSmall ? 'SMALL 4-10' : lastResult.isBig ? 'BIG 11-17' : 'TRIPLE'})
            </div>
          )}
        </div>

        {/* Betting Options Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => handlePlaceBet('small')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              (bets['small'] || 0) > 0 ? 'bg-amber-500/30 border-amber-400 shadow-lg' : 'bg-black/50 border-stone-800 hover:border-amber-500'
            }`}
          >
            <span className="text-amber-300 font-extrabold text-base">SMALL (4-10)</span>
            <span className="text-xs text-stone-400 mt-1">Pay 1:1</span>
            {(bets['small'] || 0) > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded text-xs">{formatCurrency(bets['small'])}</span>}
          </button>

          <button
            onClick={() => handlePlaceBet('big')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              (bets['big'] || 0) > 0 ? 'bg-amber-500/30 border-amber-400 shadow-lg' : 'bg-black/50 border-stone-800 hover:border-amber-500'
            }`}
          >
            <span className="text-amber-300 font-extrabold text-base">BIG (11-17)</span>
            <span className="text-xs text-stone-400 mt-1">Pay 1:1</span>
            {(bets['big'] || 0) > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded text-xs">{formatCurrency(bets['big'])}</span>}
          </button>

          <button
            onClick={() => handlePlaceBet('any_triple')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              (bets['any_triple'] || 0) > 0 ? 'bg-purple-900/50 border-purple-400 shadow-lg' : 'bg-black/50 border-stone-800 hover:border-purple-500'
            }`}
          >
            <span className="text-purple-300 font-extrabold text-base">ANY TRIPLE</span>
            <span className="text-xs text-stone-400 mt-1">Pay 30:1</span>
            {(bets['any_triple'] || 0) > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded text-xs">{formatCurrency(bets['any_triple'])}</span>}
          </button>

          <button
            onClick={() => handlePlaceBet('sum_10')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              (bets['sum_10'] || 0) > 0 ? 'bg-amber-500/30 border-amber-400 shadow-lg' : 'bg-black/50 border-stone-800 hover:border-amber-500'
            }`}
          >
            <span className="text-amber-300 font-extrabold text-base">SUM 10</span>
            <span className="text-xs text-stone-400 mt-1">Pay 6:1</span>
            {(bets['sum_10'] || 0) > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded text-xs">{formatCurrency(bets['sum_10'])}</span>}
          </button>
        </div>

        <div className="mb-4">
          <ChipRack
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            balance={balance}
            showToast={showToast}
            disabled={isRolling}
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
              disabled={isRolling || totalBet === 0}
              className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-50 text-xs font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <button
            onClick={handleRollDice}
            disabled={isRolling || totalBet === 0}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black font-extrabold text-base shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Dices className="w-5 h-5 fill-black" /> LEMPAR DADU
          </button>
        </div>
      </div>
    </div>
  );
};
