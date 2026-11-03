import { SicBoResult, SicBoBetType } from '../types/sicBo';

export function simulateSicBoRoll(winRate: number, activeBets: Record<SicBoBetType, number>): SicBoResult {
  const clampedWinRate = Math.max(0, Math.min(100, winRate));
  const shouldWin = Math.random() * 100 < clampedWinRate;

  const betEntries = Object.entries(activeBets).filter(([_, amt]) => amt > 0);
  const userBets = betEntries.map(([type]) => type as SicBoBetType);

  for (let attempt = 0; attempt < 50; attempt++) {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const dice: [number, number, number] = [d1, d2, d3];
    const sum = d1 + d2 + d3;

    const isTriple = d1 === d2 && d2 === d3;
    const isSmall = !isTriple && sum >= 4 && sum <= 10;
    const isBig = !isTriple && sum >= 11 && sum <= 17;

    const winningBets: SicBoBetType[] = [];
    if (isSmall) winningBets.push('small');
    if (isBig) winningBets.push('big');
    if (sum >= 4 && sum <= 17) winningBets.push(`sum_${sum}` as SicBoBetType);
    if (isTriple) {
      winningBets.push('any_triple');
      winningBets.push(`triple_${d1}` as SicBoBetType);
    }
    dice.forEach(d => {
      const singleKey = `single_${d}` as SicBoBetType;
      if (!winningBets.includes(singleKey)) winningBets.push(singleKey);
    });

    const hasUserWon = userBets.some(b => winningBets.includes(b));

    if ((shouldWin && hasUserWon) || (!shouldWin && !hasUserWon) || attempt === 49) {
      let totalPayoutMultiplier = 0;
      for (const [betType, amt] of Object.entries(activeBets)) {
        if (amt <= 0) continue;
        const bType = betType as SicBoBetType;
        if (winningBets.includes(bType)) {
          if (bType === 'small' || bType === 'big') totalPayoutMultiplier += 2;
          else if (bType.startsWith('sum_')) {
            const s = parseInt(bType.replace('sum_', ''), 10);
            if (s === 4 || s === 17) totalPayoutMultiplier += 61;
            else if (s === 5 || s === 16) totalPayoutMultiplier += 31;
            else if (s === 6 || s === 15) totalPayoutMultiplier += 19;
            else if (s === 7 || s === 14) totalPayoutMultiplier += 13;
            else if (s === 8 || s === 13) totalPayoutMultiplier += 9;
            else totalPayoutMultiplier += 7; // 9, 10, 11, 12
          } else if (bType.startsWith('triple_')) totalPayoutMultiplier += 181;
          else if (bType === 'any_triple') totalPayoutMultiplier += 31;
          else if (bType.startsWith('single_')) {
            // Count occurrences in dice
            const targetVal = parseInt(bType.replace('single_', ''), 10);
            const count = dice.filter(d => d === targetVal).length;
            totalPayoutMultiplier += count + 1;
          }
        }
      }

      return {
        dice,
        sum,
        isSmall,
        isBig,
        isTriple,
        winningBets,
        totalPayoutMultiplier
      };
    }
  }

  // Fallback
  return {
    dice: [3, 4, 5],
    sum: 12,
    isSmall: false,
    isBig: true,
    isTriple: false,
    winningBets: ['big', 'sum_12', 'single_3', 'single_4', 'single_5'],
    totalPayoutMultiplier: 2
  };
}
