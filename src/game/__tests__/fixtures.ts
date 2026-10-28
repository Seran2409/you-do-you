import { addDays, periodKey } from '../dates';
import type { AppData, Diff, Routine, RoutineScope, Scope, Todo } from '../types';

export const emptyData = (): Pick<AppData, 'todos' | 'routines' | 'days'> => ({ todos: {}, routines: {}, days: {} });

export function todo(p: Partial<Todo> & { id: string }): Todo {
  return { title: p.id, scope: 'ewig', period: null, diff: 1, subs: [], done: false, doneOn: null, createdAt: '2026-01-01T00:00:00Z', order: 0, ...p };
}

export function routine(p: Partial<Routine> & { id: string }): Routine {
  return { title: p.id, emoji: '🎯', scope: 'tag', target: 1, createdAt: '2026-01-01T00:00:00Z', order: 0, ...p };
}

/** Small deterministic PRNG so the random dataset is the same on every run. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** ~200 days of mixed activity in the prototype's format, ending on `today`. */
export function randomHistory(today: string, seed = 42): Pick<AppData, 'todos' | 'routines' | 'days'> {
  const r = rng(seed);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const data = emptyData();
  const rScopes: RoutineScope[] = ['tag', 'tag', 'woche', 'monat', 'jahr'];
  for (let i = 0; i < 7; i++) {
    const scope = pick(rScopes);
    data.routines['r' + i] = routine({ id: 'r' + i, scope, target: 1 + Math.floor(r() * (scope === 'tag' ? 4 : 3)), archived: i === 6 });
  }
  const scopes: Scope[] = ['ewig', 'tag', 'woche', 'monat', 'jahr'];
  for (let i = 0; i < 160; i++) {
    const day = addDays(today, -Math.floor(r() * 200));
    const scope = pick(scopes);
    const subs = Array.from({ length: Math.floor(r() * 4) }, (_, j) => {
      const done = r() < 0.6;
      return { id: `s${i}-${j}`, title: 'sub', done, doneOn: done ? addDays(day, Math.floor(r() * 3)) : null };
    });
    const done = r() < 0.65;
    data.todos['t' + i] = todo({
      id: 't' + i,
      scope,
      period: periodKey(scope, day),
      diff: (1 + Math.floor(r() * 3)) as Diff,
      subs,
      done,
      doneOn: done ? day : null,
      archived: r() < 0.08,
    });
  }
  for (let d = 0; d < 200; d++) {
    if (r() < 0.25) continue;
    const key = addDays(today, -d);
    const routines: Record<string, number> = {};
    for (const id of Object.keys(data.routines)) if (r() < 0.4) routines[id] = 1 + Math.floor(r() * 3);
    data.days[key] = { date: key, routines };
  }
  return data;
}
