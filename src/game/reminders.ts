import { addDays } from './dates';
import { aktuellLists } from './todos';
import type { AppData, DayKey, Settings } from './types';

/** What got done on one day: finished to-dos, ticked subtasks and routine check-ins. */
export function dayDone(data: Pick<AppData, 'todos' | 'days'>, day: DayKey) {
  let todos = 0;
  let subs = 0;
  for (const t of Object.values(data.todos)) {
    if (t.done && t.doneOn === day) todos++;
    for (const s of t.subs || []) if (s.done && s.doneOn === day) subs++;
  }
  const checkins = Object.values(data.days[day]?.routines || {}).reduce((a, n) => a + (Number(n) || 0), 0);
  return { todos, subs, checkins, total: todos + subs + checkins };
}

export type Reminder =
  | { id: string; day: DayKey; time: string; kind: 'morning'; doneYesterday: number | null; open: number }
  | { id: string; day: DayKey; time: string; kind: 'evening'; remaining: number }
  | { id: string; day: DayKey; time: string; kind: 'mindful' };

const DAYS_AHEAD = 7;

/**
 * Local reminders for the next week, recomputed whenever data changes.
 * The first morning knows yesterday's result exactly; later ones (`doneYesterday: null`) only say
 * how much is open, because opening the app reschedules everything anyway. Evening reminders only
 * ask while the daily goal is still open; checking in requires opening the app, which reschedules.
 */
export function planReminders(
  data: Pick<AppData, 'todos' | 'days'> & { sessions?: AppData['sessions'] },
  push: Settings['push'],
  goal: number,
  today: DayKey,
  nowHHMM: string,
  mindfulGoal = 10,
): Reminder[] {
  const out: Reminder[] = [];
  if (!push) return out;
  const morning = push.time || '07:30';
  const evening = push.eveningTime || '20:00';

  if (push.enabled) {
    let first = true;
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const day = addDays(today, i);
      if (i === 0 && nowHHMM >= morning) continue;
      const doneYesterday = first ? dayDone(data, addDays(day, -1)).total : null;
      out.push({ id: `morning-${i}`, day, time: morning, kind: 'morning', doneYesterday, open: aktuellLists(data.todos as AppData['todos'], day).open.length });
      first = false;
    }
  }

  if (push.evening && goal > 0) {
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const day = addDays(today, i);
      if (i === 0 && nowHHMM >= evening) continue;
      const remaining = i === 0 ? goal - dayDone(data, day).checkins : goal;
      if (remaining <= 0) continue;
      out.push({ id: `evening-${i}`, day, time: evening, kind: 'evening', remaining });
    }
  }
  if (push.mindful) {
    const at = push.mindfulTime || '12:30';
    const minutesToday = Object.values(data.sessions || {})
      .filter((s) => s.date === today)
      .reduce((a, s) => a + Math.floor((Number(s.seconds) || 0) / 60), 0);
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      if (i === 0 && (nowHHMM >= at || minutesToday >= Math.max(1, mindfulGoal))) continue;
      out.push({ id: `mindful-${i}`, day: addDays(today, i), time: at, kind: 'mindful' });
    }
  }
  return out;
}
