import { periodKey } from './dates';
import type { Day, DayKey, Todo } from './types';

/*
 * Pure state transitions. Each returns a new object; callers persist it.
 */

let counter = 0;
export function uid(prefix: string): string {
  counter = (counter + 1) % 1296;
  return prefix + Date.now().toString(36) + counter.toString(36).padStart(2, '0') + Math.random().toString(36).slice(2, 6);
}

export function toggleTodo(t: Todo, today: DayKey): Todo {
  const done = !t.done;
  return { ...t, done, doneOn: done ? today : null };
}

/** Checking the last subtask completes the to-do; reopening one reopens it. */
export function toggleSub(t: Todo, subId: string, today: DayKey): Todo {
  const subs = t.subs.map((s) => (s.id === subId ? { ...s, done: !s.done, doneOn: !s.done ? today : null } : s));
  const changed = subs.find((s) => s.id === subId);
  if (!changed) return t;
  let { done, doneOn } = t;
  if (changed.done && subs.every((s) => s.done) && !done) {
    done = true;
    doneOn = today;
  }
  if (!changed.done && done) {
    done = false;
    doneOn = null;
  }
  return { ...t, subs, done, doneOn };
}

export function addSub(t: Todo, title: string): Todo {
  const clean = title.trim().slice(0, 120);
  if (!clean) return t;
  return {
    ...t,
    subs: [...t.subs, { id: uid('s'), title: clean, done: false, doneOn: null }],
    done: false,
    doneOn: null,
  };
}

/** Move an overdue to-do into the current period ("Auf heute holen"). */
export function moveToCurrent(t: Todo, today: DayKey): Todo {
  if (t.scope === 'ewig') return t;
  return { ...t, period: periodKey(t.scope, today) };
}

/** Deleting a to-do that already earned XP only archives it. */
export function hasEarnedXp(t: Todo): boolean {
  return t.done || t.subs.some((s) => s.done);
}

export function incRoutine(day: Day | undefined, today: DayKey, routineId: string): Day {
  const routines = { ...(day?.routines || {}) };
  routines[routineId] = (routines[routineId] || 0) + 1;
  return { date: today, routines };
}

/** Take back the last check-in of today. */
export function decRoutine(day: Day | undefined, today: DayKey, routineId: string): Day | null {
  if (!day?.routines?.[routineId]) return null;
  const routines = { ...day.routines };
  routines[routineId]--;
  if (routines[routineId] <= 0) delete routines[routineId];
  return { date: today, routines };
}
