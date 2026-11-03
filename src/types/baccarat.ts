export type BaccaratBetType = 'player' | 'banker' | 'tie' | 'player_pair' | 'banker_pair';

export interface BaccaratCard {
  id: string;
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  rank: string;
  value: number; // 0-9
}

export interface BaccaratResult {
  playerHand: BaccaratCard[];
  bankerHand: BaccaratCard[];
  playerScore: number;
  bankerScore: number;
  winner: 'player' | 'banker' | 'tie';
  playerPair: boolean;
  bankerPair: boolean;
  payoutMultiplier: number;
}
