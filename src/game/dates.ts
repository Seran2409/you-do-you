import type { DayKey, PeriodScope, Scope } from './types';

/*
 * All date math works on civil day keys ("YYYY-MM-DD") via UTC, so results never depend on the
 * time zone or DST of the machine running the code. Only todayKey/hourNow look at the clock.
 */

const DAY_MS = 864e5;
export const pad = (n: number) => String(n).padStart(2, '0');

export function toDate(k: DayKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fromDate(d: Date): DayKey {
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = toDate(k);
  d.setUTCDate(d.getUTCDate() + n);
  return fromDate(d);
}

export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday */
export function weekday(k: DayKey): number {
  return (toDate(k).getUTCDay() + 6) % 7;
}

export function monday(k: DayKey): DayKey {
  return addDays(k, -weekday(k));
}

export function isoWeek(k: DayKey): { y: number; w: number } {
  const t = toDate(k);
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / DAY_MS + 1) / 7);
  return { y, w };
}

export function dayOfYear(k: DayKey): number {
  return daysBetween(k.slice(0, 4) + '-01-01', k) + 1;
}

/** Key of the period that contains day k. 'ewig' has no period. */
export function periodKey(scope: Scope, k: DayKey): string | null {
  switch (scope) {
    case 'tag':
      return k;
    case 'woche': {
      const iw = isoWeek(k);
      return iw.y + '-W' + pad(iw.w);
    }
    case 'monat':
      return k.slice(0, 7);
    case 'jahr':
      return k.slice(0, 4);
    default:
      return null;
  }
}

/** First day of the period with the given key. */
export function periodStart(scope: PeriodScope, key: string): DayKey {
  switch (scope) {
    case 'tag':
      return key;
    case 'monat':
      return key + '-01';
    case 'jahr':
      return key + '-01-01';
    case 'woche': {
      const [y, w] = key.split('-W').map(Number);
      return addDays(monday(y + '-01-04'), (w - 1) * 7);
    }
  }
}

/** Last day of the period that contains day k. */
export function periodEnd(scope: PeriodScope, k: DayKey): DayKey {
  switch (scope) {
    case 'tag':
      return k;
    case 'woche':
      return addDays(monday(k), 6);
    case 'monat': {
      const [y, m] = k.split('-').map(Number);
      return fromDate(new Date(Date.UTC(y, m, 0)));
    }
    case 'jahr':
      return k.slice(0, 4) + '-12-31';
  }
}

/** A day inside the period n steps away from the one containing k. */
export function shiftPeriod(scope: PeriodScope, k: DayKey, n: number): DayKey {
  const [y, m] = k.split('-').map(Number);
  switch (scope) {
    case 'tag':
      return addDays(k, n);
    case 'woche':
      return addDays(k, 7 * n);
    case 'monat':
      return fromDate(new Date(Date.UTC(y, m - 1 + n, 1)));
    case 'jahr':
      return y + n + '-01-01';
  }
}

/** Days left in the current period, today included. */
export function daysLeft(scope: PeriodScope, today: DayKey): number {
  return daysBetween(today, periodEnd(scope, today)) + 1;
}

function partsIn(timeZone: string | undefined, now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') };
}

/** Today's key in the given IANA time zone (device zone if omitted). */
export function todayKey(timeZone?: string, now: Date = new Date()): DayKey {
  const p = partsIn(timeZone, now);
  return p.y + '-' + pad(p.m) + '-' + pad(p.d);
}

export function hourNow(timeZone?: string, now: Date = new Date()): number {
  return partsIn(timeZone, now).h;
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';
  } catch {
    return 'Europe/Berlin';
  }
}
