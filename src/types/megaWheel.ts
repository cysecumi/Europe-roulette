export type MegaWheelSegmentValue = 1 | 2 | 5 | 10 | 20 | 40 | 100 | 500 | 1000;

export interface MegaWheelSegment {
  id: number;
  value: MegaWheelSegmentValue;
  color: string;
  angle: number;
}

export interface MegaWheelResult {
  winningSegment: MegaWheelSegment;
  payoutMultiplier: number;
}
