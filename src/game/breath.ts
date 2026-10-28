import type { BreathPattern } from './types';

export type BreathStep = 'in' | 'hold' | 'out' | 'rest';

/** Seconds per step. "free" is a slow, unhurried pulse without counting. */
export const BREATH_CYCLES: Record<BreathPattern, { step: BreathStep; s: number }[]> = {
  calm: [
    { step: 'in', s: 4 },
    { step: 'out', s: 6 },
  ],
  box: [
    { step: 'in', s: 4 },
    { step: 'hold', s: 4 },
    { step: 'out', s: 4 },
    { step: 'rest', s: 4 },
  ],
  free: [
    { step: 'in', s: 5 },
    { step: 'out', s: 5 },
  ],
};

/** Which step of the breathing cycle we are in after `elapsedMs`, and how long it still lasts. */
export function breathPhase(pattern: BreathPattern, elapsedMs: number) {
  const cycle = BREATH_CYCLES[pattern];
  const total = cycle.reduce((a, c) => a + c.s * 1000, 0);
  let t = ((elapsedMs % total) + total) % total;
  for (let i = 0; i < cycle.length; i++) {
    const d = cycle[i].s * 1000;
    if (t < d) return { index: i, step: cycle[i].step, remainingMs: d - t, durationMs: d, cycle: Math.floor(elapsedMs / total) };
    t -= d;
  }
  return { index: 0, step: cycle[0].step, remainingMs: cycle[0].s * 1000, durationMs: cycle[0].s * 1000, cycle: 0 };
}

/** "08:05" */
export function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
