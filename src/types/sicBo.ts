export type SicBoBetType = 
  | 'small' 
  | 'big' 
  | 'sum_4' | 'sum_5' | 'sum_6' | 'sum_7' | 'sum_8' | 'sum_9' | 'sum_10' | 'sum_11' | 'sum_12' | 'sum_13' | 'sum_14' | 'sum_15' | 'sum_16' | 'sum_17'
  | 'triple_1' | 'triple_2' | 'triple_3' | 'triple_4' | 'triple_5' | 'triple_6' | 'any_triple'
  | 'single_1' | 'single_2' | 'single_3' | 'single_4' | 'single_5' | 'single_6';

export interface SicBoResult {
  dice: [number, number, number];
  sum: number;
  isSmall: boolean;
  isBig: boolean;
  isTriple: boolean;
  winningBets: SicBoBetType[];
  totalPayoutMultiplier: number;
}
