import { Rank, Suit } from './blackjack';

export type PokerHandType =
  | 'ROYAL_FLUSH'
  | 'STRAIGHT_FLUSH'
  | 'FOUR_OF_A_KIND'
  | 'FULL_HOUSE'
  | 'FLUSH'
  | 'STRAIGHT'
  | 'THREE_OF_A_KIND'
  | 'TWO_PAIR'
  | 'JACKS_OR_BETTER'
  | 'NO_HAND';

export interface PaytableEntry {
  type: PokerHandType;
  label: string;
  multiplier: number;
  description: string;
}

export interface PokerCard {
  id: string;
  suit: Suit;
  rank: Rank;
  rankValue: number; // 2-14 (Ace = 14)
}

export interface PokerEvaluation {
  handType: PokerHandType;
  label: string;
  multiplier: number;
  winningIndices: number[];
  scatterAceCount: number;
  triggeredBonus: boolean;
}

export interface BonusState {
  isActive: boolean;
  freeSpinsRemaining: number;
  totalSpinsAwarded: number;
  totalBonusWon: number;
  multiplier: number;
}
