import { periodKey } from './dates';
import { DIFF_MULT, TODO_XP } from './rules';
import type { DayKey, PeriodScope, Todo } from './types';

export function todoXp(t: Pick<Todo, 'scope' | 'diff'>): number {
  return Math.round((TODO_XP[t.scope] ?? 10) * (DIFF_MULT[t.diff] ?? 1));
}

/** 0..1 — a done to-do counts as 1, otherwise share of done subtasks. */
export function todoProgress(t: Todo): number {
  if (t.done) return 1;
  const s = t.subs || [];
  if (!s.length) return 0;
  return s.filter((x) => x.done).length / s.length;
}

/** List progress = mean of to-do progress, in percent. */
export function listProgress(list: Todo[]): number {
  if (!list.length) return 0;
  return (list.reduce((a, t) => a + todoProgress(t), 0) / list.length) * 100;
}

export function activeTodos(todos: Record<string, Todo>): Todo[] {
  return Object.entries(todos)
    .filter(([, t]) => !t.archived)
    .map(([id, t]) => ({ ...t, id }));
}

/** Open to-do from an earlier period than the current one. */
export function isLate(t: Todo, today: DayKey): boolean {
  if (t.done || t.scope === 'ewig' || !t.period) return false;
  return t.period < (periodKey(t.scope, today) as string);
}

function aktuellRank(t: Todo, today: DayKey): number {
  return t.scope === 'tag' ? ((t.period || '') < today ? 0 : 1) : 2;
}

/** Order in the "Now" tab: overdue, today, no date. */
export function sortAktuell(today: DayKey) {
  return (a: Todo, b: Todo) =>
    aktuellRank(a, today) - aktuellRank(b, today) ||
    String(a.period || '').localeCompare(String(b.period || '')) ||
    (a.order || 0) - (b.order || 0);
}

const byDoneOnDesc = (a: Todo, b: Todo) => String(b.doneOn || '').localeCompare(String(a.doneOn || ''));

export interface TodoLists {
  open: Todo[];
  planned: Todo[];
  done: Todo[];
}

export function aktuellLists(todos: Record<string, Todo>, today: DayKey): TodoLists {
  const all = activeTodos(todos).filter((t) => t.scope === 'ewig' || t.scope === 'tag');
  return {
    open: all.filter((t) => !t.done && (t.scope === 'ewig' || (t.period || '') <= today)).sort(sortAktuell(today)),
    planned: all
      .filter((t) => !t.done && t.scope === 'tag' && (t.period || '') > today)
      .sort((a, b) => String(a.period).localeCompare(String(b.period))),
    done: all.filter((t) => t.done && (t.scope === 'ewig' || t.period === today || t.doneOn === today)).sort(byDoneOnDesc),
  };
}

export function periodLists(todos: Record<string, Todo>, scope: PeriodScope, key: string): TodoLists {
  const all = activeTodos(todos).filter((t) => t.scope === scope && t.period === key);
  return {
    open: all.filter((t) => !t.done).sort((a, b) => (a.order || 0) - (b.order || 0)),
    planned: [],
    done: all.filter((t) => t.done).sort(byDoneOnDesc),
  };
}

/** Open to-dos in the current week/month/year. */
export function openInCurrent(todos: Record<string, Todo>, scope: PeriodScope, today: DayKey): number {
  const k = periodKey(scope, today);
  return activeTodos(todos).filter((t) => t.scope === scope && t.period === k && !t.done).length;
}

/** "Current to-dos" for the mail: not archived and no date or current period. */
export function currentTodoSet(todos: Record<string, Todo>, today: DayKey): Todo[] {
  return activeTodos(todos).filter((t) => t.scope === 'ewig' || t.period === periodKey(t.scope, today));
}
