import { isSoundMuted } from "./soundPrefs";
import type { TierId } from "./types";

// No audio files — everything here is synthesized with the Web Audio API so
// the app stays self-contained (no assets, no network dependency).
let audioCtx: AudioContext | null = null;

// The AudioContext can only be created/resumed after a user gesture (browser
// autoplay policy) — every call site here is already reached from a click,
// so lazily creating it on first use satisfies that without extra plumbing.
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => undefined);
  return audioCtx;
}

// Major pentatonic scale, extended across octaves by adding 12 semitones per
// wrap — gives every consecutive tick within a day a rising, musical feel
// without ever landing on a dissonant interval.
const PENTATONIC_SEMITONES = [0, 2, 4, 7, 9];
const ROOT_FREQ = 261.63; // C4

function pitchForStep(step: number): number {
  const octave = Math.floor(step / PENTATONIC_SEMITONES.length);
  const semitone = PENTATONIC_SEMITONES[step % PENTATONIC_SEMITONES.length] + octave * 12;
  return ROOT_FREQ * Math.pow(2, semitone / 12);
}

function playTone(ctx: AudioContext, freq: number, startOffset: number, duration: number, gainPeak = 0.2): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const start = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// The pitch-ladder: call with how many bronze stars the child has earned
// today so far (0-indexed) — every consecutive star that day sounds higher
// than the last. Resets naturally once the daily window rolls over, since
// the caller derives `stepInWindow` from today's tier state.
export function playStarTick(stepInWindow: number): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, pitchForStep(stepInWindow), 0, 0.15);
}

// Three escalating celebrations for reaching a tier's target.
export function playTierAchievement(tierId: TierId): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const C = 523.25;
  const E = 659.25;
  const G = 783.99;
  const C2 = 1046.5;

  if (tierId === "bronze") {
    [C, E, G].forEach((freq, i) => playTone(ctx, freq, i * 0.08, 0.35, 0.22));
    return;
  }
  if (tierId === "silver") {
    [C, E, G].forEach((freq, i) => playTone(ctx, freq, i * 0.06, 0.3, 0.2));
    [C, E, G, C2].forEach((freq) => playTone(ctx, freq, 0.3, 0.6, 0.18));
    return;
  }
  // gold — the biggest one: a short rising run into a full sustained chord
  [C, E, G, C2].forEach((freq, i) => playTone(ctx, freq, i * 0.1, 0.2, 0.22));
  [C, E, G, C2].forEach((freq) => playTone(ctx, freq, 0.5, 1.1, 0.2));
}

export function vibrateShort(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(20);
  }
}
