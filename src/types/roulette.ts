/**
 * Types and interfaces for Roulette Royale Premium
 */

export type ChipValue = 5 | 10 | 25 | 50 | 100 | 500;

export type BetId = 
  | `n-${number}`
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'   // 1-18
  | 'high'  // 19-36
  | 'dozen1' // 1-12
  | 'dozen2' // 13-24
  | 'dozen3' // 25-36
  | 'col1'   // 1, 4, 7... 34
  | 'col2'   // 2, 5, 8... 35
  | 'col3';  // 3, 6, 9... 36

export type PocketColor = 'red' | 'black' | 'green';

export interface BetPlacement {
  id: BetId;
  amount: number;
}

export interface BetHistoryEntry {
  id: BetId;
  amount: number;
}

export interface HistoryItem {
  number: number;
  color: PocketColor;
  isEven: boolean;
  isHigh: boolean;
  timestamp: number;
}

export type GamePhase = 'IDLE' | 'SPINNING' | 'SETTLING' | 'RESULT';

export interface SpinResult {
  winningNumber: number;
  color: PocketColor;
  totalWagered: number;
  totalWon: number;
  netPayout: number;
  winningBetIds: BetId[];
}

export interface SessionStats {
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  highestWin: number;
  redCount: number;
  blackCount: number;
  greenCount: number;
  evenCount: number;
  oddCount: number;
  numberFrequencies: Record<number, number>;
}
