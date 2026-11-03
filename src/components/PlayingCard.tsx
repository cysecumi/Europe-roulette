import React from 'react';
import { Card } from '../types/blackjack';
import { SUIT_COLORS, SUIT_SYMBOLS } from '../utils/blackjackEngine';

interface PlayingCardProps {
  card: Card;
  className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, className = '' }) => {
  const isRed = SUIT_COLORS[card.suit] === 'red';
  const symbol = SUIT_SYMBOLS[card.suit];

  if (!card.isFaceUp) {
    // Face Down Card Back
    return (
      <div
        className={`relative w-18 h-26 sm:w-22 sm:h-32 rounded-xl bg-gradient-to-br from-amber-700 via-amber-900 to-slate-950 p-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.6)] border-2 border-amber-400/80 select-none animate-scale-in shrink-0 ${className}`}
      >
        <div className="w-full h-full rounded-lg border border-amber-300/40 bg-[radial-gradient(#e2c044_1px,transparent_1px)] [background-size:6px_6px] flex items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-amber-400/80 bg-black/60 flex items-center justify-center shadow-inner">
            <span className="text-amber-300 text-xs sm:text-sm font-serif-royal font-bold">
              CR
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Face Up Card
  return (
    <div
      className={`relative w-18 h-26 sm:w-22 sm:h-32 rounded-xl bg-gradient-to-b from-white via-slate-50 to-slate-100 p-2 shadow-[0_6px_16px_rgba(0,0,0,0.5)] border border-slate-300/80 select-none flex flex-col justify-between animate-scale-in shrink-0 ${
        isRed ? 'text-red-600' : 'text-slate-950'
      } ${className}`}
    >
      {/* Top-Left Corner */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-extrabold text-sm sm:text-base font-mono tracking-tighter">
          {card.rank}
        </span>
        <span className="text-xs sm:text-sm leading-none">{symbol}</span>
      </div>

      {/* Center Large Suit Icon */}
      <div className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center text-2xl sm:text-3xl opacity-90 pointer-events-none drop-shadow-xs">
        {symbol}
      </div>

      {/* Bottom-Right Corner (Inverted) */}
      <div className="flex flex-col items-center leading-none self-end rotate-180">
        <span className="font-extrabold text-sm sm:text-base font-mono tracking-tighter">
          {card.rank}
        </span>
        <span className="text-xs sm:text-sm leading-none">{symbol}</span>
      </div>
    </div>
  );
};
