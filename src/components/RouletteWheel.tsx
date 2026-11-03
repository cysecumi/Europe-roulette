import React, { useEffect, useRef } from 'react';
import { GamePhase } from '../types/roulette';
import { getColor, RED_NUMBERS, SLICE_ANGLE, WHEEL_NUMBERS } from '../utils/rouletteEngine';

interface RouletteWheelProps {
  phase: GamePhase;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
}

const BASE_SIZE = 420;

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  phase,
  targetNumber,
  onSpinComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation & Physics state kept in ref to decouple from React render cycles
  const stateRef = useRef({
    wheelAngle: 0,
    wheelSpeed: 0.003, // gentle idle rotation
    ballAngle: -Math.PI / 2,
    ballSpeed: 0,
    ballRadius: 172,
    isSpinning: false,
    spinStartTime: 0,
    spinDuration: 6200,
    targetWinIndex: 0,
    startWheelAngle: 0,
    targetWheelAngle: 0,
    bounces: [] as { time: number; amplitude: number }[],
    idleAnimId: 0
  });

  // Handle spin trigger when phase changes to SPINNING
  useEffect(() => {
    if (phase === 'SPINNING' && targetNumber !== null && !stateRef.current.isSpinning) {
      const state = stateRef.current;
      state.isSpinning = true;
      state.spinStartTime = performance.now();

      const winIndex = WHEEL_NUMBERS.indexOf(targetNumber);
      state.targetWinIndex = winIndex >= 0 ? winIndex : 0;

      // Wheel spins clockwise: 4 to 6 full rotations + slot offset
      const baseWheelSpins = 5;
      const currentRot = state.wheelAngle % (Math.PI * 2);
      state.startWheelAngle = currentRot;

      // Calculate final wheel angle so the target pocket aligns near the 12 o'clock pointer or specific angle
      // Pocket angle relative to wheel: winIndex * SLICE_ANGLE
      // At top pointer (-Math.PI / 2): wheelAngle + winIndex * SLICE_ANGLE = -Math.PI / 2 + 2*PI*k
      state.targetWheelAngle =
        currentRot +
        baseWheelSpins * Math.PI * 2 +
        (Math.PI * 2 - (winIndex * SLICE_ANGLE));

      state.ballSpeed = 0.35; // high launch speed counter-clockwise
    }
  }, [phase, targetNumber]);

  // Main 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI Retina scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BASE_SIZE * dpr;
    canvas.height = BASE_SIZE * dpr;

    let isMounted = true;

    function render(now: number) {
      if (!isMounted || !ctx) return;

      const state = stateRef.current;
      const cx = BASE_SIZE / 2;
      const cy = BASE_SIZE / 2;
      const outerRimRadius = 196;
      const ballTrackRadius = 172;
      const deflectorRadius = 156;
      const pocketOuterRadius = 142;
      const pocketInnerRadius = 100;
      const hubRadius = 36;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, BASE_SIZE, BASE_SIZE);

      if (state.isSpinning) {
        const elapsed = now - state.spinStartTime;
        const progress = Math.min(elapsed / state.spinDuration, 1);

        // Quintic ease-out for smooth natural wheel deceleration
        const easeWheel = 1 - Math.pow(1 - progress, 4.2);
        state.wheelAngle = state.startWheelAngle + (state.targetWheelAngle - state.startWheelAngle) * easeWheel;

        // Ball physics in 3 phases:
        // Phase 1 (0 -> 0.55): Fast orbit on outer raceway with air friction deceleration
        // Phase 2 (0.55 -> 0.85): Drops down the slope past deflectors, bouncing with radial impulse
        // Phase 3 (0.85 -> 1.0): Chatters across frets and locks into target pocket slot
        if (progress < 0.55) {
          // Ball orbiting fast counter-clockwise
          const ballProgress = progress / 0.55;
          const currentBallSpeed = 0.32 * Math.pow(1 - ballProgress * 0.45, 1.8);
          state.ballAngle -= currentBallSpeed;
          state.ballRadius = ballTrackRadius;
        } else if (progress < 0.85) {
          // Ball drops inward and collides with deflectors
          const dropProgress = (progress - 0.55) / 0.3;
          const dropEase = Math.pow(dropProgress, 2.2);
          
          // Micro deflector collision bounce jitter
          const deflectorBounce = Math.sin(dropProgress * Math.PI * 7) * (1 - dropProgress) * 4.5;
          state.ballRadius = ballTrackRadius - (ballTrackRadius - deflectorRadius) * dropEase + deflectorBounce;
          
          const midSpeed = 0.17 * Math.pow(1 - dropProgress * 0.6, 2);
          state.ballAngle -= midSpeed;
        } else {
          // Pocket chatter and final lock
          const pocketProgress = (progress - 0.85) / 0.15;
          
          // Chatters across frets (rapid dampened vibration)
          const chatterDamp = Math.sin(pocketProgress * Math.PI * 8) * Math.pow(1 - pocketProgress, 2) * 5;
          state.ballRadius = deflectorRadius - (deflectorRadius - 122) * pocketProgress + chatterDamp;

          // The target pocket angle in absolute coordinates
          const targetPocketAngle = state.wheelAngle + state.targetWinIndex * SLICE_ANGLE - Math.PI / 2;

          // Blend ball angle into the target pocket slot
          const blendFactor = Math.min(1, Math.pow(pocketProgress, 2.5));
          state.ballAngle = state.ballAngle * (1 - blendFactor) + targetPocketAngle * blendFactor;
        }

        if (progress >= 1) {
          state.isSpinning = false;
          // Synchronize ball firmly to the pocket
          const targetPocketAngle = state.wheelAngle + state.targetWinIndex * SLICE_ANGLE - Math.PI / 2;
          state.ballAngle = targetPocketAngle;
          state.ballRadius = 122;
          
          if (targetNumber !== null) {
            onSpinComplete(targetNumber);
          }
        }
      } else {
        // Idle gentle rotation to keep table visually engaging
        state.wheelAngle += 0.0025;
        // Keep ball resting inside the settled pocket
        const currentPocketAngle = state.wheelAngle + state.targetWinIndex * SLICE_ANGLE - Math.PI / 2;
        state.ballAngle = currentPocketAngle;
        state.ballRadius = 122;
      }

      // ================= DRAW WHEEL =================

      // 1. Mahogany Outer Bowl Edge
      ctx.save();
      ctx.translate(cx, cy);

      // Deep bowl shadow
      ctx.beginPath();
      ctx.arc(0, 0, outerRimRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Mahogany wood gradient rim
      const woodGrad = ctx.createRadialGradient(0, 0, pocketOuterRadius, 0, 0, outerRimRadius);
      woodGrad.addColorStop(0, '#1c0f08');
      woodGrad.addColorStop(0.35, '#2e190e');
      woodGrad.addColorStop(0.7, '#422213');
      woodGrad.addColorStop(0.9, '#25130b');
      woodGrad.addColorStop(1, '#150a05');
      ctx.beginPath();
      ctx.arc(0, 0, outerRimRadius, 0, Math.PI * 2);
      ctx.fillStyle = woodGrad;
      ctx.fill();

      // Outer polished brass bevel
      ctx.beginPath();
      ctx.arc(0, 0, outerRimRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#cda135';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner brass ring on wood edge
      ctx.beginPath();
      ctx.arc(0, 0, ballTrackRadius + 9, 0, Math.PI * 2);
      const brassBezel = ctx.createLinearGradient(-outerRimRadius, -outerRimRadius, outerRimRadius, outerRimRadius);
      brassBezel.addColorStop(0, '#fef08a');
      brassBezel.addColorStop(0.3, '#d97706');
      brassBezel.addColorStop(0.5, '#fde047');
      brassBezel.addColorStop(0.8, '#b45309');
      brassBezel.addColorStop(1, '#fef08a');
      ctx.strokeStyle = brassBezel;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Ball Raceway / Track (dark recessed metallic track)
      const trackGrad = ctx.createRadialGradient(0, 0, deflectorRadius, 0, 0, ballTrackRadius + 8);
      trackGrad.addColorStop(0, '#0c0e12');
      trackGrad.addColorStop(0.5, '#171b22');
      trackGrad.addColorStop(1, '#090a0d');
      ctx.beginPath();
      ctx.arc(0, 0, ballTrackRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = trackGrad;
      ctx.fill();

      // 8 Bronze Diamond Deflectors (Frets)
      for (let d = 0; d < 8; d++) {
        const dAngle = (d * Math.PI) / 4;
        ctx.save();
        ctx.rotate(dAngle);
        ctx.translate(deflectorRadius + 6, 0);

        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        
        const defGrad = ctx.createLinearGradient(-8, -6, 8, 6);
        defGrad.addColorStop(0, '#fef08a');
        defGrad.addColorStop(0.5, '#d97706');
        defGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = defGrad;
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore(); // Undo center translate for outer static rim

      // ================= ROTATING WHEEL (ROTOR) =================
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(state.wheelAngle);

      // Rotating pocket base plate
      ctx.beginPath();
      ctx.arc(0, 0, pocketOuterRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();

      // Draw 37 numbered pocket slices
      for (let i = 0; i < 37; i++) {
        const num = WHEEL_NUMBERS[i];
        const startA = i * SLICE_ANGLE - SLICE_ANGLE / 2 - Math.PI / 2;
        const endA = startA + SLICE_ANGLE;

        // Slice wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, pocketOuterRadius, startA, endA);
        ctx.closePath();

        let sliceColor = '#10b981'; // 0 is emerald
        if (num !== 0) {
          sliceColor = RED_NUMBERS.includes(num) ? '#dc2626' : '#18181b';
        }
        ctx.fillStyle = sliceColor;
        ctx.fill();

        // Polished metal pocket frets (dividers)
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // High-contrast pocket number text
        const textAngle = startA + SLICE_ANGLE / 2;
        const textDist = pocketOuterRadius - 18;
        const tx = Math.cos(textAngle) * textDist;
        const ty = Math.sin(textAngle) * textDist;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(textAngle + Math.PI / 2); // Orient text outwards
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 2;
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
      }

      // Inner Pocket Ball Recess Ring
      ctx.beginPath();
      ctx.arc(0, 0, pocketInnerRadius, 0, Math.PI * 2);
      const innerRecessGrad = ctx.createRadialGradient(0, 0, hubRadius, 0, 0, pocketInnerRadius);
      innerRecessGrad.addColorStop(0, '#2d1806');
      innerRecessGrad.addColorStop(0.6, '#180e05');
      innerRecessGrad.addColorStop(1, '#0f0802');
      ctx.fillStyle = innerRecessGrad;
      ctx.fill();

      // Pocket inner brass barrier
      ctx.beginPath();
      ctx.arc(0, 0, pocketInnerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Brass Center Cone / Turret
      const coneGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, hubRadius);
      coneGrad.addColorStop(0, '#fef9c3');
      coneGrad.addColorStop(0.2, '#fde047');
      coneGrad.addColorStop(0.5, '#ca8a04');
      coneGrad.addColorStop(0.8, '#854d0e');
      coneGrad.addColorStop(1, '#451a03');
      ctx.beginPath();
      ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
      ctx.fillStyle = coneGrad;
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4-Spoke Ornamental Handle on Central Spindle
      for (let s = 0; s < 4; s++) {
        const sAngle = (s * Math.PI) / 2;
        ctx.save();
        ctx.rotate(sAngle);
        
        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.lineTo(-2, hubRadius + 14);
        ctx.lineTo(2, hubRadius + 14);
        ctx.lineTo(3, 8);
        ctx.closePath();

        const spokeGrad = ctx.createLinearGradient(-3, 8, 3, hubRadius + 14);
        spokeGrad.addColorStop(0, '#fef08a');
        spokeGrad.addColorStop(0.5, '#ca8a04');
        spokeGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = spokeGrad;
        ctx.fill();

        // Tip finial ball
        ctx.beginPath();
        ctx.arc(0, hubRadius + 14, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      // Central Acorn Finial
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      const acornGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
      acornGrad.addColorStop(0, '#ffffff');
      acornGrad.addColorStop(0.3, '#fef08a');
      acornGrad.addColorStop(0.7, '#ca8a04');
      acornGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = acornGrad;
      ctx.fill();

      ctx.restore(); // Undo rotating wheel context

      // ================= BALL RENDERING =================
      const bx = cx + Math.cos(state.ballAngle) * state.ballRadius;
      const by = cy + Math.sin(state.ballAngle) * state.ballRadius;
      const ballSize = 6.5;

      // Ball directional drop shadow
      ctx.beginPath();
      ctx.arc(bx + 2.5, by + 3.5, ballSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.filter = 'blur(1.5px)';
      ctx.fill();
      ctx.filter = 'none';

      // Ball ivory sphere with specular highlight
      ctx.beginPath();
      ctx.arc(bx, by, ballSize, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(
        bx - ballSize * 0.35,
        by - ballSize * 0.35,
        ballSize * 0.1,
        bx,
        by,
        ballSize
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.2, '#f8fafc');
      ballGrad.addColorStop(0.65, '#e2e8f0');
      ballGrad.addColorStop(0.95, '#94a3b8');
      ballGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Top Reference Pointer Indicator (12 o'clock gold chevron)
      ctx.save();
      ctx.translate(cx, 10);
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 16);
      ctx.closePath();
      const pointerGrad = ctx.createLinearGradient(-10, 0, 10, 16);
      pointerGrad.addColorStop(0, '#fde047');
      pointerGrad.addColorStop(0.5, '#ca8a04');
      pointerGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = pointerGrad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      state.idleAnimId = requestAnimationFrame(render);
    }

    stateRef.current.idleAnimId = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      cancelAnimationFrame(stateRef.current.idleAnimId);
    };
  }, [onSpinComplete, targetNumber]);

  return (
    <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full block drop-shadow-2xl"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
