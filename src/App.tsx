/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BetHistoryEntry, BetId, ChipValue, GamePhase, HistoryItem, SessionStats, SpinResult } from './types/roulette';
import { RouletteWheel } from './components/RouletteWheel';
import { FourBlockAnimation } from './components/FourBlockAnimation';
import { BettingTable } from './components/BettingTable';
import { BlackjackTable } from './components/BlackjackTable';
import { PokerSlotTable } from './components/PokerSlotTable';
import { BaccaratTable } from './components/BaccaratTable';
import { MegaWheelTable } from './components/MegaWheelTable';
import { SicBoTable } from './components/SicBoTable';
import { PlinkoTable } from './components/PlinkoTable';
import { ChipRack } from './components/ChipRack';
import { ControlDock } from './components/ControlDock';
import { HistoryTray } from './components/HistoryTray';
import { StatsModal } from './components/StatsModal';
import { WinModal } from './components/WinModal';
import { TopUpModal } from './components/TopUpModal';
import { HotkeysModal } from './components/HotkeysModal';
import { BottomSettingsPanel } from './components/BottomSettingsPanel';
import { ParticleOverlay } from './components/ParticleOverlay';
import {
  evaluateRoundOutcome,
  formatCurrency,
  getColor,
  WHEEL_NUMBERS
} from './utils/rouletteEngine';
import { PlusCircle, Sparkles, Keyboard, Volume2, VolumeX } from 'lucide-react';
import { getSoundEnabled, toggleSound } from './utils/soundEngine';

const CHIP_VALUES: ChipValue[] = [5, 10, 25, 50, 100, 500];

const INITIAL_HISTORY: HistoryItem[] = [
  { number: 26, color: 'black', isEven: true, isHigh: true, timestamp: Date.now() - 600000 },
  { number: 7, color: 'red', isEven: false, isHigh: false, timestamp: Date.now() - 500000 },
  { number: 18, color: 'red', isEven: true, isHigh: false, timestamp: Date.now() - 400000 },
  { number: 0, color: 'green', isEven: false, isHigh: false, timestamp: Date.now() - 300000 },
  { number: 32, color: 'red', isEven: true, isHigh: true, timestamp: Date.now() - 200000 },
  { number: 15, color: 'black', isEven: false, isHigh: false, timestamp: Date.now() - 100000 }
];

