import type { LevelInfo } from '../game/level';

/** Game feedback emitted by the store and rendered by the FX layer (toast, confetti, level-up, haptics). */
export type FeedbackEvent =
  | { type: 'xp'; amount: number }
  | { type: 'levelUp'; level: LevelInfo }
  | { type: 'badge'; key: string }
  | { type: 'toast'; message: string; kind?: 'warn' };

type Listener = (e: FeedbackEvent) => void;
const listeners = new Set<Listener>();

export function emit(e: FeedbackEvent) {
  for (const l of listeners) l(e);
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
