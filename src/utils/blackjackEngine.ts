import { Card, Hand, HandResult, Rank, Suit } from '../types/blackjack';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  spades: 'black',
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black'
};

let cardUniqueCounter = 0;

export function createDeck(decksCount = 6): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < decksCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = 10;
        if (rank === 'A') {
          value = 11;
        } else if (['2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(rank)) {
          value = parseInt(rank, 10);
        }

        deck.push({
          id: `c-${suit}-${rank}-${d}-${cardUniqueCounter++}`,
          suit,
          rank,
          value,
          isFaceUp: true
        });
      }
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateHandScore(cards: Card[]): {
  score: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
} {
  // Only calculate face-up cards
  const visibleCards = cards.filter(c => c.isFaceUp);

  let rawTotal = 0;
  let aceCount = 0;

  for (const card of visibleCards) {
    if (card.rank === 'A') {
      aceCount++;
      rawTotal += 11;
    } else {
      rawTotal += card.value;
    }
  }

  // Reduce Aces from 11 to 1 while rawTotal > 21
  let isSoft = false;
  while (rawTotal > 21 && aceCount > 0) {
    rawTotal -= 10;
    aceCount--;
  }

  // If there's an Ace still counting as 11, it's a soft hand
  isSoft = aceCount > 0;

  const isBust = rawTotal > 21;
  const isBlackjack = visibleCards.length === 2 && rawTotal === 21;

  return {
    score: rawTotal,
    isSoft,
    isBust,
    isBlackjack
  };
}

export function evaluateHandOutcome(playerHand: Hand, dealerHand: Hand): HandResult {
  const pScore = playerHand.score;
  const dScore = dealerHand.score;

  // 1. Player busted
  if (playerHand.isBust) {
    return {
      outcome: 'BUST',
      payout: 0,
      message: 'Bust! Anda melebihi 21.'
    };
  }

  // 2. Player Natural Blackjack (21 on 2 cards)
  if (playerHand.isBlackjack) {
    if (dealerHand.isBlackjack) {
      return {
        outcome: 'PUSH',
        payout: playerHand.bet,
        message: 'Push! Keduanya mendapatkan Blackjack.'
      };
    }
    // Blackjack pays 3:2 -> returns original bet + 1.5 * bet
    const winAmount = playerHand.bet + Math.floor(playerHand.bet * 1.5);
    return {
      outcome: 'BLACKJACK',
      payout: winAmount,
      message: 'BLACKJACK! Pembayaran 3:2 🎉'
    };
  }

  // 3. Dealer has Blackjack while player does not
  if (dealerHand.isBlackjack) {
    return {
      outcome: 'LOSE',
      payout: 0,
      message: 'Dealer mendapatkan Blackjack.'
    };
  }

  // 4. Dealer busted
  if (dealerHand.isBust) {
    return {
      outcome: 'DEALER_BUST',
      payout: playerHand.bet * 2,
      message: 'Dealer Bust! Anda menang 1:1 🎉'
    };
  }

  // 5. Normal score comparisons
  if (pScore > dScore) {
    return {
      outcome: 'WIN',
      payout: playerHand.bet * 2,
      message: `Anda menang! (${pScore} vs ${dScore}) 🎉`
    };
  }

  if (pScore < dScore) {
    return {
      outcome: 'LOSE',
      payout: 0,
      message: `Dealer menang. (${dScore} vs ${pScore})`
    };
  }

  // 6. Tie / Push
  return {
    outcome: 'PUSH',
    payout: playerHand.bet,
    message: `Push! Seri di nilai ${pScore}.`
  };
}
