/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playChipClick, playWinChime, playLoseSound, playWheelTick } from '../utils/soundEngine';
import { Sparkles, Play, Shield, Zap, TrendingUp, RotateCcw } from 'lucide-react';

interface PlinkoTableProps {
  balance: number;
  onUpdateBalance: (newBalance: number | ((prev: number) => number)) => void;
  showToast: (msg: string, icon?: string) => void;
  winRate: number;
  onTriggerParticles: () => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  bet: number;
  active: boolean;
}

// Multiplier generation function: Max multiplier capped at 100x with balanced distribution
const getMultipliers = (rows: number, risk: 'low' | 'medium' | 'high'): number[] => {
  const count = rows + 1;
  const multipliers: number[] = new Array(count);
  const mid = (count - 1) / 2;

  let edgeMult = 10;
  let centerMult = 0.5;

  if (risk === 'low') {
    edgeMult = rows <= 10 ? 5 : rows <= 14 ? 8 : 12;
    centerMult = 0.8;
  } else if (risk === 'medium') {
    edgeMult = rows <= 10 ? 15 : rows <= 14 ? 30 : 50;
    centerMult = 0.4;
  } else {
    // High - max edge multiplier capped at 100x as requested
    edgeMult = rows <= 10 ? 35 : rows <= 14 ? 70 : 100;
    centerMult = 0.2;
  }

  for (let i = 0; i < count; i++) {
    const distFromCenter = Math.abs(i - mid) / mid; // 0 at center, 1 at edges
    const val = centerMult + (edgeMult - centerMult) * Math.pow(distFromCenter, 2.0);
    multipliers[i] = Math.max(0.2, parseFloat(val.toFixed(1)));
  }

  return multipliers;
};

