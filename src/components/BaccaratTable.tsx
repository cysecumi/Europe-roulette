import React, { useState, useCallback } from 'react';
import { BaccaratBetType, BaccaratResult } from '../types/baccarat';
import { ChipValue } from '../types/roulette';
import { simulateBaccaratRound } from '../utils/baccaratEngine';
import { formatCurrency } from '../utils/rouletteEngine';
import { Sparkles, Trophy, RotateCcw, Play } from 'lucide-react';
import { ChipRack } from './ChipRack';

interface BaccaratTableProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  showToast: (msg: string, icon?: string) => void;
  winRate: number;
  onTriggerParticles?: () => void;
}

export const BaccaratTable: React.FC<BaccaratTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate,
  onTriggerParticles
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [bets, setBets] = useState<Record<BaccaratBetType, number>>({
    player: 0,
    banker: 0,
    tie: 0,
    player_pair: 0,
    banker_pair: 0
  });
  const [isDealing, setIsDealing] = useState(false);
  const [lastResult, setLastResult] = useState<BaccaratResult | null>(null);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const handlePlaceBet = (type: BaccaratBetType) => {
    if (isDealing) return;
    if (balance < selectedChip) {
      showToast('Saldo tidak cukup untuk chip ini!', '💳');
      return;
    }
    onUpdateBalance(balance - selectedChip);
    setBets(prev => ({ ...prev, [type]: prev[type] + selectedChip }));
  };

  const handleClearBets = () => {
    if (isDealing || totalBet === 0) return;
    onUpdateBalance(balance + totalBet);
    setBets({ player: 0, banker: 0, tie: 0, player_pair: 0, banker_pair: 0 });
    showToast('Semua taruhan dikembalikan.', '🧹');
  };

  const handleDeal = () => {
    if (isDealing) return;
    if (totalBet <= 0) {
      showToast('Pasang taruhan terlebih dahulu!', '☝️');
      return;
    }

    setIsDealing(true);
    setTimeout(() => {
      const result = simulateBaccaratRound(winRate, bets);
      setLastResult(result);

      let totalWon = 0;
      for (const [betType, amt] of Object.entries(bets)) {
        if (amt <= 0) continue;
        const b = betType as BaccaratBetType;
        if (
          (b === 'player' && result.winner === 'player') ||
          (b === 'banker' && result.winner === 'banker') ||
          (b === 'tie' && result.winner === 'tie') ||
          (b === 'player_pair' && result.playerPair) ||
          (b === 'banker_pair' && result.bankerPair)
        ) {
          if (b === 'player') totalWon += amt * 2;
          else if (b === 'banker') totalWon += amt * 1.95;
          else if (b === 'tie') totalWon += amt * 9;
          else if (b === 'player_pair' || b === 'banker_pair') totalWon += amt * 12;
        }
      }

      if (totalWon > 0) {
        onUpdateBalance(balance + totalWon);
        onTriggerParticles?.();
        showToast(`Baccarat Menang! +${formatCurrency(totalWon)}`, '🎉');
      } else {
        showToast('Sayang sekali, belum beruntung.', '💫');
      }

      setIsDealing(false);
      setBets({ player: 0, banker: 0, tie: 0, player_pair: 0, banker_pair: 0 });
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 select-none">
      {/* Table Arena */}
      <div className="relative w-full bg-gradient-to-b from-stone-950 via-emerald-950 to-stone-950 border-4 border-amber-500/50 rounded-3xl p-6 shadow-2xl shadow-purple-950/40">
        <div className="absolute top-3 left-6 flex items-center gap-2 text-amber-400 font-bold text-sm tracking-widest uppercase">
          <Sparkles className="w-4 h-4 text-purple-400" /> Baccarat Royale & Dragon Tiger
        </div>

        {/* Cards & Scores Display */}
        <div className="flex flex-col md:flex-row justify-around items-center my-8 gap-8">
          {/* Player Hand */}
          <div className="flex flex-col items-center bg-black/40 border border-blue-500/30 rounded-2xl p-4 w-64 shadow-lg">
            <span className="text-blue-400 font-semibold mb-2">PLAYER ({lastResult ? lastResult.playerScore : 0})</span>
            <div className="flex gap-2 min-h-[90px] items-center">
              {lastResult ? (
                lastResult.playerHand.map((c, i) => (
                  <div key={i} className="w-14 h-20 bg-white rounded-lg text-black font-bold flex flex-col justify-between p-1 shadow-md border border-stone-300 animate-fade-in">
                    <span className="text-xs">{c.rank}</span>
                    <span className="text-center text-lg">{c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}</span>
                    <span className="text-xs text-right">{c.rank}</span>
                  </div>
                ))
              ) : (
                <span className="text-stone-500 text-sm">Menunggu Deal...</span>
              )}
            </div>
            {lastResult?.playerPair && <span className="mt-2 text-xs text-amber-400 font-bold animate-pulse">PLAYER PAIR!</span>}
          </div>

          {/* VS / Winner Banner */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center font-bold text-amber-300 text-lg shadow-lg">
              VS
            </div>
            {lastResult && (
              <span className="mt-3 px-4 py-1 rounded-full bg-purple-900/80 border border-purple-400 text-purple-200 text-xs font-bold uppercase tracking-wider animate-bounce">
                Pemenang: {lastResult.winner.toUpperCase()}
              </span>
            )}
          </div>

          {/* Banker Hand */}
          <div className="flex flex-col items-center bg-black/40 border border-red-500/30 rounded-2xl p-4 w-64 shadow-lg">
            <span className="text-red-400 font-semibold mb-2">BANKER ({lastResult ? lastResult.bankerScore : 0})</span>
            <div className="flex gap-2 min-h-[90px] items-center">
              {lastResult ? (
                lastResult.bankerHand.map((c, i) => (
                  <div key={i} className="w-14 h-20 bg-white rounded-lg text-black font-bold flex flex-col justify-between p-1 shadow-md border border-stone-300 animate-fade-in">
                    <span className="text-xs">{c.rank}</span>
                    <span className="text-center text-lg">{c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}</span>
                    <span className="text-xs text-right">{c.rank}</span>
                  </div>
                ))
              ) : (
                <span className="text-stone-500 text-sm">Menunggu Deal...</span>
              )}
            </div>
            {lastResult?.bankerPair && <span className="mt-2 text-xs text-amber-400 font-bold animate-pulse">BANKER PAIR!</span>}
          </div>
        </div>

        {/* Betting Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handlePlaceBet('player')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${bets.player > 0 ? 'bg-blue-900/60 border-blue-400 shadow-lg shadow-blue-900/50' : 'bg-black/50 border-stone-700 hover:border-blue-500'}`}
          >
            <span className="text-blue-300 font-bold">PLAYER</span>
            <span className="text-xs text-stone-400 mt-1">Pay 1:1</span>
            {bets.player > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded-full text-xs">{formatCurrency(bets.player)}</span>}
          </button>

          <button
            onClick={() => handlePlaceBet('tie')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${bets.tie > 0 ? 'bg-emerald-900/60 border-emerald-400 shadow-lg shadow-emerald-900/50' : 'bg-black/50 border-stone-700 hover:border-emerald-500'}`}
          >
            <span className="text-emerald-300 font-bold">TIE</span>
            <span className="text-xs text-stone-400 mt-1">Pay 8:1</span>
            {bets.tie > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded-full text-xs">{formatCurrency(bets.tie)}</span>}
          </button>

          <button
            onClick={() => handlePlaceBet('banker')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${bets.banker > 0 ? 'bg-red-900/60 border-red-400 shadow-lg shadow-red-900/50' : 'bg-black/50 border-stone-700 hover:border-red-500'}`}
          >
            <span className="text-red-300 font-bold">BANKER</span>
            <span className="text-xs text-stone-400 mt-1">Pay 0.95:1</span>
            {bets.banker > 0 && <span className="mt-2 px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded-full text-xs">{formatCurrency(bets.banker)}</span>}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handlePlaceBet('player_pair')}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${bets.player_pair > 0 ? 'bg-purple-900/60 border-purple-400' : 'bg-black/50 border-stone-700 hover:border-purple-500'}`}
          >
            <span className="text-purple-300 font-semibold text-sm">Player Pair (11:1)</span>
            {bets.player_pair > 0 && <span className="px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded-full text-xs">{formatCurrency(bets.player_pair)}</span>}
          </button>

          <button
            onClick={() => handlePlaceBet('banker_pair')}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${bets.banker_pair > 0 ? 'bg-purple-900/60 border-purple-400' : 'bg-black/50 border-stone-700 hover:border-purple-500'}`}
          >
            <span className="text-purple-300 font-semibold text-sm">Banker Pair (11:1)</span>
            {bets.banker_pair > 0 && <span className="px-2 py-0.5 bg-amber-500 text-black font-extrabold rounded-full text-xs">{formatCurrency(bets.banker_pair)}</span>}
          </button>
        </div>

        <div className="mb-4">
          <ChipRack
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            balance={balance}
            showToast={showToast}
            disabled={isDealing}
          />
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-stone-800">
          <div className="flex items-center gap-3">
            <span className="text-stone-400 text-sm">Total Taruhan: <strong className="text-amber-400">{formatCurrency(totalBet)}</strong></span>
            <button
              onClick={handleClearBets}
              disabled={isDealing || totalBet === 0}
              className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-50 text-xs font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <button
            onClick={handleDeal}
            disabled={isDealing || totalBet === 0}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-extrabold text-base shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" /> DEAL CARDS
          </button>
        </div>
      </div>
    </div>
  );
};
