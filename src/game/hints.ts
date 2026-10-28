import type { Stats } from './compute';
import { daysLeft, periodKey } from './dates';
import { activeRoutines, periodCount, targetOf } from './routines';
import { activeTodos } from './todos';
import type { AppData, DayKey, PeriodScope, RoutineScope } from './types';

/** Structured hints; the UI turns them into text via i18n. */
export type Hint =
  | { kind: 'overdue'; hot: true; weight: number; count: number }
  | { kind: 'routineTight'; hot: true; weight: number; routineId: string; title: string; emoji: string; remaining: number; daysLeft: number }
  | { kind: 'routineOpen'; hot: false; weight: number; routineId: string; title: string; emoji: string; remaining: number; scope: Exclude<RoutineScope, 'tag'> }
  | { kind: 'listEnding'; hot: boolean; weight: number; scope: Exclude<PeriodScope, 'tag'>; open: number; daysLeft: number };

const REMIND_WITHIN = { woche: 3, monat: 7, jahr: 45 } as const;
const LIST_WITHIN = { woche: 2, monat: 5, jahr: 30 } as const;

/** Up to 3 hints, most urgent first. */
export function hints(data: Pick<AppData, 'todos' | 'routines'>, st: Stats, today: DayKey, max = 3): Hint[] {
  const out: Hint[] = [];
  const todos = activeTodos(data.todos);

  const overdue = todos.filter((t) => !t.done && t.scope === 'tag' && t.period && t.period < today);
  if (overdue.length) out.push({ kind: 'overdue', hot: true, weight: 3, count: overdue.length });

  for (const r of activeRoutines(data.routines)) {
    if (r.scope === 'tag') continue;
    const remaining = targetOf(r) - periodCount(st, r, today);
    if (remaining <= 0) continue;
    const dl = daysLeft(r.scope, today);
    const base = { routineId: r.id, title: r.title, emoji: r.emoji || '' };
    if (remaining >= dl) out.push({ kind: 'routineTight', hot: true, weight: 4, ...base, remaining, daysLeft: dl });
    else if (dl <= REMIND_WITHIN[r.scope]) out.push({ kind: 'routineOpen', hot: false, weight: 2, ...base, remaining, scope: r.scope });
  }

  for (const scope of ['woche', 'monat', 'jahr'] as const) {
    const dl = daysLeft(scope, today);
    if (dl > LIST_WITHIN[scope]) continue;
    const key = periodKey(scope, today);
    const open = todos.filter((t) => t.scope === scope && t.period === key && !t.done).length;
    if (open) out.push({ kind: 'listEnding', hot: dl <= 1, weight: dl <= 1 ? 3 : 1, scope, open, daysLeft: dl });
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, max);
}