export const PlinkoTable: React.FC<PlinkoTableProps> = ({
  balance,
  onUpdateBalance,
  showToast,
  winRate,
  onTriggerParticles
}) => {
  const [rows, setRows] = useState<number>(12);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [multipliers, setMultipliers] = useState<number[]>(() => getMultipliers(12, 'low'));
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const requestRef = useRef<number | null>(null);
  const nextBallIdRef = useRef<number>(1);

  // Update multipliers when rows or risk change
  useEffect(() => {
    setMultipliers(getMultipliers(rows, risk));
  }, [rows, risk]);

  // Drop a new ball with randomized apex spread for true randomness
  const handleDropBall = useCallback(() => {
    if (balance < betAmount) {
      showToast('Saldo tidak mencukupi untuk taruhan Plinko!', '💳');
      return;
    }

    playChipClick();
    onUpdateBalance(prev => prev - betAmount);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 580;

    const newBall: Ball = {
      id: nextBallIdRef.current++,
      x: width / 2 + (Math.random() - 0.5) * 24, // wider drop scatter for genuine randomness
      y: 15,
      vx: (Math.random() - 0.5) * 2.0,
      vy: 0.5,
      radius: 7,
      color: risk === 'high' ? '#f43f5e' : risk === 'medium' ? '#a855f7' : '#fbbf24',
      bet: betAmount,
      active: true
    };

    ballsRef.current.push(newBall);
  }, [balance, betAmount, onUpdateBalance, risk, showToast]);

  // Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning || !canvas || !ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090812');
      bgGrad.addColorStop(1, '#020106');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Calculate peg layout
      const paddingX = 50;
      const availableWidth = width - paddingX * 2;
      const startY = 55;
      const endY = height - 85;
      const rowHeight = (endY - startY) / rows;

      const pegs: { x: number; y: number; r: number }[] = [];

      for (let r = 0; r < rows; r++) {
        const pegsInRow = r + 1;
        const currentSpacing = availableWidth / (rows + 1);
        const rowWidth = (pegsInRow - 1) * currentSpacing;
        const rowStartX = width / 2 - rowWidth / 2;

        for (let c = 0; c < pegsInRow; c++) {
          const px = rowStartX + c * currentSpacing;
          const py = startY + r * rowHeight;
          pegs.push({ x: px, y: py, r: 4 });

          // Draw Peg
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.shadowColor = '#cbd5e1';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Slot Bins at bottom
      const slotWidth = availableWidth / (rows + 1);
      const slotY = endY + 15;
      const slotHeight = 42;
      const slotStartX = width / 2 - availableWidth / 2;

      multipliers.forEach((mult, idx) => {
        const sx = slotStartX + idx * slotWidth;
        const isHigh = mult >= 20;
        const isMid = mult >= 5;

        ctx.fillStyle = isHigh ? 'rgba(244, 63, 94, 0.35)' : isMid ? 'rgba(168, 85, 247, 0.3)' : 'rgba(234, 179, 8, 0.2)';
        ctx.strokeStyle = isHigh ? '#f43f5e' : isMid ? '#c084fc' : '#fbbf24';
        ctx.lineWidth = 1.5;

        // Rounded box for slot
        ctx.beginPath();
        ctx.roundRect(sx + 2, slotY, slotWidth - 4, slotHeight, 8);
        ctx.fill();
        ctx.stroke();

        // Slot Multiplier Text
        ctx.fillStyle = isHigh ? '#fda4af' : isMid ? '#e9d5ff' : '#fde047';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${mult}x`, sx + slotWidth / 2, slotY + slotHeight / 2);
      });

      // Update & Draw Balls with enhanced random scatter physics
      const activeBalls = ballsRef.current;
      const gravity = 0.35;
      const friction = 0.992;

      activeBalls.forEach(ball => {
        if (!ball.active) return;

        // Apply physics
        ball.vy += gravity;
        ball.vx *= friction;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions (left/right bounds)
        if (ball.x - ball.radius < paddingX) {
          ball.x = paddingX + ball.radius;
          ball.vx *= -0.7;
        } else if (ball.x + ball.radius > width - paddingX) {
          ball.x = width - paddingX - ball.radius;
          ball.vx *= -0.7;
        }

        // Peg collisions with strong randomization to prevent side-trapping
        pegs.forEach(peg => {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ball.radius + peg.r;

          if (dist < minDist) {
            playWheelTick(); // bounce sound tick
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const bounceSpeed = Math.max(speed * 0.65, 2.4);

            // Robust random scatter so balls bounce left/right randomly and evenly across the board
            const randomScatter = (Math.random() - 0.5) * 5.0;
            const winRateFactor = (winRate - 50) / 100; // -0.5 to +0.5
            const bias = winRateFactor * 1.5;

            ball.vx = Math.cos(angle) * bounceSpeed + randomScatter + bias;
            ball.vy = Math.sin(angle) * bounceSpeed + Math.abs(randomScatter) * 0.15;

            // Push out of collision
            ball.x = peg.x + Math.cos(angle) * minDist;
            ball.y = peg.y + Math.sin(angle) * minDist;
          }
        });

        // Check Slot Landing
        if (ball.y >= slotY) {
          ball.active = false;

          // Determine slot index
          const relX = ball.x - slotStartX;
          let slotIndex = Math.floor(relX / slotWidth);
          slotIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));

          const multiplier = multipliers[slotIndex];
          const winAmount = Math.round(ball.bet * multiplier);

          if (winAmount > ball.bet) {
            playWinChime();
            onTriggerParticles();
            showToast(`PLINKO MENANG! +$${winAmount.toLocaleString()} (${multiplier}x)`, '🎉');
          } else {
            playLoseSound();
          }

          onUpdateBalance(prev => prev + winAmount);
          setLastWin({ amount: winAmount, multiplier });
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Cleanup inactive balls
      ballsRef.current = activeBalls.filter(b => b.active);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [rows, multipliers, winRate, onUpdateBalance, onTriggerParticles, showToast]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center justify-center w-full max-w-6xl mx-auto">
      {/* LEFT: Plinko Control Deck & Settings */}
      <div className="flex flex-col gap-4 w-full xl:w-[360px] p-5 rounded-3xl bg-zinc-950/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <h2 className="text-base font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
              Plinko Arcade
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-900/60 text-purple-300 border border-purple-500/50">
            2D Physics
          </span>
        </div>

        {/* Bet Amount Control */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
            <span>Taruhan Bola ($)</span>
            <span className="text-amber-400 font-mono">${betAmount}</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 25, 50, 100].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playChipClick();
                  setBetAmount(val);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  betAmount === val
                    ? 'bg-purple-950 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                    : 'bg-zinc-900 text-slate-300 border border-slate-800 hover:border-purple-500'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Rows Selector (8 to 16) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
            <span>Jumlah Baris Pasak</span>
            <span className="text-fuchsia-300 font-mono">{rows} Baris</span>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[8, 10, 12, 14, 16].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  playChipClick();
                  setRows(r);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  rows === r
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                    : 'bg-zinc-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Level Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
            <span>Tingkat Risiko</span>
            <span className="text-amber-400 uppercase font-mono text-[11px]">{risk}</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['low', 'medium', 'high'] as const).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  playChipClick();
                  setRisk(lvl);
                }}
                className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  risk === lvl
                    ? lvl === 'high'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      : lvl === 'medium'
                      ? 'bg-purple-950 text-purple-300 border border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'bg-amber-950 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'bg-zinc-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Drop Ball Action Button */}
        <button
          type="button"
          onClick={handleDropBall}
          className="mt-2 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Jatuhkan Bola (${betAmount})</span>
        </button>

        {/* Last Win Banner */}
        {lastWin && (
          <div className="mt-1 p-3 rounded-2xl bg-black/60 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Hasil Terakhir:</span>
            <span className={lastWin.amount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {lastWin.multiplier}x (+$${lastWin.amount.toLocaleString()})
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: Plinko Canvas Arena */}
      <div className="flex flex-col items-center p-4 rounded-3xl bg-zinc-950/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={580}
          height={540}
          className="rounded-2xl border border-white/10 shadow-inner bg-black"
        />
        <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Fisika gravitasi acak nyata dengan integrasi Win Rate {winRate}%</span>
        </div>
      </div>
    </div>
  );
};
