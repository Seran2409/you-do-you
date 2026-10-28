import { dayOfYear } from './dates';
import type { DayKey } from './types';

/** Deterministic by date, so every device shows the same quote. Same formula as the prototype. */
export function quoteIndex(day: DayKey, count: number): number {
  if (count <= 0) return 0;
  return (dayOfYear(day) + Number(day.slice(0, 4)) * 7) % count;
}
