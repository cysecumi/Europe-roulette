import React, { useEffect, useState } from 'react';

interface ParticleOverlayProps {
  trigger: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
}

export const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ trigger, onComplete }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      const timer = setTimeout(() => {
        setActive(false);
        if (onComplete) onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  useEffect(() => {
    if (!active) return;

    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate Golden Dust & Neon Purple particles
    const particles: Particle[] = [];
    const colors = ['#f59e0b', '#fbbf24', '#d97706', '#a855f7', '#c084fc', '#e879f9', '#e2e8f0'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        id: i,
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 200,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 12 - 3,
        alpha: 1,
        life: Math.random() * 60 + 40
      });
    }

    // Neon Purple Pulses
    let pulseRadius = 10;
    let pulseAlpha = 0.8;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw expanding Neon Purple pulse rings
      if (pulseAlpha > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${pulseAlpha})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.restore();

        pulseRadius += 12;
        pulseAlpha -= 0.02;
      }

      // Draw second pulse ring
      if (pulseRadius > 80 && pulseAlpha > -0.2) {
        const p2Radius = pulseRadius - 60;
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, p2Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${Math.max(0, pulseAlpha + 0.1)})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw Golden Dust & Neon particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.alpha -= 0.015;

        if (p.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <canvas id="particle-canvas" className="w-full h-full" />
    </div>
  );
};
