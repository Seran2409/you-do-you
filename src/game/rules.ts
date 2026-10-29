import type { Diff, RoutineScope, Scope, Settings } from './types';

/** XP rules. Must stay identical to the prototype and the morning mail. */
export const TODO_XP: Record<Scope, number> = { tag: 10, ewig: 15, woche: 25, monat: 50, jahr: 120 };
export const DIFF_MULT: Record<Diff, number> = { 1: 1, 2: 1.5, 3: 2 };
export const SUB_XP = 5;
export const ROUT_XP: Record<RoutineScope, number> = { tag: 10, woche: 15, monat: 25, jahr: 60 };
export const ROUT_BONUS: Record<RoutineScope, number> = { tag: 5, woche: 25, monat: 40, jahr: 100 };
export const GOAL_BONUS = 20;
export const DEFAULT_GOAL = 3;
export const MAX_GOAL = 30;

/** Meditation: XP per full minute (counted up to MED_MAX_MIN per session) and the daily mindful-minutes bonus. */
export const MED_XP_PER_MIN = 2;
export const MED_MAX_MIN = 60;
export const MINDFUL_GOAL_BONUS = 15;
export const DEFAULT_MINDFUL_GOAL = 10;
export const DEFAULT_MEDITATION: NonNullable<Settings['meditation']> = { minutes: 10, pattern: 'calm', bell: true };

/** XP for a session of `minutes` full minutes. */
export function sessionXp(minutes: number): number {
  return Math.min(MED_MAX_MIN, minutes) * MED_XP_PER_MIN;
}

export const ROUTINE_SCOPES: RoutineScope[] = ['tag', 'woche', 'monat', 'jahr'];
export const TODO_TABS = ['aktuell', 'woche', 'monat', 'jahr'] as const;
export type TodoTab = (typeof TODO_TABS)[number];

export function tabOf(scope: Scope): TodoTab {
  return scope === 'ewig' || scope === 'tag' ? 'aktuell' : scope;
}
