import type { Stats } from './compute';

export type BadgeIcon = 'flag' | 'layers' | 'check' | 'flame' | 'star' | 'cal' | 'crown' | 'bolt' | 'trophy' | 'lotus' | 'sun' | 'sunrise' | 'moon';

export interface Achievement {
  /** Also the i18n key under "badges." */
  key: string;
  icon: BadgeIcon;
  ok: (s: Stats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: 'first', icon: 'flag', ok: (s) => s.todosDone >= 1 },
  { key: 'subs25', icon: 'layers', ok: (s) => s.subsDone >= 25 },
  { key: 'todo50', icon: 'check', ok: (s) => s.todosDone >= 50 },
  { key: 'st3', icon: 'flame', ok: (s) => s.best >= 3 },
  { key: 'st7', icon: 'flame', ok: (s) => s.best >= 7 },
  { key: 'st30', icon: 'flame', ok: (s) => s.best >= 30 },
  { key: 'perfect', icon: 'star', ok: (s) => s.perfectDays >= 1 },
  { key: 'perfect7', icon: 'star', ok: (s) => s.perfectDays >= 7 },
  { key: 'week', icon: 'cal', ok: (s) => s.met.woche >= 1 },
  { key: 'month', icon: 'cal', ok: (s) => s.met.monat >= 1 },
  { key: 'year', icon: 'crown', ok: (s) => s.yearlyDone >= 1 },
  { key: 'lv5', icon: 'bolt', ok: (s) => s.level.level >= 5 },
  { key: 'lv10', icon: 'bolt', ok: (s) => s.level.level >= 10 },
  { key: 'xp1000', icon: 'trophy', ok: (s) => s.total >= 1000 },
  { key: 'calm1', icon: 'lotus', ok: (s) => s.sessionsDone >= 1 },
  { key: 'calm100', icon: 'moon', ok: (s) => s.mindfulMinutes >= 100 },
  { key: 'calm7', icon: 'sunrise', ok: (s) => s.medBest >= 7 },
  { key: 'deep20', icon: 'sun', ok: (s) => s.longestSession >= 20 },
];
