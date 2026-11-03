import { BaccaratCard, BaccaratResult, BaccaratBetType } from '../types/baccarat';

const SUITS: ('spades' | 'hearts' | 'diamonds' | 'clubs')[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let cardSeq = 0;

export function getRandomBaccaratCard(): BaccaratCard {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  let value = 0;
  if (rank === 'A') value = 1;
  else if (['10', 'J', 'Q', 'K'].includes(rank)) value = 0;
  else value = parseInt(rank, 10);

  return {
    id: `bac-${suit}-${rank}-${cardSeq++}`,
    suit,
    rank,
    value
  };
}

export function calculateBaccaratScore(cards: BaccaratCard[]): number {
  const sum = cards.reduce((acc, c) => acc + c.value, 0);
  return sum % 10;
}

export function simulateBaccaratRound(winRate: number, activeBets: Record<BaccaratBetType, number>): BaccaratResult {
  const clampedWinRate = Math.max(0, Math.min(100, winRate));
  const shouldWin = Math.random() * 100 < clampedWinRate;

  // Find what user bet on (highest bet or any bet)
  const betEntries = Object.entries(activeBets).filter(([_, amt]) => amt > 0);
  let targetWinner: 'player' | 'banker' | 'tie' = 'player';
  if (betEntries.length > 0) {
    // pick one of the user's bet types if shouldWin is true
    const userBets = betEntries.map(([type]) => type as BaccaratBetType);
    if (shouldWin) {
      const validWins = userBets.filter(b => b === 'player' || b === 'banker' || b === 'tie');
      if (validWins.length > 0) {
        targetWinner = validWins[Math.floor(Math.random() * validWins.length)] as any;
      }
    }
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const p1 = getRandomBaccaratCard();
    const p2 = getRandomBaccaratCard();
    const b1 = getRandomBaccaratCard();
    const b2 = getRandomBaccaratCard();

    const playerHand = [p1, p2];
    const bankerHand = [b1, b2];

    let pScore = calculateBaccaratScore(playerHand);
    let bScore = calculateBaccaratScore(bankerHand);

    // Natural win check (8 or 9)
    let thirdCardPlayer: BaccaratCard | null = null;
    let thirdCardBanker: BaccaratCard | null = null;

    if (pScore < 8 && bScore < 8) {
      // Player draws if 0-5
      if (pScore <= 5) {
        thirdCardPlayer = getRandomBaccaratCard();
        playerHand.push(thirdCardPlayer);
        pScore = calculateBaccaratScore(playerHand);
      }

      // Banker draw rules
      if (thirdCardPlayer === null) {
        if (bScore <= 5) {
          thirdCardBanker = getRandomBaccaratCard();
          bankerHand.push(thirdCardBanker);
          bScore = calculateBaccaratScore(bankerHand);
        }
      } else {
        const p3Val = thirdCardPlayer.value;
        let bankerDraw = false;
        if (bScore <= 2) bankerDraw = true;
        else if (bScore === 3 && p3Val !== 8) bankerDraw = true;
        else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bankerDraw = true;
        else if (bScore === 5 && [4, 5, 6, 7].includes(p3Val)) bankerDraw = true;
        else if (bScore === 6 && [6, 7].includes(p3Val)) bankerDraw = true;

        if (bankerDraw) {
          thirdCardBanker = getRandomBaccaratCard();
          bankerHand.push(thirdCardBanker);
          bScore = calculateBaccaratScore(bankerHand);
        }
      }
    }

    let winner: 'player' | 'banker' | 'tie' = 'tie';
    if (pScore > bScore) winner = 'player';
    else if (bScore > pScore) winner = 'banker';

    const playerPair = p1.rank === p2.rank;
    const bankerPair = b1.rank === b2.rank;

    if ((shouldWin && winner === targetWinner) || (!shouldWin && winner !== targetWinner) || attempt === 49) {
      let payoutMultiplier = 0;
      // calculate payout against active bets
      for (const [betType, amt] of Object.entries(activeBets)) {
        if (amt <= 0) continue;
        if (betType === 'player' && winner === 'player') payoutMultiplier += 2; // 1:1 + original
        if (betType === 'banker' && winner === 'banker') payoutMultiplier += 1.95; // 0.95:1
        if (betType === 'tie' && winner === 'tie') payoutMultiplier += 9; // 8:1
        if (betType === 'player_pair' && playerPair) payoutMultiplier += 12; // 11:1
        if (betType === 'banker_pair' && bankerPair) payoutMultiplier += 12; // 11:1
      }

      return {
        playerHand,
        bankerHand,
        playerScore: pScore,
        bankerScore: bScore,
        winner,
        playerPair,
        bankerPair,
        payoutMultiplier
      };
    }
  }

  // Fallback
  return {
    playerHand: [getRandomBaccaratCard(), getRandomBaccaratCard()],
    bankerHand: [getRandomBaccaratCard(), getRandomBaccaratCard()],
    playerScore: 7,
    bankerScore: 5,
    winner: 'player',
    playerPair: false,
    bankerPair: false,
    payoutMultiplier: 2
  };
}
