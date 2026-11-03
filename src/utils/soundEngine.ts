/**
 * Web Audio API Sound Synthesizer for Casino Suite
 * Zero external audio files required. Generates realistic casino effects in real-time.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let soundVolume = 0.8;
let masterGain: GainNode | null = null;

// Initialize AudioContext on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (audioCtx && !masterGain) {
    masterGain = audioCtx.createGain();
    const currentVol = getSoundVolume();
    const isEnabled = getSoundEnabled();
    masterGain.gain.setValueAtTime(isEnabled ? currentVol : 0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function updateMasterGain() {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(soundEnabled ? soundVolume : 0, audioCtx.currentTime);
  }
}

export function setSoundVolume(vol: number) {
  soundVolume = Math.max(0, Math.min(1, vol));
  localStorage.setItem('rr_sound_volume', String(soundVolume));
  updateMasterGain();
}

export function getSoundVolume(): number {
  if (typeof window === 'undefined') return 0.8;
  const saved = localStorage.getItem('rr_sound_volume');
  if (saved !== null) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed)) soundVolume = Math.max(0, Math.min(1, parsed));
  }
  return soundVolume;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  localStorage.setItem('rr_sound_enabled', enabled ? 'true' : 'false');
  updateMasterGain();
}

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('rr_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
  return soundEnabled;
}

export function toggleSound(): boolean {
  const next = !getSoundEnabled();
  setSoundEnabled(next);
  if (next) {
    playChipClick();
  }
  return next;
}

function getMasterNode(): AudioNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  return masterGain || ctx.destination;
}

/**
 * Chip click / placement sound (short high-pitched ceramic tap)
 */
export function playChipClick() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  const dest = getMasterNode();
  if (!ctx || !dest) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Card flip / deal sound (crisp filtered noise burst)
 */
export function playCardFlip() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  const dest = getMasterNode();
  if (!ctx || !dest) return;

  try {
    const bufferSize = ctx.sampleRate * 0.06; // 60ms noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    whiteNoise.start();
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Roulette / Mega Wheel tick sound
 */
export function playWheelTick() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  const dest = getMasterNode();
  if (!ctx || !dest) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Sic Bo Dice Roll sound (multiple rattling noise pops)
 */
export function playDiceRoll() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  const dest = getMasterNode();
  if (!ctx || !dest) return;

  try {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!getSoundEnabled()) return;
        const subCtx = getAudioContext();
        const subDest = getMasterNode();
        if (!subCtx || !subDest) return;
        const osc = subCtx.createOscillator();
        const gain = subCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 + Math.random() * 200, subCtx.currentTime);
        gain.gain.setValueAtTime(0.1, subCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, subCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(subDest);
        osc.start();
        osc.stop(subCtx.currentTime + 0.04);
      }, i * 60);
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Win fanfare / uplifting chord chime
 */
export function playWinChime() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  const dest = getMasterNode();
  if (!ctx || !dest) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
    });
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Lose sound (low descending tone)
 */
export function playLoseSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  const dest = getMasterNode();
  if (!ctx || !dest) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}
