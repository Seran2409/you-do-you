import type { Stats } from './compute';
import { periodKey, shiftPeriod } from './dates';
import type { AppData, Day, DayKey, Routine, RoutineScope, RoutineSlot } from './types';

export const targetOf = (r: Routine) => Math.max(1, r.target || 1);

export function activeRoutines(routines: Record<string, Routine>): Routine[] {
  return Object.entries(routines)
    .filter(([, r]) => !r.archived)
    .map(([id, r]) => ({ ...r, id }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** Check-ins of a routine in the period that contains day d. */
export function periodCount(st: Stats, r: Routine, d: DayKey): number {
  return st.pc.get(r.id + '|' + periodKey(r.scope, d)) || 0;
}

export function todayCount(days: AppData['days'], r: Routine, today: DayKey): number {
  return days[today]?.routines?.[r.id] || 0;
}

/** Daily routine with target 1 behaves like a checkbox. */
export const isToggleOnly = (r: Routine) => r.scope === 'tag' && targetOf(r) === 1;

export interface ReviewEntry {
  /** a day inside that period */
  day: DayKey;
  count: number;
  hit: boolean;
}

/** Look back: the last 6 finished periods, hits among them and the current run of hits. */
export function routineReview(st: Stats, r: Routine, today: DayKey) {
  const target = targetOf(r);
  const entries: ReviewEntry[] = [];
  for (let i = 6; i >= 1; i--) {
    const day = shiftPeriod(r.scope, today, -i);
    const count = periodCount(st, r, day);
    entries.push({ day, count, hit: count >= target });
  }
  let run = 0;
  for (let i = 1; i <= 12; i++) {
    if (periodCount(st, r, shiftPeriod(r.scope, today, -i)) >= target) run++;
    else break;
  }
  return { entries, hits: entries.filter((e) => e.hit).length, run };
}

/** "This week: 1 of 2 met · Last week: 2 of 2" */
export function scopeSummary(st: Stats, list: Routine[], scope: RoutineScope, today: DayKey) {
  const prev = shiftPeriod(scope, today, -1);
  return {
    total: list.length,
    metNow: list.filter((r) => periodCount(st, r, today) >= targetOf(r)).length,
    metPrev: list.filter((r) => periodCount(st, r, prev) >= targetOf(r)).length,
  };
}

export const ROUTINE_SLOTS: RoutineSlot[] = ['morning', 'midday', 'evening'];
export type SlotGroupKey = RoutineSlot | 'any';

/** Times of day of a routine in day order (also reads the older single `slot`). */
export function slotsOf(r: Pick<Routine, 'slots' | 'slot'>): RoutineSlot[] {
  const picked = r.slots ?? (r.slot ? [r.slot] : []);
  return ROUTINE_SLOTS.filter((s) => picked.includes(s));
}

/** A daily routine spread over several times of day shows one part per time of day. */
export const isSplit = (r: Routine) => r.scope === 'tag' && slotsOf(r).length > 1;

export interface SlotPart {
  slot: RoutineSlot;
  /** Repetitions that belong to this time of day. */
  share: number;
  /** Check-ins done for it today. */
  done: number;
}

/**
 * Today's parts of a split routine. The repetitions are spread as evenly as possible (earlier times
 * get the extra ones); check-ins count for the time of day they were made in.
 */
export function slotParts(r: Routine, day: Day | undefined): SlotPart[] {
  const slots = slotsOf(r);
  if (!slots.length) return [];
  const target = targetOf(r);
  const base = Math.floor(target / slots.length);
  const extra = target % slots.length;
  const parts = slots.map((slot, i) => ({ slot, share: base + (i < extra ? 1 : 0), done: 0 }));
  for (const s of day?.slotLog?.[r.id] ?? []) {
    const p = parts.find((x) => x.slot === s);
    if (p) p.done++;
  }
  // Check-ins without a recorded time of day (made before the routine was split) fill the parts in day order.
  let loose = Math.max(0, (day?.routines?.[r.id] || 0) - parts.reduce((a, p) => a + p.done, 0));
  for (const p of parts) {
    const take = Math.min(loose, Math.max(0, p.share - p.done));
    p.done += take;
    loose -= take;
  }
  return parts;
}

/** One row in a routine list: a routine, or one time-of-day part of a split routine. */
export interface RoutineEntry {
  routine: Routine;
  slot?: RoutineSlot;
}

/** Morning until 11, midday until 17, evening after that (and through the night). */
export function slotAt(hour: number): RoutineSlot {
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'midday';
  return 'evening';
}

/**
 * Groups routines by time of day in the order morning, midday, evening, any time.
 * Returns a single 'any' group when no routine has a time of day, so the list stays flat.
 */
export function groupBySlot(list: Routine[]): { key: SlotGroupKey; items: RoutineEntry[] }[] {
  const entries: RoutineEntry[] = list.flatMap((r) => {
    const slots = slotsOf(r);
    return isSplit(r) ? slots.map((slot) => ({ routine: r, slot })) : [{ routine: r, slot: slots[0] }];
  });
  if (!entries.some((e) => e.slot)) return entries.length ? [{ key: 'any', items: entries }] : [];
  const keys: SlotGroupKey[] = [...ROUTINE_SLOTS, 'any'];
  return keys.map((key) => ({ key, items: entries.filter((e) => (e.slot ?? 'any') === key) })).filter((g) => g.items.length);
}
