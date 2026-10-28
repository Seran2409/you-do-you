/** Data model, identical to the prototype so its export imports 1:1. Internal scope keys stay German. */

export type Scope = 'ewig' | 'tag' | 'woche' | 'monat' | 'jahr';
export type RoutineScope = 'tag' | 'woche' | 'monat' | 'jahr';
/** Time of day a routine belongs to. Missing = any time. */
export type RoutineSlot = 'morning' | 'midday' | 'evening';
export type PeriodScope = RoutineScope;
export type Diff = 1 | 2 | 3;
/** Calendar day in the user's time zone, "YYYY-MM-DD". */
export type DayKey = string;

export interface Sub {
  id: string;
  title: string;
  done: boolean;
  doneOn: DayKey | null;
}

export interface Todo {
  id: string;
  title: string;
  /** 'ewig' = no date, 'tag' = day to-do (both live in the "Now" tab). */
  scope: Scope;
  /** ewig: null · tag: "2026-10-26" · woche: "2026-W44" · monat: "2026-10" · jahr: "2026" */
  period: string | null;
  diff: Diff;
  subs: Sub[];
  done: boolean;
  doneOn: DayKey | null;
  /** Deleted, but still counts towards XP. */
  archived?: boolean;
  createdAt: string;
  order: number;
}

export interface Routine {
  id: string;
  title: string;
  emoji: string;
  scope: RoutineScope;
  /** Times per period, >= 1. */
  target: number;
  slot?: RoutineSlot;
  archived?: boolean;
  createdAt: string;
  order: number;
}

/** Breathing guide during meditation: none, calm (in 4 s, out 6 s) or box (4-4-4-4). */
export type BreathPattern = 'free' | 'calm' | 'box';

export interface Session {
  id: string;
  date: DayKey;
  startedAt: string;
  /** Planned length in minutes. */
  minutes: number;
  /** Time actually meditated. */
  seconds: number;
  completed: boolean;
  pattern: BreathPattern;
  /** How you felt afterwards, 1 (low) to 5 (great). */
  moodAfter?: number;
}

export interface Day {
  date: DayKey;
  /** routineId -> number of check-ins on this day */
  routines: Record<string, number>;
}

export type Language = 'system' | 'de' | 'en';
export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  name: string;
  language: Language;
  timezone: string;
  dailyGoal: number;
  mail: { enabled: boolean; time?: string };
  /** Local reminders on the phone. Times are "HH:MM" in device time. */
  push?: { enabled: boolean; time?: string; evening?: boolean; eveningTime?: string; mindful?: boolean; mindfulTime?: string };
  theme?: ThemePref;
  /** Welcome screen was shown. */
  onboarded?: boolean;
  /** Mindful minutes per day for the bonus. */
  mindfulGoal?: number;
  meditation?: { minutes: number; pattern: BreathPattern; bell: boolean; dnd: boolean };
  /** Android Do-Not-Disturb mode to restore if a session was interrupted (app closed mid-session). */
  quietRestore?: number | null;
}

/** Export/import format and the in-memory state shape. */
export interface AppData {
  settings: Settings;
  todos: Record<string, Todo>;
  routines: Record<string, Routine>;
  days: Record<DayKey, Day>;
  sessions: Record<string, Session>;
}
