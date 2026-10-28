import { addDays, isoWeek, monday, periodStart, toDate } from '../game/dates';
import type { DayKey, PeriodScope } from '../game/types';
import i18n from './index';

/*
 * Day keys are civil dates stored as UTC midnight, so every formatter uses timeZone 'UTC'.
 */

const locale = () => (i18n.language === 'de' ? 'de-DE' : 'en-US');

export function fmtDay(k: DayKey, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale(), { timeZone: 'UTC', ...opts }).format(toDate(k));
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat(locale()).format(n);
}

/** "Montag, 26. Oktober" / "Monday, October 26" */
export function headerDate(k: DayKey): string {
  return fmtDay(k, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "26.10." / "10/26" */
function shortDate(k: DayKey): string {
  return fmtDay(k, { day: 'numeric', month: 'numeric' });
}

/** Today / Yesterday / Tomorrow or "Mi., 28. Okt." */
export function dayLabel(k: DayKey, today: DayKey): string {
  if (k === today) return i18n.t('day.today');
  if (k === addDays(today, -1)) return i18n.t('day.yesterday');
  if (k === addDays(today, 1)) return i18n.t('day.tomorrow');
  return fmtDay(k, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Label for the period that contains day k: "KW 44 · 26.10.–1.11.", "Oktober 2026", "2026". */
export function periodLabel(scope: PeriodScope, k: DayKey, today: DayKey): string {
  switch (scope) {
    case 'tag':
      return dayLabel(k, today);
    case 'woche': {
      const m = monday(k);
      return i18n.t('todos.weekRange', { week: isoWeek(k).w, from: shortDate(m), to: shortDate(addDays(m, 6)) });
    }
    case 'monat':
      return fmtDay(periodStart('monat', k.slice(0, 7)), { month: 'long', year: 'numeric' });
    case 'jahr':
      return k.slice(0, 4);
  }
}

/** Compact label for look-back chips: "Mo 26.", "KW 44", "Okt", "2026". */
export function shortPeriod(scope: PeriodScope, k: DayKey): string {
  switch (scope) {
    case 'tag':
      return fmtDay(k, { weekday: 'short', day: 'numeric' });
    case 'woche':
      return i18n.t('todos.week', { week: isoWeek(k).w });
    case 'monat':
      return fmtDay(k, { month: 'short' });
    case 'jahr':
      return k.slice(0, 4);
  }
}

/** "a, b und c" / "a, b and c" */
export function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return parts.slice(0, -1).join(', ') + ' ' + i18n.t('common.and') + ' ' + parts[parts.length - 1];
}
