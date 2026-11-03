import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Hand, HandResult, BlackjackPhase } from '../types/blackjack';
import { ChipValue } from '../types/roulette';
import { PlayingCard } from './PlayingCard';
import { ChipRack } from './ChipRack';
import {
  calculateHandScore,
  createDeck,
  evaluateHandOutcome
} from '../utils/blackjackEngine';
import { formatCurrency } from '../utils/rouletteEngine';
import { Play, RotateCcw, ShieldCheck, Sparkles, Plus, Hand as HandIcon, Layers, History, Trash2, ArrowUpCircle } from 'lucide-react';

interface BlackjackTableProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  showToast: (msg: string, icon?: string) => void;
  winRate?: number;
  onTriggerParticles?: () => void;
}

export const BlackjackTable: React.FC<BlackjackTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate = 50,
  onTriggerParticles
}) => {
  const [deck, setDeck] = useState<Card[]>(() => createDeck(6));
  const [phase, setPhase] = useState<BlackjackPhase>('BETTING');
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [previousBet, setPreviousBet] = useState<number>(50);

  // Hands
  const [playerHands, setPlayerHands] = useState<Hand[]>([
    {
      cards: [],
      bet: 0,
      isBust: false,
      isBlackjack: false,
      isStand: false,
      isDouble: false,
      score: 0,
      isSoft: false
    }
  ]);
  const [activeHandIndex, setActiveHandIndex] = useState<number>(0);

  const [dealerHand, setDealerHand] = useState<Hand>({
    cards: [],
    bet: 0,
    isBust: false,
    isBlackjack: false,
    isStand: false,
    isDouble: false,
    score: 0,
    isSoft: false
  });

  const [roundResult, setRoundResult] = useState<HandResult | null>(null);

  // Ref to hold deck for deal draws without waiting for React re-render
  const deckRef = useRef<Card[]>(deck);
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  const winRateRef = useRef(winRate);
  winRateRef.current = winRate;

  // Helper to draw a card from deck
  const drawCard = useCallback((isFaceUp = true): Card => {
    let currentDeck = deckRef.current;
    if (currentDeck.length < 15) {
      currentDeck = createDeck(6);
      showToast('Shoe kartu diacak ulang!', '🔀');
    }
    const card = { ...currentDeck[0], isFaceUp };
    deckRef.current = currentDeck.slice(1);
    setDeck(deckRef.current);
    return card;
  }, [showToast]);

  // Helper to draw matching card for win-rate guidance
  const drawMatchingCard = useCallback((predicate: (c: Card) => boolean, isFaceUp = true): Card => {
    let currentDeck = deckRef.current;
    if (currentDeck.length < 15) {
      currentDeck = createDeck(6);
    }
    const matchIdx = currentDeck.findIndex(predicate);
    if (matchIdx !== -1) {
      const card = { ...currentDeck[matchIdx], isFaceUp };
      deckRef.current = [...currentDeck.slice(0, matchIdx), ...currentDeck.slice(matchIdx + 1)];
      setDeck(deckRef.current);
      return card;
    }
    return drawCard(isFaceUp);
  }, [drawCard]);

  // ================= BETTING ACTIONS =================
  const handleAddBet = useCallback(
    (chip: ChipValue) => {
      if (phase !== 'BETTING') return;
      if (balance < chip) {
        showToast('Saldo tidak cukup untuk chip ini!', '💳');
        return;
      }
      onUpdateBalance(balance - chip);
      setBetAmount(prev => prev + chip);
    },
    [balance, onUpdateBalance, phase, showToast]
  );

  const handleClearBet = useCallback(() => {
    if (phase !== 'BETTING' || betAmount === 0) return;
    onUpdateBalance(balance + betAmount);
    setBetAmount(0);
    showToast('Taruhan dibersihkan.', '🧹');
  }, [balance, betAmount, onUpdateBalance, phase, showToast]);

  const handleDoubleBet = useCallback(() => {
    if (phase !== 'BETTING' || betAmount === 0) return;
    if (balance < betAmount) {
      showToast('Saldo tidak cukup untuk menggandakan taruhan!', '💳');
      return;
    }
    onUpdateBalance(balance - betAmount);
    setBetAmount(prev => prev * 2);
    showToast('Taruhan digandakan (2x).', '⚡');
  }, [balance, betAmount, onUpdateBalance, phase, showToast]);

  const handleRebet = useCallback(() => {
    if (phase !== 'BETTING' || previousBet === 0) return;
    if (balance + betAmount < previousBet) {
      showToast('Saldo tidak cukup untuk Rebet!', '💳');
      return;
    }
    // Refund current, apply previous
    const netChange = betAmount - previousBet;
    onUpdateBalance(balance + netChange);
    setBetAmount(previousBet);
    showToast('Taruhan putaran sebelumnya diulang.', '🔄');
  }, [balance, betAmount, onUpdateBalance, phase, previousBet, showToast]);

  // ================= DEAL CARDS =================
  const handleDeal = useCallback(() => {
    if (phase !== 'BETTING' || betAmount <= 0) {
      showToast('Silakan pasang taruhan terlebih dahulu!', '☝️');
      return;
    }

    setPreviousBet(betAmount);
    setPhase('DEALING');
    setRoundResult(null);

    // Initial 4 cards deal biased by real-time win rate
    const shouldWin = Math.random() * 100 < winRateRef.current;
    let pCard1: Card;
    let dCard1: Card;
    let pCard2: Card;
    let dCard2: Card;

    if (shouldWin) {
      // Player favored: High chance of 20 or Blackjack (Ace + 10, or 10 + 10)
      const roll = Math.random();
      if (roll < 0.45) {
        pCard1 = drawMatchingCard(c => c.rank === 'A', true);
        pCard2 = drawMatchingCard(c => ['10', 'J', 'Q', 'K'].includes(c.rank), true);
      } else {
        pCard1 = drawMatchingCard(c => ['10', 'J', 'Q', 'K'].includes(c.rank), true);
        pCard2 = drawMatchingCard(c => ['9', '10', 'J', 'Q', 'K'].includes(c.rank), true);
      }
      // Dealer gets vulnerable card up (e.g. 5 or 6)
      dCard1 = drawMatchingCard(c => ['4', '5', '6', '7'].includes(c.rank), true);
      dCard2 = drawMatchingCard(c => ['7', '8', '9', '10'].includes(c.rank), false);
    } else {
      // House favored: Dealer gets strong hand, player gets difficult hand
      dCard1 = drawMatchingCard(c => ['10', 'J', 'Q', 'K', 'A'].includes(c.rank), true);
      dCard2 = drawMatchingCard(c => ['9', '10', 'J', 'Q', 'K'].includes(c.rank), false);
      pCard1 = drawMatchingCard(c => ['9', '10'].includes(c.rank), true);
      pCard2 = drawMatchingCard(c => ['5', '6'].includes(c.rank), true);
    }

    const pCards = [pCard1, pCard2];
    const dCards = [dCard1, dCard2];

    const pEvaluation = calculateHandScore(pCards);
    const dEvaluation = calculateHandScore(dCards); // with hole card face-down

    const initialPlayerHand: Hand = {
      cards: pCards,
      bet: betAmount,
      isBust: pEvaluation.isBust,
      isBlackjack: pEvaluation.isBlackjack,
      isStand: false,
      isDouble: false,
      score: pEvaluation.score,
      isSoft: pEvaluation.isSoft
    };

    const initialDealerHand: Hand = {
      cards: dCards,
      bet: 0,
      isBust: false,
      isBlackjack: dEvaluation.isBlackjack,
      isStand: false,
      isDouble: false,
      score: calculateHandScore([dCard1]).score, // score of visible card only
      isSoft: calculateHandScore([dCard1]).isSoft
    };

    setPlayerHands([initialPlayerHand]);
    setActiveHandIndex(0);
    setDealerHand(initialDealerHand);

    // Check if player or dealer has instant Blackjack
    if (pEvaluation.isBlackjack || dEvaluation.isBlackjack) {
      // Reveal dealer hole card immediately
      setTimeout(() => {
        const revealedDealerCards = [dCard1, { ...dCard2, isFaceUp: true }];
        const finalDealerEval = calculateHandScore(revealedDealerCards);
        const resolvedDealerHand = {
          ...initialDealerHand,
          cards: revealedDealerCards,
          score: finalDealerEval.score,
          isSoft: finalDealerEval.isSoft,
          isBlackjack: finalDealerEval.isBlackjack
        };
        setDealerHand(resolvedDealerHand);

        const outcome = evaluateHandOutcome(initialPlayerHand, resolvedDealerHand);
        setRoundResult(outcome);
        if (outcome.payout > 0) {
          onUpdateBalance(balance + outcome.payout);
        }
        setPhase('ROUND_OVER');
      }, 900);
    } else {
      setTimeout(() => {
        setPhase('PLAYER_TURN');
      }, 600);
    }
  }, [balance, betAmount, drawCard, onUpdateBalance, phase, showToast]);

  // ================= DEALER PLAY LOOP =================
  const playDealerTurn = useCallback(
    (currentDealerHand: Hand, finalPlayerHand: Hand) => {
      setPhase('DEALER_TURN');

      // 1. Reveal hole card
      const revealedCards = currentDealerHand.cards.map(c => ({ ...c, isFaceUp: true }));
      let dealerEval = calculateHandScore(revealedCards);
      let updatedDealer: Hand = {
        ...currentDealerHand,
        cards: revealedCards,
        score: dealerEval.score,
        isSoft: dealerEval.isSoft,
        isBust: dealerEval.isBust,
        isBlackjack: dealerEval.isBlackjack
      };

      setDealerHand(updatedDealer);

      // 2. Dealer draws on < 17 with realistic timed pauses
      function dealerStep(hand: Hand) {
        if (hand.score < 17 && !hand.isBust) {
          setTimeout(() => {
            const nextCard = drawCard(true);
            const newCards = [...hand.cards, nextCard];
            const nextEval = calculateHandScore(newCards);
            const nextHand: Hand = {
              ...hand,
              cards: newCards,
              score: nextEval.score,
              isSoft: nextEval.isSoft,
              isBust: nextEval.isBust
            };
            setDealerHand(nextHand);
            dealerStep(nextHand);
          }, 800);
        } else {
          // Dealer done! Evaluate outcome
          setTimeout(() => {
            const outcome = evaluateHandOutcome(finalPlayerHand, hand);
            setRoundResult(outcome);
            if (outcome.payout > 0) {
              onUpdateBalance(balance + outcome.payout);
              onTriggerParticles?.();
            }
            setPhase('ROUND_OVER');
          }, 600);
        }
      }

      setTimeout(() => {
        dealerStep(updatedDealer);
      }, 700);
    },
    [balance, drawCard, onUpdateBalance]
  );

  // ================= PLAYER ACTIONS =================
  const handleHit = useCallback(() => {
    if (phase !== 'PLAYER_TURN') return;

    const currentHand = playerHands[activeHandIndex];
    if (currentHand.isStand || currentHand.isBust) return;

    const newCard = drawCard(true);
    const updatedCards = [...currentHand.cards, newCard];
    const evalResult = calculateHandScore(updatedCards);

    const updatedHand: Hand = {
      ...currentHand,
      cards: updatedCards,
      score: evalResult.score,
      isSoft: evalResult.isSoft,
      isBust: evalResult.isBust
    };

    const nextHands = [...playerHands];
    nextHands[activeHandIndex] = updatedHand;
    setPlayerHands(nextHands);

    if (evalResult.isBust) {
      // Player busted!
      setTimeout(() => {
        const outcome: HandResult = {
          outcome: 'BUST',
          payout: 0,
          message: 'Bust! Nilai kartu melebihi 21.'
        };
        setRoundResult(outcome);
        setPhase('ROUND_OVER');
      }, 500);
    } else if (evalResult.score === 21) {
      // Automatically stand on 21
      handleStand(updatedHand);
    }
  }, [activeHandIndex, drawCard, phase, playerHands]);

  const handleStand = useCallback(
    (customHand?: Hand) => {
      if (phase !== 'PLAYER_TURN') return;

      const currentHand = customHand || playerHands[activeHandIndex];
      const updatedHand: Hand = {
        ...currentHand,
        isStand: true
      };

      const nextHands = [...playerHands];
      nextHands[activeHandIndex] = updatedHand;
      setPlayerHands(nextHands);

      // End player turn and hand over to dealer
      playDealerTurn(dealerHand, updatedHand);
    },
    [activeHandIndex, dealerHand, phase, playDealerTurn, playerHands]
  );

  const handleDoubleDown = useCallback(() => {
    if (phase !== 'PLAYER_TURN') return;

    const currentHand = playerHands[activeHandIndex];
    if (currentHand.cards.length !== 2) return;

    if (balance < currentHand.bet) {
      showToast('Saldo tidak cukup untuk Double Down!', '💳');
      return;
    }

    // Deduct additional bet
    onUpdateBalance(balance - currentHand.bet);

    // Draw exactly 1 card
    const newCard = drawCard(true);
    const updatedCards = [...currentHand.cards, newCard];
    const evalResult = calculateHandScore(updatedCards);

    const updatedHand: Hand = {
      ...currentHand,
      bet: currentHand.bet * 2,
      cards: updatedCards,
      score: evalResult.score,
      isSoft: evalResult.isSoft,
      isBust: evalResult.isBust,
      isDouble: true,
      isStand: true
    };

    const nextHands = [...playerHands];
    nextHands[activeHandIndex] = updatedHand;
    setPlayerHands(nextHands);

    if (evalResult.isBust) {
      setTimeout(() => {
        setRoundResult({
          outcome: 'BUST',
          payout: 0,
          message: 'Bust pada Double Down!'
        });
        setPhase('ROUND_OVER');
      }, 600);
    } else {
      setTimeout(() => {
        playDealerTurn(dealerHand, updatedHand);
      }, 600);
    }
  }, [activeHandIndex, balance, drawCard, dealerHand, onUpdateBalance, phase, playDealerTurn, playerHands, showToast]);

  const handleNewRound = useCallback(() => {
    setPhase('BETTING');
    setRoundResult(null);
    setPlayerHands([
      {
        cards: [],
        bet: 0,
        isBust: false,
        isBlackjack: false,
        isStand: false,
        isDouble: false,
        score: 0,
        isSoft: false
      }
    ]);
    setDealerHand({
      cards: [],
      bet: 0,
      isBust: false,
      isBlackjack: false,
      isStand: false,
      isDouble: false,
      score: 0,
      isSoft: false
    });
  }, []);

  // Keyboard Shortcuts for Blackjack
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Betting phase shortcuts
      if (phase === 'BETTING') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleDeal();
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
        if (key === 'r') {
          e.preventDefault();
          handleRebet();
          return;
        }
        // Number keys 1-6 to add chips
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
      }

      // Player turn shortcuts
      if (phase === 'PLAYER_TURN') {
        if (key === 'h' || e.key === ' ') {
          e.preventDefault();
          handleHit();
          return;
        }
        if (key === 's' || e.key === 'Enter') {
          e.preventDefault();
          handleStand();
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          handleDoubleDown();
          return;
        }
      }

      // Round over
      if (phase === 'ROUND_OVER') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleNewRound();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleAddBet,
    handleClearBet,
    handleDeal,
    handleDoubleBet,
    handleDoubleDown,
    handleHit,
    handleNewRound,
    handleRebet,
    handleStand,
    phase
  ]);

  const activeHand = playerHands[activeHandIndex] || playerHands[0];

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* ================= BLACKJACK CASINO TABLE ================= */}
      <div className="w-full relative rounded-3xl bg-[#093521] border-6 border-[#361e0b] shadow-[inset_0_0_80px_rgba(0,0,0,0.85),0_16px_45px_rgba(0,0,0,0.7)] p-4 sm:p-8 flex flex-col justify-between min-h-[580px] overflow-hidden">
        {/* Curved Casino Felt Inlay Markings */}
        <div className="absolute inset-x-8 top-12 h-64 border-b-2 border-amber-400/20 rounded-[100%] pointer-events-none" />
        <div className="absolute inset-x-14 top-16 h-60 border-b border-dashed border-amber-400/15 rounded-[100%] pointer-events-none" />

        {/* Felt Rule Typography Banner */}
        <div className="text-center z-10 space-y-1 mb-2">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 drop-shadow">
            ★ BLACKJACK PAYS 3 TO 2 ★
          </h2>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-200/60">
            Dealer must stand on 17 and draw to 16 · Insurance pays 2 to 1
          </p>
        </div>

        {/* Deck Shoe Indicator (Top Right) */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/5 backdrop-blur-sm z-10">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-mono text-slate-300">
            Shoe: {deck.length} kartu
          </span>
        </div>

        {/* ================= DEALER AREA ================= */}
        <div className="flex flex-col items-center gap-2.5 z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Kartu Dealer
            </span>
            {dealerHand.cards.length > 0 && (
              <span className="px-2 py-0.5 rounded-md font-mono font-extrabold text-xs text-amber-300 bg-amber-500/20 border border-amber-500/30">
                {phase === 'PLAYER_TURN' && dealerHand.cards.length === 2 && !dealerHand.cards[1].isFaceUp
                  ? `${dealerHand.score} + ?`
                  : dealerHand.score}
              </span>
            )}
          </div>

          {/* Dealer Cards Container */}
          <div className="flex items-center justify-center gap-2 min-h-[110px] sm:min-h-[135px]">
            {dealerHand.cards.length === 0 ? (
              <div className="w-18 h-26 sm:w-22 sm:h-32 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 text-xs font-semibold">
                Dealer
              </div>
            ) : (
              dealerHand.cards.map((card, idx) => (
                <PlayingCard
                  key={card.id || idx}
                  card={card}
                  className="-ml-4 first:ml-0"
                />
              ))
            )}
          </div>
        </div>

        {/* ================= CENTER RESULT ANNOUNCEMENT ================= */}
        <div className="flex flex-col items-center justify-center min-h-[64px] z-20 my-2">
          {roundResult && phase === 'ROUND_OVER' ? (
            <div className="flex flex-col items-center gap-1 animate-scale-in">
              <div
                className={`px-6 py-2 rounded-2xl font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-2xl flex items-center gap-2 border ${
                  roundResult.outcome === 'BLACKJACK' || roundResult.outcome === 'WIN' || roundResult.outcome === 'DEALER_BUST'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 border-amber-200 shadow-[0_0_30px_rgba(234,179,8,0.5)]'
                    : roundResult.outcome === 'PUSH'
                    ? 'bg-slate-800 text-amber-200 border-amber-500/30'
                    : 'bg-red-950/80 text-red-200 border-red-500/40'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{roundResult.message}</span>
              </div>
              {roundResult.payout > 0 && (
                <span className="text-sm font-mono font-extrabold text-emerald-400 drop-shadow">
                  Pembayaran: +{formatCurrency(roundResult.payout)}
                </span>
              )}
            </div>
          ) : phase === 'BETTING' ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-200/80 bg-black/40 px-4 py-1.5 rounded-full border border-amber-500/20">
              <span>Pasang chip pada lingkaran taruhan lalu tekan DEAL</span>
            </div>
          ) : null}
        </div>

        {/* ================= PLAYER AREA ================= */}
        <div className="flex flex-col items-center gap-3 z-10">
          {/* Player Cards */}
          <div className="flex items-center justify-center gap-2 min-h-[110px] sm:min-h-[135px]">
            {activeHand.cards.length === 0 ? (
              <div className="w-18 h-26 sm:w-22 sm:h-32 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 text-xs font-semibold">
                Player
              </div>
            ) : (
              activeHand.cards.map((card, idx) => (
                <PlayingCard
                  key={card.id || idx}
                  card={card}
                  className="-ml-4 first:ml-0"
                />
              ))
            )}
          </div>

          {/* Player Score Badge */}
          {activeHand.cards.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Nilai Kartu:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md font-mono font-extrabold text-sm ${
                  activeHand.isBlackjack
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                    : activeHand.isBust
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {activeHand.isBlackjack ? '21 - BLACKJACK!' : activeHand.isBust ? `BUST (${activeHand.score})` : activeHand.score}
              </span>
            </div>
          )}

          {/* Betting Circle on Table */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              disabled={phase !== 'BETTING'}
              onClick={() => handleAddBet(selectedChip as ChipValue)}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-default ${
                phase === 'BETTING'
                  ? 'border-amber-400/80 bg-black/40 hover:bg-black/60 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                  : 'border-amber-400/40 bg-black/30'
              }`}
              title="Klik untuk pasang chip tambahan"
            >
              <span className="text-[10px] uppercase font-bold text-amber-300/80 tracking-wider">
                BET
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-amber-400 tabular-nums">
                {formatCurrency(betAmount)}
              </span>

              {/* Placed Chip Badge */}
              {betAmount > 0 && (
                <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow">
                  PASANG
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS DOCK ================= */}
      <div className="w-full flex flex-col gap-3">
        {/* Chip Selection Rack (in Betting phase) */}
        {phase === 'BETTING' && (
          <ChipRack
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            balance={balance}
            showToast={showToast}
          />
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-md shadow-xl flex-wrap sm:flex-nowrap">
          {phase === 'BETTING' ? (
            <>
              {/* Clear */}
              <button
                type="button"
                disabled={betAmount === 0}
                onClick={handleClearBet}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
                title="Hapus taruhan [Shortcut: C]"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear</span>
                <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">C</kbd>
              </button>

              {/* Double 2x */}
              <button
                type="button"
                disabled={betAmount === 0 || balance < betAmount}
                onClick={handleDoubleBet}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
                title="Gandakan taruhan (2x) [Shortcut: D]"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>2x Double</span>
                <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">D</kbd>
              </button>

              {/* Rebet */}
              <button
                type="button"
                disabled={previousBet === 0 || balance < previousBet}
                onClick={handleRebet}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 cursor-pointer"
                title="Ulangi taruhan putaran sebelumnya [Shortcut: R]"
              >
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>Rebet</span>
                <kbd className="hidden sm:inline text-[9px] font-mono text-amber-300/70 bg-black/40 px-1 rounded">R</kbd>
              </button>

              {/* DEAL Button */}
              <button
                type="button"
                disabled={betAmount === 0}
                onClick={handleDeal}
                className="w-full sm:w-auto flex-2 min-w-[150px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_4px_16px_rgba(234,179,8,0.4)] active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>DEAL</span>
                <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-slate-950 bg-amber-300/90 px-1.5 py-0.2 rounded border border-amber-600/30">
                  Space
                </kbd>
              </button>
            </>
          ) : phase === 'PLAYER_TURN' ? (
            <>
              {/* HIT */}
              <button
                type="button"
                onClick={handleHit}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>HIT</span>
                <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-emerald-100 bg-black/30 px-1.5 py-0.2 rounded">
                  H
                </kbd>
              </button>

              {/* STAND */}
              <button
                type="button"
                onClick={() => handleStand()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold tracking-wider uppercase bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <HandIcon className="w-4 h-4" />
                <span>STAND</span>
                <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-red-100 bg-black/30 px-1.5 py-0.2 rounded">
                  S
                </kbd>
              </button>

              {/* DOUBLE DOWN */}
              <button
                type="button"
                disabled={activeHand.cards.length !== 2 || balance < activeHand.bet}
                onClick={handleDoubleDown}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold tracking-wider uppercase bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>DOUBLE</span>
                <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-amber-100 bg-black/30 px-1.5 py-0.2 rounded">
                  D
                </kbd>
              </button>
            </>
          ) : phase === 'ROUND_OVER' ? (
            <button
              type="button"
              onClick={handleNewRound}
              className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-extrabold tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-xl cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PUTARAN BARU (NEW HAND)</span>
              <kbd className="hidden sm:inline text-[10px] font-mono font-bold text-slate-950 bg-amber-300/90 px-1.5 py-0.2 rounded border border-amber-600/30">
                Space
              </kbd>
            </button>
          ) : (
            <div className="py-2 text-xs font-semibold text-amber-300/80 animate-pulse">
              Dealer sedang membagikan kartu...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
