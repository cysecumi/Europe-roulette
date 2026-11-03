import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BonusState, PaytableEntry, PokerCard, PokerEvaluation } from '../types/pokerSlot';
import { ChipValue } from '../types/roulette';
import { ChipRack } from './ChipRack';
import {
  evaluatePokerHand,
  generateRandom5CardHand,
  generateHandWithWinRate,
  PAYTABLE,
  SUITS,
  RANKS,
  RANK_VALUES
} from '../utils/pokerHandEngine';
import { SUIT_COLORS, SUIT_SYMBOLS } from '../utils/blackjackEngine';
import { formatCurrency } from '../utils/rouletteEngine';
import { Play, Sparkles, Flame, Trophy, Trash2, ArrowUpCircle, Crown, Gift, Repeat, Square, ChevronDown, X } from 'lucide-react';

interface PokerSlotTableProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  showToast: (msg: string, icon?: string) => void;
  winRate?: number;
  onTriggerParticles?: () => void;
}

export const PokerSlotTable: React.FC<PokerSlotTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate = 50,
  onTriggerParticles
}) => {
  const [betAmount, setBetAmount] = useState<number>(25);
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Auto Spin State
  const [isAutoSpinActive, setIsAutoSpinActive] = useState<boolean>(false);
  const [autoSpinRemaining, setAutoSpinRemaining] = useState<number | 'inf'>(0);
  const [showAutoSpinMenu, setShowAutoSpinMenu] = useState<boolean>(false);

  // 5 Reels state
  const [reels, setReels] = useState<PokerCard[]>(() => generateRandom5CardHand());
  const [reelRolling, setReelRolling] = useState<boolean[]>([false, false, false, false, false]);
  const [lastEvaluation, setLastEvaluation] = useState<PokerEvaluation | null>(null);

  // Bonus Free Spins State
  const [bonusState, setBonusState] = useState<BonusState>({
    isActive: false,
    freeSpinsRemaining: 0,
    totalSpinsAwarded: 0,
    totalBonusWon: 0,
    multiplier: 2
  });
  const [showBonusCelebration, setShowBonusCelebration] = useState<boolean>(false);

  const animationTimersRef = useRef<number[]>([]);
  const rollIntervalRef = useRef<number | null>(null);
  const autoSpinTimerRef = useRef<number | null>(null);

  // Mutable refs for asynchronous loops & event listeners
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const betAmountRef = useRef(betAmount);
  betAmountRef.current = betAmount;
  const bonusStateRef = useRef(bonusState);
  bonusStateRef.current = bonusState;
  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;
  const isAutoSpinActiveRef = useRef(false);
  const autoSpinRemainingRef = useRef<number | 'inf'>(0);
  const winRateRef = useRef(winRate);
  winRateRef.current = winRate;

  // Stop Auto Spin helper
  const stopAutoSpin = useCallback((msg?: string) => {
    if (autoSpinTimerRef.current) {
      clearTimeout(autoSpinTimerRef.current);
      autoSpinTimerRef.current = null;
    }
    isAutoSpinActiveRef.current = false;
    setIsAutoSpinActive(false);
    setAutoSpinRemaining(0);
    setShowAutoSpinMenu(false);
    if (msg) {
      showToast(msg, '⏹️');
    }
  }, [showToast]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(clearTimeout);
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current);
    };
  }, []);

  // Bet adjustments
  const handleAddBet = useCallback(
    (chip: ChipValue) => {
      if (isSpinning || bonusState.isActive || isAutoSpinActive) return;
      if (balance < chip) {
        showToast('Saldo tidak cukup untuk chip ini!', '💳');
        return;
      }
      setBetAmount(prev => prev + chip);
    },
    [balance, bonusState.isActive, isAutoSpinActive, isSpinning, showToast]
  );

  const handleClearBet = useCallback(() => {
    if (isSpinning || bonusState.isActive || isAutoSpinActive || betAmount === 0) return;
    setBetAmount(5);
    showToast('Taruhan diatur ke minimum ($5).', '🧹');
  }, [betAmount, bonusState.isActive, isAutoSpinActive, isSpinning, showToast]);

  const handleDoubleBet = useCallback(() => {
    if (isSpinning || bonusState.isActive || isAutoSpinActive || betAmount === 0) return;
    if (balance < betAmount * 2) {
      showToast('Saldo tidak cukup untuk menggandakan taruhan!', '💳');
      return;
    }
    setBetAmount(prev => prev * 2);
    showToast('Taruhan digandakan (2x).', '⚡');
  }, [balance, betAmount, bonusState.isActive, isAutoSpinActive, isSpinning, showToast]);

  // Execute Spin Core
  const handleSpin = useCallback(() => {
    if (isSpinningRef.current) return;

    const isFreeSpin = bonusStateRef.current.isActive && bonusStateRef.current.freeSpinsRemaining > 0;
    const currentBet = betAmountRef.current;
    let balanceAfterDeduction = balanceRef.current;

    // Deduct bet if not free spin
    if (!isFreeSpin) {
      if (currentBet <= 0) {
        showToast('Tentukan nilai taruhan terlebih dahulu!', '☝️');
        stopAutoSpin();
        return;
      }
      if (balanceRef.current < currentBet) {
        showToast('Saldo Anda tidak mencukupi untuk putaran ini!', '💳');
        stopAutoSpin('Auto Spin dihentikan: Saldo tidak mencukupi.');
        return;
      }
      balanceAfterDeduction = balanceRef.current - currentBet;
      onUpdateBalance(balanceAfterDeduction);
    }

    setIsSpinning(true);
    isSpinningRef.current = true;
    setLastEvaluation(null);
    setReelRolling([true, true, true, true, true]);

    // Target 5 cards predetermined with real-time win rate
    const finalHand = generateHandWithWinRate(winRateRef.current);

    // High speed rolling reel effect
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollIntervalRef.current = window.setInterval(() => {
      setReels(prev =>
        prev.map((card, idx) => ({
          id: `rolling-${idx}-${Math.random()}`,
          suit: SUITS[Math.floor(Math.random() * SUITS.length)],
          rank: RANKS[Math.floor(Math.random() * RANKS.length)],
          rankValue: 10
        }))
      );
    }, 60);

    // Staggered reel stops: Reel 1 (900ms), 2 (1200ms), 3 (1500ms), 4 (1800ms), 5 (2100ms)
    const stopDelays = [900, 1200, 1500, 1800, 2100];

    stopDelays.forEach((delay, idx) => {
      const timer = window.setTimeout(() => {
        setReelRolling(prev => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });

        setReels(prev => {
          const next = [...prev];
          next[idx] = finalHand[idx];
          return next;
        });

        // Last reel stopped!
        if (idx === 4) {
          if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
          setReels(finalHand);
          setIsSpinning(false);
          isSpinningRef.current = false;

          // Evaluate 5 card poker hand
          const evaluation = evaluatePokerHand(finalHand);
          setLastEvaluation(evaluation);

          // Calculate payout
          let winMultiplier = evaluation.multiplier;
          if (isFreeSpin) {
            winMultiplier *= bonusStateRef.current.multiplier;
          }

          const payoutAmount = currentBet * winMultiplier;
          const finalRoundBalance = balanceAfterDeduction + payoutAmount;

          if (payoutAmount > 0) {
            onUpdateBalance(finalRoundBalance);
            onTriggerParticles?.();
            if (isFreeSpin) {
              setBonusState(b => ({
                ...b,
                totalBonusWon: b.totalBonusWon + payoutAmount
              }));
            }
          }

          // Check if 3+ Aces triggered Bonus Free Spins
          if (evaluation.triggeredBonus) {
            onTriggerParticles?.();
            // Stop Auto Spin when Bonus Round is triggered!
            if (isAutoSpinActiveRef.current) {
              stopAutoSpin('Auto Spin berhenti: Babak Bonus Free Spins didapatkan! 🎁');
            }
            setShowBonusCelebration(true);
            setBonusState({
              isActive: true,
              freeSpinsRemaining: 5,
              totalSpinsAwarded: 5,
              totalBonusWon: payoutAmount,
              multiplier: 2
            });
            showToast('3+ AS TERDETEKSI! 5 FREE SPINS DIAKTIFKAN! 🎉', '🎰');
            return;
          }

          if (isFreeSpin) {
            // Decrement free spins
            setBonusState(b => {
              const remaining = b.freeSpinsRemaining - 1;
              if (remaining <= 0) {
                showToast(`Babak Bonus Selesai! Total Menang: ${formatCurrency(b.totalBonusWon + payoutAmount)}`, '🏆');
                return {
                  ...b,
                  isActive: false,
                  freeSpinsRemaining: 0
                };
              }
              return {
                ...b,
                freeSpinsRemaining: remaining
              };
            });
            return;
          }

          // AUTO-SPIN CHECK FOR NEXT ROUND
          if (isAutoSpinActiveRef.current) {
            let shouldContinue = true;

            // Check remaining count
            if (autoSpinRemainingRef.current !== 'inf') {
              const nextRemaining = (autoSpinRemainingRef.current as number) - 1;
              autoSpinRemainingRef.current = nextRemaining;
              setAutoSpinRemaining(nextRemaining);

              if (nextRemaining <= 0) {
                stopAutoSpin('Auto Spin selesai!');
                shouldContinue = false;
              }
            }

            // Check if balance suffices for next round
            if (shouldContinue && finalRoundBalance < currentBet) {
              stopAutoSpin('Auto Spin dihentikan: Saldo tidak mencukupi untuk taruhan berikutnya.');
              shouldContinue = false;
            }

            // Schedule next spin
            if (shouldContinue) {
              autoSpinTimerRef.current = window.setTimeout(() => {
                if (isAutoSpinActiveRef.current) {
                  handleSpin();
                }
              }, 1100);
            }
          }
        }
      }, delay);

      animationTimersRef.current.push(timer);
    });
  }, [onUpdateBalance, showToast, stopAutoSpin]);

  // Start Auto Spin handler
  const startAutoSpin = useCallback(
    (count: number | 'inf') => {
      setShowAutoSpinMenu(false);
      if (isSpinningRef.current) return;

      if (bonusStateRef.current.isActive) {
        showToast('Auto Spin tidak dapat diaktifkan saat Babak Bonus Free Spins.', '⚠️');
        return;
      }

      if (betAmountRef.current <= 0) {
        showToast('Tentukan nilai taruhan terlebih dahulu!', '☝️');
        return;
      }

      if (balanceRef.current < betAmountRef.current) {
        showToast('Saldo Anda tidak mencukupi untuk Auto Spin!', '💳');
        return;
      }

      isAutoSpinActiveRef.current = true;
      setIsAutoSpinActive(true);
      autoSpinRemainingRef.current = count;
      setAutoSpinRemaining(count);
      showToast(
        `Auto Spin dimulai (${count === 'inf' ? 'Tanpa Batas' : count + ' putaran'})`,
        '🔁'
      );

      handleSpin();
    },
    [handleSpin, showToast]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isAutoSpinActiveRef.current) {
          stopAutoSpin('Auto Spin dihentikan.');
          return;
        }
        handleSpin();
        return;
      }

      if (e.key === 'Escape') {
        if (isAutoSpinActiveRef.current) {
          e.preventDefault();
          stopAutoSpin('Auto Spin dihentikan.');
          return;
        }
        if (showAutoSpinMenu) {
          e.preventDefault();
          setShowAutoSpinMenu(false);
          return;
        }
      }

      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        if (isAutoSpinActiveRef.current) {
          stopAutoSpin('Auto Spin dihentikan.');
        } else {
          setShowAutoSpinMenu(prev => !prev);
        }
        return;
      }

      if (key === 'c') {
        e.preventDefault();
        handleClearBet();
        return;
      }
      if (key === 'd' || key === 'x') {
        e.preventDefault();
        handleDoubleBet();
        return;
      }

      const chipMap: Record<string, ChipValue> = {
        '1': 5,
        '2': 10,
        '3': 25,
        '4': 50,
        '5': 100,
        '6': 500
      };
      if (chipMap[e.key]) {
        e.preventDefault();
        handleAddBet(chipMap[e.key]);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddBet, handleClearBet, handleDoubleBet, handleSpin, showAutoSpinMenu, stopAutoSpin]);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* ================= SLOT MACHINE CASINO CABINET ================= */}
      <div
        className={`w-full relative rounded-3xl border-6 shadow-[inset_0_0_80px_rgba(0,0,0,0.9),0_20px_50px_rgba(0,0,0,0.7)] p-4 sm:p-7 flex flex-col justify-between transition-all duration-500 overflow-hidden ${
          bonusState.isActive
            ? 'bg-gradient-to-b from-[#2a0e1c] via-[#1f0a15] to-[#0c0409] border-amber-500/80 shadow-[0_0_50px_rgba(234,179,8,0.3)]'
            : 'bg-gradient-to-b from-[#0a2e1d] via-[#072418] to-[#04140d] border-[#361e0b]'
        }`}
      >
        {/* Bonus Round Active Top Banner */}
        {bonusState.isActive && (
          <div className="w-full py-2 px-4 mb-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 border border-amber-400/50 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>BABAK BONUS: {bonusState.freeSpinsRemaining} FREE SPINS SISA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-amber-200 bg-black/50 px-2 py-0.5 rounded border border-amber-400/30">
                PENGGANDA: 2X
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-400">
                Total Menang: {formatCurrency(bonusState.totalBonusWon)}
              </span>
            </div>
          </div>
        )}

        {/* Cabinet Title Lockup */}
        <div className="flex flex-col items-center text-center mb-4 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-black/60 border border-amber-500/30 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-extrabold font-serif-royal tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase">
              POKER SLOT MACHINE ★ 5 REELS
            </h2>
          </div>
          <p className="text-[10px] sm:text-xs text-amber-200/70 font-semibold tracking-wider uppercase">
            Kombinasi Tangan Poker Standar · 3 Kartu As (Scatter) = 5 Free Spins (2x Win)
          </p>
        </div>

        {/* ================= COMPACT LIVE PAYTABLE BAR ================= */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-1 mb-4 z-10">
          <div className="flex items-center gap-1.5 min-w-[700px] justify-between p-2 rounded-xl bg-black/60 border border-white/5 backdrop-blur-md">
            {PAYTABLE.map(entry => {
              const isMatch = lastEvaluation?.handType === entry.type;
              return (
                <div
                  key={entry.type}
                  className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border text-center transition-all flex-1 ${
                    isMatch
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300 ring-2 ring-amber-400/60 scale-105 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">
                    {entry.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-extrabold tabular-nums ${
                      isMatch ? 'text-amber-300' : 'text-slate-300'
                    }`}
                  >
                    x{entry.multiplier}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 5 MECHANICAL REELS ================= */}
        <div className="w-full flex items-center justify-center gap-2 sm:gap-4 my-3 px-2 z-10">
          {reels.map((card, idx) => {
            const isRolling = reelRolling[idx];
            const isWinningCard = lastEvaluation?.winningIndices.includes(idx);
            const isAceScatter = card.rank === 'A';
            const isRedSuit = SUIT_COLORS[card.suit] === 'red';
            const suitSymbol = SUIT_SYMBOLS[card.suit];

            return (
              <div
                key={card.id || idx}
                className={`relative flex-1 max-w-[130px] aspect-[2.5/3.6] rounded-2xl flex flex-col justify-between p-2.5 sm:p-3 transition-all duration-200 select-none shadow-2xl ${
                  isRolling
                    ? 'bg-gradient-to-b from-slate-200 via-white to-slate-200 blur-[0.8px] scale-98 border-2 border-amber-400/50 shadow-inner'
                    : isWinningCard
                    ? 'bg-gradient-to-b from-amber-50 via-white to-amber-100 border-3 border-amber-400 ring-4 ring-amber-400/60 scale-105 shadow-[0_0_25px_rgba(234,179,8,0.8)] z-20'
                    : isAceScatter
                    ? 'bg-gradient-to-b from-white via-amber-50 to-amber-100 border-2 border-amber-400/80 ring-2 ring-amber-400/40 z-10'
                    : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-300/80'
                } ${isRedSuit ? 'text-red-600' : 'text-slate-950'}`}
              >
                {/* Reel Glass Glare Stripe */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/10 rounded-2xl pointer-events-none" />

                {/* Ace Scatter Badge */}
                {isAceScatter && !isRolling && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow border border-amber-300 z-30">
                    SCATTER
                  </div>
                )}

                {/* Top Corner */}
                <div className="flex flex-col items-center leading-none z-10">
                  <span className="font-extrabold text-base sm:text-2xl font-mono tracking-tighter">
                    {card.rank}
                  </span>
                  <span className="text-sm sm:text-lg leading-none">{suitSymbol}</span>
                </div>

                {/* Center Large Emblem */}
                <div className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center text-3xl sm:text-5xl opacity-90 pointer-events-none drop-shadow-sm">
                  {suitSymbol}
                </div>

                {/* Bottom Corner */}
                <div className="flex flex-col items-center leading-none self-end rotate-180 z-10">
                  <span className="font-extrabold text-base sm:text-2xl font-mono tracking-tighter">
                    {card.rank}
                  </span>
                  <span className="text-sm sm:text-lg leading-none">{suitSymbol}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= RESULT BANNER ================= */}
        <div className="flex flex-col items-center justify-center min-h-[52px] my-2 z-10">
          {lastEvaluation ? (
            <div className="flex flex-col items-center gap-0.5 animate-scale-in text-center">
              <span
                className={`text-sm sm:text-base font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-xl border shadow-lg ${
                  lastEvaluation.multiplier > 0
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 border-amber-200'
                    : 'bg-black/60 text-slate-300 border-white/10'
                }`}
              >
                {lastEvaluation.label}
              </span>
              {lastEvaluation.multiplier > 0 && (
                <span className="text-xs sm:text-sm font-mono font-extrabold text-amber-300">
                  Menang:{' '}
                  {formatCurrency(
                    betAmount *
                      lastEvaluation.multiplier *
                      (bonusState.isActive ? bonusState.multiplier : 1)
                  )}{' '}
                  (x{lastEvaluation.multiplier}
                  {bonusState.isActive ? ' · 2x Multiplier' : ''})
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-amber-200/60 font-medium">
              Tekan SPIN untuk memutar 5 gulungan kartu
            </span>
          )}
        </div>
      </div>

      {/* ================= CONTROLS DOCK ================= */}
      <div className="w-full flex flex-col gap-3">
        {/* Chip Selection Rack (disabled during free spins) */}
        {!bonusState.isActive && (
          <ChipRack
            selectedChip={selectedChip}
            onSelectChip={chip => {
              setSelectedChip(chip);
              setBetAmount(chip);
            }}
            balance={balance}
            showToast={showToast}
            disabled={isSpinning}
          />
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-md shadow-xl flex-wrap sm:flex-nowrap">
          {/* Bet Display */}
          <div className="flex items-center gap-3 px-4 py-2 bg-black/50 rounded-xl border border-white/5">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Taruhan:
            </span>
            <span className="text-lg font-mono font-extrabold text-amber-400 tabular-nums">
              {formatCurrency(betAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {!bonusState.isActive && !isAutoSpinActive && (
              <>
                {/* Reset / Min Bet */}
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={handleClearBet}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
                  title="Atur taruhan ke minimal [Shortcut: C]"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Min Bet</span>
                </button>

                {/* Double Bet (2x) */}
                <button
                  type="button"
                  disabled={isSpinning || balance < betAmount * 2}
                  onClick={handleDoubleBet}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
                  title="Gandakan taruhan saat ini (2x) [Shortcut: D]"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2x</span>
                </button>
              </>
            )}

            {/* AUTO SPIN BUTTON / DROPDOWN */}
            {!bonusState.isActive && (
              <div className="relative">
                {isAutoSpinActive ? (
                  <button
                    type="button"
                    onClick={() => stopAutoSpin('Auto Spin dihentikan manual.')}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 cursor-pointer border border-red-400/40 animate-pulse"
                    title="Hentikan Auto Spin [Shortcut: A / Esc / Space]"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>STOP ({autoSpinRemaining === 'inf' ? '∞' : autoSpinRemaining})</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSpinning}
                      onClick={() => setShowAutoSpinMenu(prev => !prev)}
                      className={`flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow cursor-pointer active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed ${
                        showAutoSpinMenu
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'text-amber-300 bg-slate-800 hover:bg-slate-700 border-amber-500/40 hover:border-amber-400'
                      }`}
                      title="Pilih putaran otomatis [Shortcut: A]"
                    >
                      <Repeat className="w-3.5 h-3.5 text-amber-400" />
                      <span>Auto</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          showAutoSpinMenu ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showAutoSpinMenu && (
                      <div className="absolute bottom-full mb-2 right-0 w-60 bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-3 shadow-2xl z-40 backdrop-blur-xl animate-fade-in text-slate-100">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Repeat className="w-3.5 h-3.5 text-amber-400" />
                            Auto Spin
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAutoSpinMenu(false)}
                            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 font-medium">
                          Pilih jumlah putaran:
                        </p>
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {[10, 25, 50, 100].map(count => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => startAutoSpin(count)}
                              className="py-1.5 px-1 rounded-lg bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all text-center cursor-pointer active:scale-95 shadow-sm"
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => startAutoSpin('inf')}
                          className="w-full py-1.5 px-2 rounded-lg bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all text-center cursor-pointer active:scale-95 shadow-sm mb-2"
                        >
                          ∞ Tanpa Batas
                        </button>
                        <div className="text-[9px] text-slate-400 text-center leading-tight">
                          Otomatis berhenti saat 3 As (Bonus) atau saldo habis.
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SPIN BUTTON / STOP BUTTON */}
            <button
              type="button"
              disabled={
                (!isAutoSpinActive && isSpinning) ||
                (!bonusState.isActive && (betAmount === 0 || balance < betAmount))
              }
              onClick={isAutoSpinActive ? () => stopAutoSpin('Auto Spin dihentikan.') : handleSpin}
              className={`flex-1 sm:flex-none min-w-[160px] flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shadow-xl active:scale-95 ${
                isAutoSpinActive
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : bonusState.isActive
                  ? 'bg-gradient-to-r from-red-500 via-amber-500 to-amber-600 hover:from-red-400 hover:to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_4px_16px_rgba(234,179,8,0.4)]'
              }`}
            >
              {isAutoSpinActive ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>STOP AUTO ({autoSpinRemaining === 'inf' ? '∞' : autoSpinRemaining})</span>
                  <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-white bg-red-800/80 px-1.5 py-0.2 rounded border border-red-400/40">
                    A / Esc
                  </kbd>
                </>
              ) : isSpinning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>ROLLING...</span>
                </>
              ) : bonusState.isActive ? (
                <>
                  <Flame className="w-4 h-4 fill-slate-950" />
                  <span>FREE SPIN ({bonusState.freeSpinsRemaining})</span>
                  <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-slate-950 bg-amber-300/90 px-1.5 py-0.2 rounded border border-amber-600/30">
                    Space
                  </kbd>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>SPIN REELS</span>
                  <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-slate-950 bg-amber-300/90 px-1.5 py-0.2 rounded border border-amber-600/30">
                    Space
                  </kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Activation Celebration Modal */}
      {showBonusCelebration && (
        <div
          onClick={() => setShowBonusCelebration(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-md bg-gradient-to-b from-amber-950 via-slate-900 to-black border-2 border-amber-400 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center">
              <Gift className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>

            <h3 className="text-2xl font-black font-serif-royal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase mb-1">
              3 AS SCATTER!
            </h3>
            <p className="text-xs uppercase tracking-widest text-amber-300/80 font-bold mb-4">
              Babak Bonus Free Spins Diaktifkan
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 mb-5 space-y-1">
              <span className="text-3xl font-mono font-black text-amber-400 block">
                5 PUTARAN GRATIS
              </span>
              <span className="text-xs font-semibold text-emerald-400 block">
                Semua kemenangan dikalikan 2X Multiplier!
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowBonusCelebration(false)}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-xl cursor-pointer transition-all active:scale-95"
            >
              Mulai 5 Free Spins
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
