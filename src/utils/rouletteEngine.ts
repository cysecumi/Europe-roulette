import { BetId, HistoryItem, PocketColor, SessionStats, SpinResult } from '../types/roulette';

/**
 * Standard European Roulette wheel layout sequence (clockwise).
 * 37 pockets total (single zero).
 */
export const WHEEL_NUMBERS: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RED_NUMBERS: number[] = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
];

export const BLACK_NUMBERS: number[] = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
];

export const SLICE_ANGLE = (Math.PI * 2) / 37;

export const PAYOUT_RATIOS: Record<string, number> = {
  straight: 35, // 35:1
  col1: 2,      // 2:1
  col2: 2,
  col3: 2,
  dozen1: 2,    // 2:1
  dozen2: 2,
  dozen3: 2,
  red: 1,       // 1:1
  black: 1,
  even: 1,
  odd: 1,
  low: 1,       // 1-18
  high: 1       // 19-36
};

export function isRed(n: number): boolean {
  return RED_NUMBERS.includes(n);
}

export function getColor(n: number): PocketColor {
  if (n === 0) return 'green';
  return isRed(n) ? 'red' : 'black';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatChipBadge(amount: number): string {
  if (amount >= 10000) {
    return `${Math.round(amount / 1000)}k`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return String(amount);
}

export function checkBetWin(betId: BetId, n: number): boolean {
  if (betId.startsWith('n-')) {
    const target = parseInt(betId.replace('n-', ''), 10);
    return target === n;
  }

  // Single zero loses all outside bets
  if (n === 0) {
    return false;
  }

  switch (betId) {
    case 'red':
      return isRed(n);
    case 'black':
      return !isRed(n);
    case 'even':
      return n % 2 === 0;
    case 'odd':
      return n % 2 !== 0;
    case 'low':
      return n >= 1 && n <= 18;
    case 'high':
      return n >= 19 && n <= 36;
    case 'dozen1':
      return n >= 1 && n <= 12;
    case 'dozen2':
      return n >= 13 && n <= 24;
    case 'dozen3':
      return n >= 25 && n <= 36;
    case 'col1':
      return n % 3 === 1;
    case 'col2':
      return n % 3 === 2;
    case 'col3':
      return n % 3 === 0;
    default:
      return false;
  }
}

export function getPayoutMultiplier(betId: BetId): number {
  if (betId.startsWith('n-')) {
    return PAYOUT_RATIOS.straight;
  }
  return PAYOUT_RATIOS[betId] ?? 1;
}

export function evaluateRoundOutcome(
  bets: Record<BetId, number>,
  winningNumber: number
): SpinResult {
  let totalWagered = 0;
  let totalWon = 0;
  const winningBetIds: BetId[] = [];

  for (const [idStr, amount] of Object.entries(bets)) {
    const betId = idStr as BetId;
    if (amount <= 0) continue;
    totalWagered += amount;

    if (checkBetWin(betId, winningNumber)) {
      const multiplier = getPayoutMultiplier(betId);
      // Payout in roulette: original stake returned + winnings (multiplier * stake)
      const payout = amount + (amount * multiplier);
      totalWon += payout;
      winningBetIds.push(betId);
    }
  }

  return {
    winningNumber,
    color: getColor(winningNumber),
    totalWagered,
    totalWon,
    netPayout: totalWon - totalWagered,
    winningBetIds
  };
}

export function computeStats(history: HistoryItem[]): {
  redPct: number;
  blackPct: number;
  greenPct: number;
  evenPct: number;
  oddPct: number;
  hotNumbers: { num: number; count: number }[];
  coldNumbers: { num: number; count: number }[];
} {
  const total = history.length;
  if (total === 0) {
    return {
      redPct: 0,
      blackPct: 0,
      greenPct: 0,
      evenPct: 0,
      oddPct: 0,
      hotNumbers: [],
      coldNumbers: []
    };
  }

  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;
  let evenCount = 0;
  let oddCount = 0;

  const counts: Record<number, number> = {};
  WHEEL_NUMBERS.forEach(num => {
    counts[num] = 0;
  });

  for (const item of history) {
    counts[item.number] = (counts[item.number] || 0) + 1;
    if (item.color === 'red') redCount++;
    else if (item.color === 'black') blackCount++;
    else if (item.color === 'green') greenCount++;

    if (item.number !== 0) {
      if (item.isEven) evenCount++;
      else oddCount++;
    }
  }

  const nonZeroTotal = evenCount + oddCount;
  const sorted = Object.entries(counts)
    .map(([numStr, count]) => ({ num: parseInt(numStr, 10), count }))
    .sort((a, b) => b.count - a.count);

  const hotNumbers = sorted.slice(0, 5).filter(item => item.count > 0);
  const coldNumbers = [...sorted].reverse().slice(0, 5);

  return {
    redPct: Math.round((redCount / total) * 100),
    blackPct: Math.round((blackCount / total) * 100),
    greenPct: Math.round((greenCount / total) * 100),
    evenPct: nonZeroTotal > 0 ? Math.round((evenCount / nonZeroTotal) * 100) : 0,
    oddPct: nonZeroTotal > 0 ? Math.round((oddCount / nonZeroTotal) * 100) : 0,
    hotNumbers,
    coldNumbers
  };
}
