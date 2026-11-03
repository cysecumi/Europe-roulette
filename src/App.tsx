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
import { ChipRack } from './components/ChipRack';
import { ControlDock } from './components/ControlDock';
import { HistoryTray } from './components/HistoryTray';
import { StatsModal } from './components/StatsModal';
import { WinModal } from './components/WinModal';
import { TopUpModal } from './components/TopUpModal';
import { HotkeysModal } from './components/HotkeysModal';
import {
  evaluateRoundOutcome,
  formatCurrency,
  getColor,
  WHEEL_NUMBERS
} from './utils/rouletteEngine';
import { PlusCircle, Sparkles, VolumeX, Keyboard } from 'lucide-react';

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

  const [currentBets, setCurrentBets] = useState<Record<BetId, number>>({} as Record<BetId, number>);
  const [previousBets, setPreviousBets] = useState<Record<BetId, number>>({} as Record<BetId, number>);
  const [betHistoryLog, setBetHistoryLog] = useState<BetHistoryEntry[]>([]);
  const [selectedChip, setSelectedChip] = useState<ChipValue>(25);

  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [targetNumber, setTargetNumber] = useState<number | null>(26);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [animationMode, setAnimationMode] = useState<'4block' | 'wheel'>('4block');
  const [activeGame, setActiveGame] = useState<'roulette' | 'blackjack'>('blackjack');

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

    // Pick fair random European pocket
    const winIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const winNumber = WHEEL_NUMBERS[winIndex];

    setTargetNumber(winNumber);
    setPhase('SPINNING');
    setIsWinModalOpen(false);
  }, [phase, totalBet]);

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
        const idx = CHIP_VALUES.indexOf(prev);
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
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/50 text-slate-100 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-fade-in">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[1400px] flex flex-col gap-4 sm:gap-6">
        {/* ================= HEADER / TOP BAR ================= */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-4 px-5 py-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
          {/* Zone 1: Brand & Game Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-2xl shadow-lg border border-amber-300/40">
                {activeGame === 'blackjack' ? '♠️' : '🎰'}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif-royal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 leading-tight">
                  {activeGame === 'blackjack' ? 'Blackjack Royale' : 'Roulette Royale'}
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-amber-300/70 font-semibold uppercase tracking-wider">
                  <span>{activeGame === 'blackjack' ? 'Classic Casino Blackjack' : 'European Single Zero'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeGame === 'blackjack' ? 'Pays 3 to 2' : '37 Pockets'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <VolumeX className="w-3 h-3" /> Mode Hening
                  </span>
                </div>
              </div>
            </div>

            {/* Game Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-black/60 rounded-2xl border border-amber-500/25 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveGame('blackjack')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGame === 'blackjack'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>♠️</span>
                <span>Blackjack</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGame('roulette')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGame === 'roulette'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🎰</span>
                <span>Roulette</span>
              </button>
            </div>
          </div>

          {/* Zone 2: Informational / Status banner */}
          {lastResult && phase === 'RESULT' && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-xs text-slate-400 font-medium">Putaran Terakhir:</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs text-white shadow ${
                  lastResult.color === 'green'
                    ? 'bg-emerald-600'
                    : lastResult.color === 'red'
                    ? 'bg-red-600'
                    : 'bg-zinc-900 border border-zinc-700'
                }`}
              >
                {lastResult.winningNumber}
              </div>
              <span
                className={`text-xs font-bold ${
                  lastResult.totalWon > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {lastResult.totalWon > 0
                  ? `Menang +${formatCurrency(lastResult.totalWon)}`
                  : 'Tidak ada kemenangan'}
              </span>
            </div>
          )}

          {/* Zone 3: Balance & Top-Up */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end px-4 py-1.5 rounded-2xl bg-black/50 border border-amber-500/20 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Total Saldo
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400 tabular-nums drop-shadow-sm">
                {formatCurrency(balance)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsHotkeysOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shadow-md active:scale-95"
              title="Lihat daftar shortcut keyboard [Tekan K atau ?]"
            >
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Hotkeys</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all cursor-pointer shadow-md active:scale-95"
              title="Isi saldo kredit meja"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Isi Saldo</span>
            </button>
          </div>
        </header>

        {/* ================= MAIN ARENA ================= */}
        {activeGame === 'blackjack' ? (
          <main className="w-full max-w-4xl mx-auto">
            <BlackjackTable
              balance={balance}
              onUpdateBalance={setBalance}
              showToast={showToast}
            />
          </main>
        ) : (
          <main className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">
            {/* LEFT: Roulette Studio / 4-Block Display */}
            <section className="flex flex-col items-center gap-3.5 p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Animation Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/5 w-full">
                <button
                  type="button"
                  onClick={() => setAnimationMode('4block')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    animationMode === '4block'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
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
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Roda Klasik
                </button>
              </div>

              {/* Visual Centerpiece (4-Block Kombinasi or Classic Canvas Wheel) */}
              <div className="w-full flex items-center justify-center py-1 min-h-[420px]">
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
              <div className="w-full text-center py-2 px-4 rounded-xl bg-black/40 border border-white/5 min-h-[44px] flex items-center justify-center">
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
                    Pilih chip di bawah dan letakkan taruhan Anda pada meja
                  </span>
                )}
              </div>
            </section>

            {/* RIGHT: Casino Table & Control Center */}
            <section className="flex flex-col gap-4">
              {/* European Table Felt */}
              <BettingTable
                bets={currentBets}
                onPlaceBet={handlePlaceBet}
                onRemoveBet={handleRemoveBet}
                disabled={phase === 'SPINNING'}
                winningNumber={phase === 'RESULT' && lastResult ? lastResult.winningNumber : null}
                winningBetIds={phase === 'RESULT' && lastResult ? lastResult.winningBetIds : []}
              />

              {/* Chip Selection Rack */}
              <ChipRack
                selectedChip={selectedChip}
                onSelectChip={setSelectedChip}
                disabled={phase === 'SPINNING'}
              />

              {/* Control Dock (Undo, Clear, Double, Rebet, SPIN) */}
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
          </main>
        )}
      </div>

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
    </div>
  );
}
