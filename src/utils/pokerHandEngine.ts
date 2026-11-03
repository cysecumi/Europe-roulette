import { Rank, Suit } from '../types/blackjack';
import { PaytableEntry, PokerCard, PokerEvaluation, PokerHandType } from '../types/pokerSlot';

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14
};

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const PAYTABLE: PaytableEntry[] = [
  { type: 'ROYAL_FLUSH', label: 'Royal Flush', multiplier: 100, description: 'A-K-Q-J-10 sejenis' },
  { type: 'STRAIGHT_FLUSH', label: 'Straight Flush', multiplier: 50, description: '5 kartu berurutan sejenis' },
  { type: 'FOUR_OF_A_KIND', label: 'Four of a Kind', multiplier: 25, description: '4 kartu berangka sama' },
  { type: 'FULL_HOUSE', label: 'Full House', multiplier: 15, description: '3 kartu sama + 1 pasang' },
  { type: 'FLUSH', label: 'Flush', multiplier: 10, description: '5 kartu berlambang sama' },
  { type: 'STRAIGHT', label: 'Straight', multiplier: 5, description: '5 kartu berurutan' },
  { type: 'THREE_OF_A_KIND', label: 'Three of a Kind', multiplier: 3, description: '3 kartu berangka sama' },
  { type: 'TWO_PAIR', label: 'Two Pair', multiplier: 2, description: '2 pasang kartu kembar' },
  { type: 'JACKS_OR_BETTER', label: 'Jacks or Better', multiplier: 1, description: 'Sepasang J, Q, K, atau A' }
];

let cardIdGen = 0;

export function generateRandom5CardHand(): PokerCard[] {
  // Create full 52 card deck and draw 5 unique cards
  const deck: PokerCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `slot-c-${suit}-${rank}-${cardIdGen++}`,
        suit,
        rank,
        rankValue: RANK_VALUES[rank]
      });
    }
  }

  // Shuffle and slice 5
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, 5);
}

export function generateHandWithWinRate(winRate: number): PokerCard[] {
  const clampedWinRate = Math.max(0, Math.min(100, winRate));
  const shouldWin = Math.random() * 100 < clampedWinRate;

  // Attempt up to 50 draws to get the desired outcome naturally
  for (let attempt = 0; attempt < 50; attempt++) {
    const hand = generateRandom5CardHand();
    const evaluation = evaluatePokerHand(hand);
    const isWinner = evaluation.multiplier > 0 || evaluation.triggeredBonus;

    if (shouldWin && isWinner) {
      return hand;
    }
    if (!shouldWin && !isWinner) {
      return hand;
    }
  }

  // Fallback synthetic construction if natural sampling didn't hit within 50 tries:
  if (shouldWin) {
    // Generate a guaranteed winning hand (e.g., Two Pair or Jacks or Better or 3 Aces)
    const roll = Math.random();
    if (roll < 0.2) {
      // 3 Aces Scatter bonus
      return [
        { id: `win-ace-1-${cardIdGen++}`, suit: 'spades', rank: 'A', rankValue: 14 },
        { id: `win-ace-2-${cardIdGen++}`, suit: 'hearts', rank: 'A', rankValue: 14 },
        { id: `win-ace-3-${cardIdGen++}`, suit: 'diamonds', rank: 'A', rankValue: 14 },
        { id: `win-card-4-${cardIdGen++}`, suit: 'clubs', rank: 'K', rankValue: 13 },
        { id: `win-card-5-${cardIdGen++}`, suit: 'spades', rank: '9', rankValue: 9 }
      ];
    } else if (roll < 0.5) {
      // Two Pair (e.g., Kings and 10s)
      return [
        { id: `win-k1-${cardIdGen++}`, suit: 'spades', rank: 'K', rankValue: 13 },
        { id: `win-k2-${cardIdGen++}`, suit: 'hearts', rank: 'K', rankValue: 13 },
        { id: `win-t1-${cardIdGen++}`, suit: 'diamonds', rank: '10', rankValue: 10 },
        { id: `win-t2-${cardIdGen++}`, suit: 'clubs', rank: '10', rankValue: 10 },
        { id: `win-c5-${cardIdGen++}`, suit: 'hearts', rank: '7', rankValue: 7 }
      ];
    } else {
      // Pair of Queens (Jacks or Better)
      return [
        { id: `win-q1-${cardIdGen++}`, suit: 'spades', rank: 'Q', rankValue: 12 },
        { id: `win-q2-${cardIdGen++}`, suit: 'diamonds', rank: 'Q', rankValue: 12 },
        { id: `win-c3-${cardIdGen++}`, suit: 'hearts', rank: '4', rankValue: 4 },
        { id: `win-c4-${cardIdGen++}`, suit: 'clubs', rank: '7', rankValue: 7 },
        { id: `win-c5-${cardIdGen++}`, suit: 'spades', rank: '9', rankValue: 9 }
      ];
    }
  } else {
    // Guaranteed losing hand: No pairs, not flush, not straight, only 1 or 0 Aces
    return [
      { id: `lose-1-${cardIdGen++}`, suit: 'spades', rank: '2', rankValue: 2 },
      { id: `lose-2-${cardIdGen++}`, suit: 'hearts', rank: '4', rankValue: 4 },
      { id: `lose-3-${cardIdGen++}`, suit: 'diamonds', rank: '7', rankValue: 7 },
      { id: `lose-4-${cardIdGen++}`, suit: 'clubs', rank: '9', rankValue: 9 },
      { id: `lose-5-${cardIdGen++}`, suit: 'spades', rank: 'K', rankValue: 13 }
    ];
  }
}