export default function App() {
  // Local storage persisted balance
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('rr_balance');
    return saved !== null ? parseInt(saved, 10) : 1000;
  });

  // Real-time Win Rate (0% - 100%) applied across all games
  const [winRate, setWinRate] = useState<number>(() => {
    const saved = localStorage.getItem('rr_win_rate');
    return saved !== null ? Math.max(0, Math.min(100, parseInt(saved, 10))) : 50;
  });

  const [soundOn, setSoundOn] = useState<boolean>(() => getSoundEnabled());
  const handleToggleSound = useCallback(() => {
    const next = toggleSound();
    setSoundOn(next);
  }, []);

  const [currentBets, setCurrentBets] = useState<Record<BetId, number>>({} as Record<BetId, number>);
  const [previousBets, setPreviousBets] = useState<Record<BetId, number>>({} as Record<BetId, number>);
  const [betHistoryLog, setBetHistoryLog] = useState<BetHistoryEntry[]>([]);
  const [selectedChip, setSelectedChip] = useState<number>(25);

  const [particleTrigger, setParticleTrigger] = useState<boolean>(false);
  const triggerParticles = useCallback(() => {
    setParticleTrigger(prev => !prev);
  }, []);

  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [targetNumber, setTargetNumber] = useState<number | null>(26);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [animationMode, setAnimationMode] = useState<'4block' | 'wheel'>('4block');
  const [activeGame, setActiveGame] = useState<'roulette' | 'blackjack' | 'pokerSlot' | 'baccarat' | 'megaWheel' | 'sicBo' | 'plinko'>('pokerSlot');

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('rr_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_HISTORY;
      }
    }
    return INITIAL_HISTORY;
  });

  const [stats, setStats] = useState<SessionStats>(() => {
    const saved = localStorage.getItem('rr_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      totalSpins: 6,
      totalWagered: 150,
      totalWon: 220,
      highestWin: 120,
      redCount: 3,
      blackCount: 2,
      greenCount: 1,
      evenCount: 3,
      oddCount: 2,
      numberFrequencies: { 26: 1, 7: 1, 18: 1, 0: 1, 32: 1, 15: 1 }
    };
  });

  // UI Dialog states
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);

  // Sync balance to local storage
  useEffect(() => {
    localStorage.setItem('rr_balance', String(balance));
  }, [balance]);

  // Sync history to local storage
  useEffect(() => {
    localStorage.setItem('rr_history', JSON.stringify(history));
  }, [history]);

  // Sync stats to local storage
  useEffect(() => {
    localStorage.setItem('rr_stats', JSON.stringify(stats));
  }, [stats]);

  // Sync winRate to local storage
  useEffect(() => {
    localStorage.setItem('rr_win_rate', String(winRate));
  }, [winRate]);

  const showToast = useCallback((msg: string, icon = '⚠️') => {
    setToast({ msg, icon });
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, []);

  const totalBet = useMemo(() => {
    return Object.values(currentBets).reduce((acc, curr) => acc + (curr || 0), 0);
  }, [currentBets]);

  // Handlers for placing bets
  const handlePlaceBet = useCallback(
    (id: BetId) => {
      if (phase === 'SPINNING') return;

      if (balance < selectedChip) {
        showToast('Saldo tidak mencukupi untuk chip ini!', '💳');
        setIsTopUpOpen(true);
        return;
      }

      setBalance(prev => prev - selectedChip);
      setCurrentBets(prev => ({
        ...prev,
        [id]: (prev[id] || 0) + selectedChip
      }));
      setBetHistoryLog(prev => [...prev, { id, amount: selectedChip }]);
    },
    [balance, phase, selectedChip, showToast]
  );

  const handleRemoveBet = useCallback(
    (id: BetId) => {
      if (phase === 'SPINNING' || !currentBets[id]) return;

      const refundAmount = Math.min(selectedChip, currentBets[id]);
      setBalance(prev => prev + refundAmount);

      setCurrentBets(prev => {
        const next = { ...prev };
        next[id] -= refundAmount;
        if (next[id] <= 0) {
          delete next[id];
        }
        return next;
      });

      // Remove from history log
      setBetHistoryLog(prev => {
        const copy = [...prev];
        const lastIdx = copy.map(b => b.id).lastIndexOf(id);
        if (lastIdx !== -1) {
          copy.splice(lastIdx, 1);
        }
        return copy;
      });
    },
    [currentBets, phase, selectedChip]
  );

  const handleUndo = useCallback(() => {
    if (phase === 'SPINNING' || betHistoryLog.length === 0) return;

    const lastEntry = betHistoryLog[betHistoryLog.length - 1];
    setBetHistoryLog(prev => prev.slice(0, -1));

    setCurrentBets(prev => {
      const next = { ...prev };
      next[lastEntry.id] -= lastEntry.amount;
      if (next[lastEntry.id] <= 0) {
        delete next[lastEntry.id];
      }
      return next;
    });

    setBalance(prev => prev + lastEntry.amount);
  }, [betHistoryLog, phase]);

  const handleClear = useCallback(() => {
    if (phase === 'SPINNING' || totalBet === 0) return;

    setBalance(prev => prev + totalBet);
    setCurrentBets({} as Record<BetId, number>);
    setBetHistoryLog([]);
    showToast('Semua taruhan dibersihkan.', '🧹');
  }, [phase, showToast, totalBet]);

  const handleDouble = useCallback(() => {
    if (phase === 'SPINNING' || totalBet === 0) return;

    if (balance < totalBet) {
      showToast('Saldo tidak cukup untuk menggandakan taruhan!', '💳');
      return;
    }

    setBalance(prev => prev - totalBet);
    setCurrentBets(prev => {
      const doubled: Record<BetId, number> = {} as Record<BetId, number>;
      for (const [id, amt] of Object.entries(prev)) {
        doubled[id as BetId] = amt * 2;
      }
      return doubled;
    });

    // Record double action entries in log
    setBetHistoryLog(prev => [
      ...prev,
      ...Object.entries(currentBets).map(([id, amt]) => ({
        id: id as BetId,
        amount: amt
      }))
    ]);

    showToast('Taruhan digandakan (2x).', '⚡');
  }, [balance, currentBets, phase, showToast, totalBet]);

  const handleRebet = useCallback(() => {
    if (phase === 'SPINNING' || Object.keys(previousBets).length === 0) return;

    const needed = Object.values(previousBets).reduce((acc, c) => acc + c, 0);
    if (balance < needed) {
      showToast('Saldo tidak cukup untuk Rebet!', '💳');
      return;
    }

    // Refund any current active bets
    if (totalBet > 0) {
      setBalance(prev => prev + totalBet);
    }

    setBalance(prev => prev - needed);
    setCurrentBets({ ...previousBets });

    setBetHistoryLog(
      Object.entries(previousBets).map(([id, amount]) => ({
        id: id as BetId,
        amount
      }))
    );

    showToast('Taruhan putaran sebelumnya diulang.', '🔄');
  }, [balance, phase, previousBets, showToast, totalBet]);

  const handleSpin = useCallback(() => {
    if (phase === 'SPINNING' || totalBet === 0) return;

    const shouldWin = Math.random() * 100 < winRate;

    // Check which pockets yield positive return for the current placed bets
    const winningNumbers: number[] = [];
    const losingNumbers: number[] = [];

    for (const num of WHEEL_NUMBERS) {
      const outcome = evaluateRoundOutcome(currentBets, num);
      if (outcome.totalWon > 0) {
        winningNumbers.push(num);
      } else {
        losingNumbers.push(num);
      }
    }

    let winNumber: number;
    if (shouldWin && winningNumbers.length > 0) {
      winNumber = winningNumbers[Math.floor(Math.random() * winningNumbers.length)];
    } else if (!shouldWin && losingNumbers.length > 0) {
      winNumber = losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
    } else {
      const winIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
      winNumber = WHEEL_NUMBERS[winIndex];
    }

    setTargetNumber(winNumber);
    setPhase('SPINNING');
    setIsWinModalOpen(false);
  }, [currentBets, phase, totalBet, winRate]);

  const handleSpinComplete = useCallback(
    (winningNumber: number) => {
      const outcome = evaluateRoundOutcome(currentBets, winningNumber);
      setLastResult(outcome);

      // Return winnings to player balance
      if (outcome.totalWon > 0) {
        setBalance(prev => prev + outcome.totalWon);
      }

      // Save for rebet
      setPreviousBets({ ...currentBets });

      // Record to history
      const newHistoryItem: HistoryItem = {
        number: winningNumber,
        color: getColor(winningNumber),
        isEven: winningNumber !== 0 && winningNumber % 2 === 0,
        isHigh: winningNumber >= 19,
        timestamp: Date.now()
      };

      setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);

      // Update session statistics
      setStats(prev => {
        const nextSpins = prev.totalSpins + 1;
        const nextWagered = prev.totalWagered + outcome.totalWagered;
        const nextWon = prev.totalWon + outcome.totalWon;
        const nextHighest = Math.max(prev.highestWin, outcome.totalWon);

        const isRedColor = getColor(winningNumber) === 'red';
        const isBlackColor = getColor(winningNumber) === 'black';
        const isGreenColor = winningNumber === 0;

        const nextFrequencies = {
          ...prev.numberFrequencies,
          [winningNumber]: (prev.numberFrequencies[winningNumber] || 0) + 1
        };

        return {
          totalSpins: nextSpins,
          totalWagered: nextWagered,
          totalWon: nextWon,
          highestWin: nextHighest,
          redCount: prev.redCount + (isRedColor ? 1 : 0),
          blackCount: prev.blackCount + (isBlackColor ? 1 : 0),
          greenCount: prev.greenCount + (isGreenColor ? 1 : 0),
          evenCount: prev.evenCount + (winningNumber !== 0 && winningNumber % 2 === 0 ? 1 : 0),
          oddCount: prev.oddCount + (winningNumber !== 0 && winningNumber % 2 !== 0 ? 1 : 0),
          numberFrequencies: nextFrequencies
        };
      });

      // Clear current table
      setCurrentBets({} as Record<BetId, number>);
      setBetHistoryLog([]);
      setPhase('RESULT');
      triggerParticles();

      // Trigger celebratory modal if player won
      if (outcome.totalWon > 0) {
        setIsWinModalOpen(true);
      } else {
        showToast(
          `Hasil: ${winningNumber} (${getColor(winningNumber).toUpperCase()}) - Tidak ada kemenangan`,
          '🎰'
        );
      }
    },
    [currentBets, showToast]
  );

  const handleResetStats = useCallback(() => {
    setStats({
      totalSpins: 0,
      totalWagered: 0,
      totalWon: 0,
      highestWin: 0,
      redCount: 0,
      blackCount: 0,
      greenCount: 0,
      evenCount: 0,
      oddCount: 0,
      numberFrequencies: {}
    });
    setHistory([]);
    setIsStatsOpen(false);
    showToast('Statistik sesi berhasil direset.', '✨');
  }, [showToast]);

  const handleAddFunds = useCallback(
    (amount: number) => {
      setBalance(prev => prev + amount);
      showToast(`Saldo bertambah ${formatCurrency(amount)}`, '💰');
    },
    [showToast]
  );

  const cycleChip = useCallback(
    (direction: number) => {
      setSelectedChip(prev => {
        const idx = CHIP_VALUES.indexOf(prev as ChipValue);
        let nextIdx = idx + direction;
        if (nextIdx < 0) nextIdx = CHIP_VALUES.length - 1;
        if (nextIdx >= CHIP_VALUES.length) nextIdx = 0;
        const nextVal = CHIP_VALUES[nextIdx];
        showToast(`Chip dipilih: $${nextVal}`, '🪙');
        return nextVal;
      });
    },
    [showToast]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an editable field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // If a modal is open, let modals handle their keys or close on Escape
      if (isStatsOpen || isTopUpOpen || isWinModalOpen || isHotkeysOpen) {
        if (e.key === 'Escape') {
          setIsStatsOpen(false);
          setIsTopUpOpen(false);
          setIsWinModalOpen(false);
          setIsHotkeysOpen(false);
        }
        return;
      }

      // Hotkey to open shortcuts modal: '?' or 'k'
      if (e.key === '?' || (e.key.toLowerCase() === 'k' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setIsHotkeysOpen(true);
        return;
      }

      // If active game is Blackjack, let BlackjackTable handle its internal keys
      if (activeGame !== 'roulette') {
        return;
      }

      // Quick Spin: Space or Enter
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (phase !== 'SPINNING') {
          if (totalBet > 0) {
            handleSpin();
          } else {
            showToast('Pasang taruhan terlebih dahulu!', '☝️');
          }
        }
        return;
      }

      // Number keys 0-9 to place bets on specific table sections
      if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const numToBetMap: Record<string, BetId> = {
          '0': 'n-0',
          '1': 'dozen1',
          '2': 'dozen2',
          '3': 'dozen3',
          '4': 'low',
          '5': 'even',
          '6': 'red',
          '7': 'black',
          '8': 'odd',
          '9': 'high'
        };

        if (numToBetMap[e.key]) {
          e.preventDefault();
          handlePlaceBet(numToBetMap[e.key]);
          return;
        }
      }

      // Chip selection with Shift + 1..6
      if (e.shiftKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (CHIP_VALUES[idx]) {
          setSelectedChip(CHIP_VALUES[idx]);
          showToast(`Chip dipilih: $${CHIP_VALUES[idx]}`, '🪙');
        }
        return;
      }

      // Arrow keys / brackets to cycle chips
      if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        cycleChip(-1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        cycleChip(1);
        return;
      }

      // Table Action Hotkeys
      const lower = e.key.toLowerCase();
      if (lower === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (lower === 'c' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
        return;
      }
      if (lower === 'd' || lower === 'x') {
        e.preventDefault();
        handleDouble();
        return;
      }
      if (lower === 'r') {
        e.preventDefault();
        handleRebet();
        return;
      }
      if (lower === 'a') {
        e.preventDefault();
        if (balance > 0 && phase !== 'SPINNING') {
          setSelectedChip(balance);
          showToast(`ALL IN! Chip diset ke $${balance.toLocaleString()}`, '🔥');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    phase,
    totalBet,
    handleSpin,
    handlePlaceBet,
    handleUndo,
    handleClear,
    handleDouble,
    handleRebet,
    cycleChip,
    showToast,
    isStatsOpen,
    isTopUpOpen,
    isWinModalOpen,
    isHotkeysOpen,
    activeGame
  ]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-radial from-slate-950 via-zinc-950 to-black text-slate-100 select-none relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/50 text-slate-100 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-fade-in">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ================= FIXED HEADER ================= */}
      <header className="flex-none z-30 px-4 sm:px-8 py-3 bg-black/90 backdrop-blur-2xl border-b border-amber-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Zone 1: Brand & Game Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(251,191,36,0.5)] border border-amber-300/60">
              {activeGame === 'pokerSlot' ? '🃏' : activeGame === 'blackjack' ? '♠️' : activeGame === 'roulette' ? '🎰' : activeGame === 'baccarat' ? '🎴' : activeGame === 'megaWheel' ? '🎡' : activeGame === 'sicBo' ? '🎲' : '🔴'}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-serif-royal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 leading-tight">
                {activeGame === 'pokerSlot'
                  ? 'Poker Slot Machine'
                  : activeGame === 'blackjack'
                  ? 'Blackjack Royale'
                  : activeGame === 'roulette'
                  ? 'Roulette Royale'
                  : activeGame === 'baccarat'
                  ? 'Baccarat Royale'
                  : activeGame === 'megaWheel'
                  ? 'Mega Wheel Fortune'
                  : activeGame === 'sicBo'
                  ? 'Sic Bo / Dice Royale'
                  : 'Plinko Arcade Physics'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-amber-300/80 font-semibold uppercase tracking-wider">
                <span>
                  {activeGame === 'pokerSlot'
                    ? '5 Reels'
                    : activeGame === 'blackjack'
                    ? 'Classic Blackjack'
                    : activeGame === 'roulette'
                    ? 'European Zero'
                    : activeGame === 'baccarat'
                    ? 'Player vs Banker'
                    : activeGame === 'megaWheel'
                    ? 'Multiplier x1000'
                    : activeGame === 'sicBo'
                    ? 'Dice Casino'
                    : '2D Canvas Physics'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-fuchsia-300">Win Rate Integrated</span>
              </div>
            </div>
          </div>

          {/* Game Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/80 rounded-2xl border border-amber-500/30 shadow-inner overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveGame('pokerSlot')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'pokerSlot'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🃏</span>
              <span className="hidden sm:inline">Poker Slot</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame('blackjack')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'blackjack'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>♠️</span>
              <span className="hidden sm:inline">Blackjack</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame('roulette')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'roulette'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎰</span>
              <span className="hidden sm:inline">Roulette</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame('baccarat')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'baccarat'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎴</span>
              <span className="hidden sm:inline">Baccarat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame('megaWheel')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'megaWheel'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎡</span>
              <span className="hidden sm:inline">Mega Wheel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame('sicBo')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'sicBo'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎲</span>
              <span className="hidden sm:inline">Sic Bo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGame('plinko')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'plinko'
                  ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔴</span>
              <span className="hidden sm:inline">Plinko</span>
            </button>
          </div>
        </div>

        {/* Zone 3: Balance & Top-Up */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-end px-3.5 py-1 rounded-2xl bg-black/70 border border-amber-500/30 shadow-inner">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">
              Saldo Aktif
            </span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-400 tabular-nums">
              {formatCurrency(balance)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsHotkeysOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shadow-md active:scale-95"
            title="Daftar shortcut keyboard"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition-all cursor-pointer shadow-md active:scale-95"
            title="Isi Saldo"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Isi Saldo</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 border ${
              soundOn
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
            title={soundOn ? 'Suara Aktif' : 'Suara Mati'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* ================= MAIN SCROLLABLE ARENA ================= */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-[1600px] w-full mx-auto flex flex-col items-center justify-start pb-44">
        {activeGame === 'pokerSlot' ? (
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-zinc-950/80 border border-amber-500/30 p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <PokerSlotTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
              winRate={winRate}
              onTriggerParticles={triggerParticles}
            />
          </div>
        ) : activeGame === 'blackjack' ? (
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-zinc-950/80 border border-amber-500/30 p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <BlackjackTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
              winRate={winRate}
              onTriggerParticles={triggerParticles}
            />
          </div>
        ) : activeGame === 'baccarat' ? (
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-zinc-950/80 border border-amber-500/30 p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <BaccaratTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
              winRate={winRate}
              onTriggerParticles={triggerParticles}
            />
          </div>
        ) : activeGame === 'megaWheel' ? (
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-zinc-950/80 border border-amber-500/30 p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <MegaWheelTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
              winRate={winRate}
              onTriggerParticles={triggerParticles}
            />
          </div>
        ) : activeGame === 'sicBo' ? (
          <div className="w-full max-w-4xl mx-auto rounded-3xl bg-zinc-950/80 border border-amber-500/30 p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <SicBoTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
              winRate={winRate}
              onTriggerParticles={triggerParticles}
            />
          </div>
        ) : activeGame === 'plinko' ? (
          <div className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/80 border border-amber-500/30 p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <PlinkoTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
              winRate={winRate}
              onTriggerParticles={triggerParticles}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start w-full max-w-7xl mx-auto">
            {/* LEFT: Roulette Studio / 4-Block Display */}
            <section className="flex flex-col items-center gap-3.5 p-5 rounded-3xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
              {/* Animation Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-black/60 rounded-xl border border-white/10 w-full">
                <button
                  type="button"
                  onClick={() => setAnimationMode('4block')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    animationMode === '4block'
                      ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4-Block Kombinasi
                </button>
                <button
                  type="button"
                  onClick={() => setAnimationMode('wheel')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    animationMode === 'wheel'
                      ? 'bg-purple-950/80 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Roda Klasik
                </button>
              </div>

              {/* Visual Centerpiece */}
              <div className="w-full flex items-center justify-center py-1 min-h-[400px]">
                {animationMode === '4block' ? (
                  <FourBlockAnimation
                    phase={phase}
                    targetNumber={targetNumber}
                    onSpinComplete={handleSpinComplete}
                  />
                ) : (
                  <RouletteWheel
                    phase={phase}
                    targetNumber={targetNumber}
                    onSpinComplete={handleSpinComplete}
                  />
                )}
              </div>

              {/* Rolling History Tray */}
              <div className="w-full">
                <HistoryTray history={history} onOpenStats={() => setIsStatsOpen(true)} />
              </div>

              {/* Spin Status Message */}
              <div className="w-full text-center py-2 px-4 rounded-xl bg-black/60 border border-amber-500/20 min-h-[44px] flex items-center justify-center">
                {phase === 'SPINNING' ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Roda sedang berputar... Semoga beruntung!</span>
                  </div>
                ) : lastResult && phase === 'RESULT' ? (
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-slate-400">Hasil:</span>
                    <span
                      className={`font-bold uppercase ${
                        lastResult.color === 'red'
                          ? 'text-red-400'
                          : lastResult.color === 'black'
                          ? 'text-slate-200'
                          : 'text-emerald-400'
                      }`}
                    >
                      {lastResult.winningNumber} ({lastResult.color})
                    </span>
                    <span className="text-slate-500">·</span>
                    <span
                      className={`font-bold ${
                        lastResult.totalWon > 0 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {lastResult.totalWon > 0
                        ? `MENANG ${formatCurrency(lastResult.totalWon)} 🎉`
                        : 'Coba lagi putaran berikutnya'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    Pilih chip dan letakkan taruhan pada meja
                  </span>
                )}
              </div>
            </section>

            {/* RIGHT: Casino Table & Control Center with Side-Mounted Vertical Chip Selector on Desktop/Tablet */}
            <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
              <section className="flex flex-col gap-4 flex-1 w-full">
                {/* European Table Felt */}
                <BettingTable
                  bets={currentBets}
                  onPlaceBet={handlePlaceBet}
                  onRemoveBet={handleRemoveBet}
                  disabled={phase === 'SPINNING'}
                  winningNumber={phase === 'RESULT' && lastResult ? lastResult.winningNumber : null}
                  winningBetIds={phase === 'RESULT' && lastResult ? lastResult.winningBetIds : []}
                />

                {/* Horizontal Chip Selection Rack (for mobile) */}
                <div className="block lg:hidden w-full">
                  <ChipRack
                    selectedChip={selectedChip}
                    onSelectChip={setSelectedChip}
                    balance={balance}
                    showToast={showToast}
                    disabled={phase === 'SPINNING'}
                    orientation="horizontal"
                  />
                </div>

                {/* Control Dock */}
                <ControlDock
                  totalBet={totalBet}
                  canUndo={betHistoryLog.length > 0}
                  canClear={totalBet > 0}
                  canDouble={totalBet > 0 && balance >= totalBet}
                  canRebet={Object.keys(previousBets).length > 0}
                  isSpinning={phase === 'SPINNING'}
                  onUndo={handleUndo}
                  onClear={handleClear}
                  onDouble={handleDouble}
                  onRebet={handleRebet}
                  onSpin={handleSpin}
                />
              </section>

              {/* Side-Mounted Vertical Chip Selector on Desktop/Tablet */}
              <div className="hidden lg:block sticky top-6">
                <ChipRack
                  selectedChip={selectedChip}
                  onSelectChip={setSelectedChip}
                  balance={balance}
                  showToast={showToast}
                  disabled={phase === 'SPINNING'}
                  orientation="vertical"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Settings Panel (Peluang Menang / Win Rate) */}
      <BottomSettingsPanel
        winRate={winRate}
        onWinRateChange={setWinRate}
      />

      {/* Modals */}
      <WinModal
        isOpen={isWinModalOpen}
        result={lastResult}
        onClose={() => setIsWinModalOpen(false)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        history={history}
        totalSpins={stats.totalSpins}
        totalWagered={stats.totalWagered}
        highestWin={stats.highestWin}
        onResetStats={handleResetStats}
      />

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onAddFunds={handleAddFunds}
      />

      <HotkeysModal
        isOpen={isHotkeysOpen}
        onClose={() => setIsHotkeysOpen(false)}
      />

      <ParticleOverlay trigger={particleTrigger} />
    </div>
  );
}
