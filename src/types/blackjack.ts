/**
 * Types and interfaces for Blackjack Royale
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // 1-11
  isFaceUp: boolean;
}

export interface Hand {
  cards: Card[];
  bet: number;
  isBust: boolean;
  isBlackjack: boolean;
  isStand: boolean;
  isDouble: boolean;
  score: number;
  isSoft: boolean;
  statusText?: string;
}

export type BlackjackPhase = 
  | 'BETTING'      // Placing chips in the circle
  | 'DEALING'      // Initial cards dealing animation
  | 'PLAYER_TURN'  // Hit, Stand, Double, Split
  | 'DEALER_TURN'  // Dealer draws to 17
  | 'ROUND_OVER';  // Settling bets and payouts

export type RoundOutcome = 
  | 'WIN' 
  | 'BLACKJACK' 
  | 'LOSE' 
  | 'BUST' 
  | 'PUSH' 
  | 'DEALER_BUST';

export interface HandResult {
  outcome: RoundOutcome;
  payout: number;
  message: string;
}
