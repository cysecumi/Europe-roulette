import React, { useState, useEffect, useRef } from 'react';
import { GamePhase } from '../types/roulette';
import { getColor, isRed, WHEEL_NUMBERS } from '../utils/rouletteEngine';
import { Sparkles, Lock, CheckCircle2, Crown } from 'lucide-react';

interface FourBlockAnimationProps {
  phase: GamePhase;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
}

interface BlockState {
  label: string;
  sublabel: string;
  value: number;
  isLocked: boolean;
  isMain: boolean;
}

export const FourBlockAnimation: React.FC<FourBlockAnimationProps> = ({
  phase,
  targetNumber,
  onSpinComplete
}) => {
  // 4 blocks state: Block 1, 2, 3, 4 (Block 4 is the primary Roulette winning number)
  const [blocks, setBlocks] = useState<BlockState[]>([
    { label: 'BLOK I', sublabel: 'KOMBINASI A', value: 14, isLocked: true, isMain: false },
    { label: 'BLOK II', sublabel: 'KOMBINASI B', value: 29, isLocked: true, isMain: false },
    { label: 'BLOK III', sublabel: 'KOMBINASI C', value: 7, isLocked: true, isMain: false },
    { label: 'BLOK IV', sublabel: 'ANGKA UTAMA', value: 26, isLocked: true, isMain: true }
  ]);

  const [rollingValues, setRollingValues] = useState<number[]>([14, 29, 7, 26]);
  const animationFrameRef = useRef<number | null>(null);
  const spinStartTimeRef = useRef<number>(0);
  const targetValuesRef = useRef<number[]>([14, 29, 7, 26]);
  const isSpinningRef = useRef<boolean>(false);

  // Trigger spin when phase becomes SPINNING
  useEffect(() => {
    if (phase === 'SPINNING' && targetNumber !== null && !isSpinningRef.current) {
      isSpinningRef.current = true;
      spinStartTimeRef.current = performance.now();

      // Generate random combination numbers for blocks 1, 2, 3, and targetNumber for block 4
      const b1 = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
      const b2 = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
      const b3 = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
      const b4 = targetNumber;

      targetValuesRef.current = [b1, b2, b3, b4];

      // Reset locked state
      setBlocks(prev =>
        prev.map((b, idx) => ({
          ...b,
          isLocked: false,
          value: targetValuesRef.current[idx]
        }))
      );

      // Lock timings in milliseconds:
      // Block 0 locks at 2200ms
      // Block 1 locks at 3200ms
      // Block 2 locks at 4200ms
      // Block 3 (Main) locks at 5400ms
      const lockTimes = [2200, 3200, 4200, 5400];
      const totalDuration = 5600;

      let lastShuffleTime = 0;

      function update(now: number) {
        const elapsed = now - spinStartTimeRef.current;

        // Shuffle unlocked blocks every 65ms
        if (now - lastShuffleTime > 65) {
          lastShuffleTime = now;
          setRollingValues(prev => {
            return prev.map((_, idx) => {
              // If elapsed past lock time, show target
              if (elapsed >= lockTimes[idx]) {
                return targetValuesRef.current[idx];
              }
              // In the last 1000ms before Block 4 locks, slow down Block 4 for suspense
              if (idx === 3 && elapsed > 4200) {
                // Slower shuffle for tension
                if (Math.random() > 0.4) {
                  return WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
                }
                return prev[idx];
              }
              return WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
            });
          });

          // Update locked state flags
          setBlocks(prev =>
            prev.map((b, idx) => ({
              ...b,
              isLocked: elapsed >= lockTimes[idx],
              value: targetValuesRef.current[idx]
            }))
          );
        }

        if (elapsed < totalDuration) {
          animationFrameRef.current = requestAnimationFrame(update);
        } else {
          // Finished!
          isSpinningRef.current = false;
          setRollingValues(targetValuesRef.current);
          setBlocks(prev =>
            prev.map((b, idx) => ({
              ...b,
              isLocked: true,
              value: targetValuesRef.current[idx]
            }))
          );
          const finalWinningNumber = targetNumber !== null ? targetNumber : targetValuesRef.current[3];
          onSpinComplete(finalWinningNumber);
        }
      }

      animationFrameRef.current = requestAnimationFrame(update);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, targetNumber, onSpinComplete]);

  // Synchronize targetNumber changes when not spinning (e.g. initial setup)
  useEffect(() => {
    if (phase !== 'SPINNING' && targetNumber !== null) {
      setRollingValues(prev => [prev[0], prev[1], prev[2], targetNumber]);
      setBlocks(prev => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], value: targetNumber, isLocked: true }
      ]);
    }
  }, [targetNumber, phase]);

  const getNumberColorClass = (num: number) => {
    if (num === 0) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
    return isRed(num)
      ? 'text-red-400 border-red-500/50 bg-red-950/40'
      : 'text-slate-100 border-slate-700 bg-slate-900/60';
  };

  const getBadgeStyle = (num: number) => {
    if (num === 0) return 'bg-emerald-600 text-white';
    return isRed(num) ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white border border-zinc-700';
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center gap-3">
      {/* Combination Bar Header */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/20 backdrop-blur-md">
        <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Kombinasi 4-Block
        </span>
        <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-slate-200">
          {rollingValues.map((v, i) => (
            <React.Fragment key={i}>
              <span
                className={`px-1.5 py-0.5 rounded-md ${
                  i === 3 ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30 font-black' : 'text-slate-300'
                }`}
              >
                {v < 10 ? `0${v}` : v}
              </span>
              {i < 3 && <span className="text-slate-600">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2x2 Grid of Luxury 4-Blocks */}
      <div className="w-full grid grid-cols-2 gap-3 aspect-square">
        {blocks.map((block, index) => {
          const currentValue = rollingValues[index];
          const color = getColor(currentValue);
          const isMain = block.isMain;
          const isLocked = block.isLocked;
          const colorClass = getNumberColorClass(currentValue);

          return (
            <div
              key={block.label}
              className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 overflow-hidden ${
                isMain
                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-black border-amber-500/50 shadow-[0_0_25px_rgba(234,179,8,0.25)]'
                  : 'bg-gradient-to-br from-slate-900/90 via-slate-950 to-black border-white/10 shadow-lg'
              } ${
                phase === 'SPINNING' && !isLocked
                  ? 'animate-pulse border-amber-400/60 ring-1 ring-amber-400/30'
                  : ''
              } ${
                isLocked && phase === 'SPINNING'
                  ? 'ring-2 ring-emerald-400/80'
                  : ''
              }`}
            >
              {/* Outer decorative corner notches */}
              <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/40" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/40" />
              <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/40" />
              <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/40" />

              {/* Block Top Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1">
                  {isMain ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                  )}
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      isMain ? 'text-amber-300 font-serif-royal' : 'text-slate-400'
                    }`}
                  >
                    {block.label}
                  </span>
                </div>

                {/* Status lock badge */}
                <div className="flex items-center gap-1">
                  {isLocked ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-tighter bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" /> LOCK
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-tighter bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30 animate-spin">
                      ROLL
                    </span>
                  )}
                </div>
              </div>

              {/* Center Large Rolling Display */}
              <div className="flex-1 flex flex-col items-center justify-center my-1 z-10">
                <div
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center font-mono font-black text-3xl sm:text-4xl shadow-inner border transition-all duration-100 ${colorClass} ${
                    phase === 'SPINNING' && !isLocked ? 'blur-[0.5px] scale-105' : 'scale-100'
                  }`}
                >
                  <span className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tabular-nums">
                    {currentValue}
                  </span>
                </div>

                {/* Mini color indicator */}
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      color === 'green'
                        ? 'bg-emerald-500'
                        : color === 'red'
                        ? 'bg-red-500'
                        : 'bg-zinc-800 border border-zinc-600'
                    }`}
                  />
                  <span className="text-slate-400">
                    {color === 'green' ? 'NOL' : color === 'red' ? 'MERAH' : 'HITAM'}
                  </span>
                </div>
              </div>

              {/* Block Bottom Label */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 z-10">
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight">
                  {block.sublabel}
                </span>
                {isMain && (
                  <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    HASIL ROULETTE
                  </span>
                )}
              </div>

              {/* Ambient radial glow in background */}
              {isMain && (
                <div className="absolute -inset-4 bg-amber-500/10 blur-xl pointer-events-none rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footnote note */}
      <div className="text-[11px] text-slate-400 text-center px-2">
        <span className="text-amber-400 font-bold">Blok IV</span> menentukan nomor pemenang roulette untuk semua taruhan meja.
      </div>
    </div>
  );
};