export function evaluatePokerHand(cards: PokerCard[]): PokerEvaluation {
  if (cards.length !== 5) {
    return {
      handType: 'NO_HAND',
      label: 'No Hand',
      multiplier: 0,
      winningIndices: [],
      scatterAceCount: 0,
      triggeredBonus: false
    };
  }

  // 1. Count Aces (Scatter symbols)
  const scatterAceIndices: number[] = [];
  cards.forEach((c, idx) => {
    if (c.rank === 'A') {
      scatterAceIndices.push(idx);
    }
  });
  const scatterAceCount = scatterAceIndices.length;
  const triggeredBonus = scatterAceCount >= 3;

  // Group by rank
  const rankCounts: Record<number, number> = {};
  const rankIndices: Record<number, number[]> = {};
  cards.forEach((c, idx) => {
    rankCounts[c.rankValue] = (rankCounts[c.rankValue] || 0) + 1;
    if (!rankIndices[c.rankValue]) rankIndices[c.rankValue] = [];
    rankIndices[c.rankValue].push(idx);
  });

  // Group by suit
  const suitCounts: Record<string, number> = {};
  cards.forEach(c => {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  });
  const isFlush = Object.values(suitCounts).some(count => count === 5);

  // Check straight
  const uniqueRankValues = Object.keys(rankCounts).map(Number).sort((a, b) => a - b);
  let isStraight = false;

  if (uniqueRankValues.length === 5) {
    // Normal straight: difference between max and min is 4
    if (uniqueRankValues[4] - uniqueRankValues[0] === 4) {
      isStraight = true;
    }
    // Ace-low wheel straight: A (14), 2, 3, 4, 5
    else if (
      uniqueRankValues[0] === 2 &&
      uniqueRankValues[1] === 3 &&
      uniqueRankValues[2] === 4 &&
      uniqueRankValues[3] === 5 &&
      uniqueRankValues[4] === 14
    ) {
      isStraight = true;
    }
  }

  // Evaluate Hand Types in descending hierarchy:
  // 1. Royal Flush: Straight Flush with Ace-high (10, J, Q, K, A)
  if (isFlush && isStraight && uniqueRankValues.includes(14) && uniqueRankValues.includes(10)) {
    return {
      handType: 'ROYAL_FLUSH',
      label: 'ROYAL FLUSH! 👑',
      multiplier: 100,
      winningIndices: [0, 1, 2, 3, 4],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 2. Straight Flush
  if (isFlush && isStraight) {
    return {
      handType: 'STRAIGHT_FLUSH',
      label: 'STRAIGHT FLUSH!',
      multiplier: 50,
      winningIndices: [0, 1, 2, 3, 4],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 3. Four of a Kind
  const fourKindEntry = Object.entries(rankCounts).find(([_, count]) => count === 4);
  if (fourKindEntry) {
    const val = Number(fourKindEntry[0]);
    return {
      handType: 'FOUR_OF_A_KIND',
      label: 'FOUR OF A KIND!',
      multiplier: 25,
      winningIndices: rankIndices[val],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 4. Full House (3 of a kind + pair)
  const threeKindEntry = Object.entries(rankCounts).find(([_, count]) => count === 3);
  const pairEntries = Object.entries(rankCounts).filter(([_, count]) => count === 2);
  if (threeKindEntry && pairEntries.length === 1) {
    return {
      handType: 'FULL_HOUSE',
      label: 'FULL HOUSE!',
      multiplier: 15,
      winningIndices: [0, 1, 2, 3, 4],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 5. Flush
  if (isFlush) {
    return {
      handType: 'FLUSH',
      label: 'FLUSH!',
      multiplier: 10,
      winningIndices: [0, 1, 2, 3, 4],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 6. Straight
  if (isStraight) {
    return {
      handType: 'STRAIGHT',
      label: 'STRAIGHT!',
      multiplier: 5,
      winningIndices: [0, 1, 2, 3, 4],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 7. Three of a Kind
  if (threeKindEntry) {
    const val = Number(threeKindEntry[0]);
    return {
      handType: 'THREE_OF_A_KIND',
      label: 'THREE OF A KIND!',
      multiplier: 3,
      winningIndices: rankIndices[val],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 8. Two Pair
  if (pairEntries.length === 2) {
    const p1Val = Number(pairEntries[0][0]);
    const p2Val = Number(pairEntries[1][0]);
    return {
      handType: 'TWO_PAIR',
      label: 'TWO PAIR!',
      multiplier: 2,
      winningIndices: [...rankIndices[p1Val], ...rankIndices[p2Val]],
      scatterAceCount,
      triggeredBonus
    };
  }

  // 9. Jacks or Better (Pair of J, Q, K, A)
  if (pairEntries.length === 1) {
    const pVal = Number(pairEntries[0][0]);
    if (pVal >= 11) {
      // J = 11, Q = 12, K = 13, A = 14
      return {
        handType: 'JACKS_OR_BETTER',
        label: 'JACKS OR BETTER (PAIR)!',
        multiplier: 1,
        winningIndices: rankIndices[pVal],
        scatterAceCount,
        triggeredBonus
      };
    }
  }

  // No winning hand combination
  return {
    handType: 'NO_HAND',
    label: scatterAceCount >= 3 ? '3+ AS SCATTER BONUS!' : 'No Winning Hand',
    multiplier: 0,
    winningIndices: scatterAceCount >= 3 ? scatterAceIndices : [],
    scatterAceCount,
    triggeredBonus
  };
}
