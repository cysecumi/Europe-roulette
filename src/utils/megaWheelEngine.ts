import { MegaWheelSegment, MegaWheelResult, MegaWheelSegmentValue } from '../types/megaWheel';

export const MEGA_WHEEL_SEGMENTS: MegaWheelSegment[] = [
  { id: 0, value: 1, color: '#eab308', angle: 0 },   // Gold
  { id: 1, value: 2, color: '#a855f7', angle: 1 },   // Purple
  { id: 2, value: 5, color: '#3b82f6', angle: 2 },   // Blue
  { id: 3, value: 1, color: '#eab308', angle: 3 },
  { id: 4, value: 10, color: '#ec4899', angle: 4 },  // Pink
  { id: 5, value: 2, color: '#a855f7', angle: 5 },
  { id: 6, value: 1, color: '#eab308', angle: 6 },
  { id: 7, value: 20, color: '#10b981', angle: 7 },  // Emerald
  { id: 8, value: 5, color: '#3b82f6', angle: 8 },
  { id: 9, value: 1, color: '#eab308', angle: 9 },
  { id: 10, value: 40, color: '#f97316', angle: 10 }, // Orange
  { id: 11, value: 2, color: '#a855f7', angle: 11 },
  { id: 12, value: 100, color: '#ef4444', angle: 12 },// Red
  { id: 13, value: 1, color: '#eab308', angle: 13 },
  { id: 14, value: 5, color: '#3b82f6', angle: 14 },
  { id: 15, value: 500, color: '#8b5cf6', angle: 15 },// Neon Violet
  { id: 16, value: 10, color: '#ec4899', angle: 16 },
  { id: 17, value: 1, color: '#eab308', angle: 17 },
  { id: 18, value: 1000, color: '#fbbf24', angle: 18 },// Jackpot Gold
  { id: 19, value: 2, color: '#a855f7', angle: 19 }
];

export function simulateMegaWheelSpin(winRate: number, activeBets: Record<number, number>): MegaWheelResult {
  const clampedWinRate = Math.max(0, Math.min(100, winRate));
  const shouldWin = Math.random() * 100 < clampedWinRate;

  const betEntries = Object.entries(activeBets).filter(([_, amt]) => amt > 0);
  const userBetValues = betEntries.map(([val]) => parseInt(val, 10));

  for (let attempt = 0; attempt < 50; attempt++) {
    const seg = MEGA_WHEEL_SEGMENTS[Math.floor(Math.random() * MEGA_WHEEL_SEGMENTS.length)];
    const isUserBet = userBetValues.includes(seg.value);

    if ((shouldWin && isUserBet) || (!shouldWin && !isUserBet) || attempt === 49) {
      const betAmt = activeBets[seg.value] || 0;
      const payoutMultiplier = betAmt > 0 ? seg.value + 1 : 0; // e.g., 1x bet returns bet * (value + 1)
      return {
        winningSegment: seg,
        payoutMultiplier
      };
    }
  }

  const defaultSeg = MEGA_WHEEL_SEGMENTS[0];
  return {
    winningSegment: defaultSeg,
    payoutMultiplier: (activeBets[defaultSeg.value] || 0) > 0 ? defaultSeg.value + 1 : 0
  };
}
