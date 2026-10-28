import { deviceTimeZone } from '../game/dates';
import { DEFAULT_GOAL, DEFAULT_MINDFUL_GOAL } from '../game/rules';
import type { AppData, BreathPattern, Day, Diff, Routine, RoutineScope, Scope, Session, Settings, Sub, Todo } from '../game/types';

export const EXPORT_VERSION = 1;

export function defaultSettings(): Settings {
  return {
    name: '',
    language: 'system',
    timezone: deviceTimeZone(),
    dailyGoal: DEFAULT_GOAL,
    mail: { enabled: true, time: '07:30' },
    push: { enabled: false, time: '07:30', evening: false, eveningTime: '20:00', mindful: false, mindfulTime: '12:30' },
    theme: 'system',
    onboarded: false,
    mindfulGoal: DEFAULT_MINDFUL_GOAL,
    meditation: { minutes: 10, pattern: 'calm', bell: true },
  };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const hhmm = (v: unknown, fallback: string) => (typeof v === 'string' && HHMM.test(v) ? v : fallback);

export const emptyAppData = (): AppData => ({ settings: defaultSettings(), todos: {}, routines: {}, days: {}, sessions: {} });

const SCOPES: Scope[] = ['ewig', 'tag', 'woche', 'monat', 'jahr'];
const R_SCOPES: RoutineScope[] = ['tag', 'woche', 'monat', 'jahr'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const dayOrNull = (v: unknown) => (typeof v === 'string' && DAY_RE.test(v) ? v : null);

export class ImportError extends Error {}

function normSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!isObj(raw)) return d;
  const mail = isObj(raw.mail) ? raw.mail : {};
  const push = isObj(raw.push) ? raw.push : {};
  const goal = Number(raw.dailyGoal);
  return {
    name: str(raw.name).slice(0, 40),
    language: raw.language === 'de' || raw.language === 'en' ? raw.language : 'system',
    timezone: str(raw.timezone, d.timezone) || d.timezone,
    dailyGoal: Number.isFinite(goal) && goal >= 1 ? Math.min(30, Math.round(goal)) : DEFAULT_GOAL,
    mail: { enabled: mail.enabled !== false, time: hhmm(mail.time, '07:30') },
    push: {
      enabled: push.enabled === true,
      time: hhmm(push.time, '07:30'),
      evening: push.evening === true,
      eveningTime: hhmm(push.eveningTime, '20:00'),
      mindful: push.mindful === true,
      mindfulTime: hhmm(push.mindfulTime, '12:30'),
    },
    mindfulGoal: Number.isFinite(Number(raw.mindfulGoal)) && Number(raw.mindfulGoal) >= 1 ? Math.min(120, Math.round(Number(raw.mindfulGoal))) : DEFAULT_MINDFUL_GOAL,
    meditation: normMeditation(raw.meditation, d.meditation!),
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    // Imported data means the person already knows the app.
    onboarded: true,
  };
}

const PATTERNS: BreathPattern[] = ['free', 'calm', 'box'];

function normMeditation(raw: unknown, d: NonNullable<Settings['meditation']>): NonNullable<Settings['meditation']> {
  if (!isObj(raw)) return d;
  const minutes = Math.round(Number(raw.minutes));
  return {
    minutes: minutes >= 1 && minutes <= 120 ? minutes : d.minutes,
    pattern: PATTERNS.includes(raw.pattern as BreathPattern) ? (raw.pattern as BreathPattern) : d.pattern,
    bell: raw.bell !== false,
  };
}

function normSession(id: string, raw: unknown): Session | null {
  if (!isObj(raw)) return null;
  const date = dayOrNull(raw.date);
  const seconds = Math.max(0, Math.round(Number(raw.seconds) || 0));
  if (!date || !seconds) return null;
  const s: Session = {
    id,
    date,
    startedAt: str(raw.startedAt, new Date(0).toISOString()),
    minutes: Math.max(1, Math.round(Number(raw.minutes) || 1)),
    seconds,
    completed: raw.completed === true,
    pattern: PATTERNS.includes(raw.pattern as BreathPattern) ? (raw.pattern as BreathPattern) : 'free',
  };
  const mood = Math.round(Number(raw.moodAfter));
  if (mood >= 1 && mood <= 5) s.moodAfter = mood;
  return s;
}

function normSub(raw: unknown, i: number): Sub | null {
  if (!isObj(raw)) return null;
  const done = raw.done === true;
  return { id: str(raw.id) || 's' + i, title: str(raw.title), done, doneOn: done ? dayOrNull(raw.doneOn) : null };
}

function normTodo(id: string, raw: unknown): Todo | null {
  if (!isObj(raw)) return null;
  const scope = SCOPES.includes(raw.scope as Scope) ? (raw.scope as Scope) : 'ewig';
  const diff = [1, 2, 3].includes(Number(raw.diff)) ? (Number(raw.diff) as Diff) : 1;
  const done = raw.done === true;
  const t: Todo = {
    id,
    title: str(raw.title),
    scope,
    period: scope === 'ewig' ? null : str(raw.period) || null,
    diff,
    subs: (Array.isArray(raw.subs) ? raw.subs : []).map(normSub).filter((s): s is Sub => !!s),
    done,
    doneOn: done ? dayOrNull(raw.doneOn) : null,
    createdAt: str(raw.createdAt, new Date(0).toISOString()),
    order: Number(raw.order) || 0,
  };
  if (raw.archived === true) t.archived = true;
  return t;
}

function normRoutine(id: string, raw: unknown): Routine | null {
  if (!isObj(raw)) return null;
  const r: Routine = {
    id,
    title: str(raw.title),
    emoji: str(raw.emoji, '🎯') || '🎯',
    scope: R_SCOPES.includes(raw.scope as RoutineScope) ? (raw.scope as RoutineScope) : 'tag',
    target: Math.max(1, Math.round(Number(raw.target) || 1)),
    createdAt: str(raw.createdAt, new Date(0).toISOString()),
    order: Number(raw.order) || 0,
  };
  if (raw.slot === 'morning' || raw.slot === 'midday' || raw.slot === 'evening') r.slot = raw.slot;
  if (raw.archived === true) r.archived = true;
  return r;
}

function normDay(key: string, raw: unknown): Day | null {
  if (!isObj(raw)) return null;
  const date = dayOrNull(raw.date) || dayOrNull(key);
  if (!date) return null;
  const routines: Record<string, number> = {};
  if (isObj(raw.routines)) {
    for (const [rid, n] of Object.entries(raw.routines)) {
      const c = Math.round(Number(n));
      if (c > 0) routines[rid] = c;
    }
  }
  return { date, routines };
}

function normCollection<T>(raw: unknown, fn: (id: string, v: unknown) => T | null): Record<string, T> {
  const out: Record<string, T> = {};
  if (Array.isArray(raw)) {
    raw.forEach((v, i) => {
      const id = isObj(v) ? str(v.id) || str(v.date) || String(i) : String(i);
      const n = fn(id, v);
      if (n) out[id] = n;
    });
  } else if (isObj(raw)) {
    for (const [id, v] of Object.entries(raw)) {
      const n = fn(id, v);
      if (n) out[id] = n;
    }
  }
  return out;
}

/**
 * Accepts the prototype export `{ settings, todos, routines, days }` (objects keyed by id,
 * arrays also tolerated). A missing `language` becomes 'system'.
 */
export function normalizeImport(input: unknown): AppData {
  const raw = typeof input === 'string' ? safeParse(input) : input;
  if (!isObj(raw) || !('todos' in raw || 'routines' in raw || 'days' in raw)) {
    throw new ImportError('not an export');
  }
  const days = normCollection(raw.days, normDay);
  const byDate: Record<string, Day> = {};
  for (const d of Object.values(days)) byDate[d.date] = d;
  return {
    settings: normSettings(raw.settings),
    todos: normCollection(raw.todos, normTodo),
    routines: normCollection(raw.routines, normRoutine),
    days: byDate,
    sessions: normCollection(raw.sessions, normSession),
  };
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    throw new ImportError('invalid json');
  }
}

/** Export without the redundant `id` fields, same shape the prototype uses. */
export function toExport(data: AppData) {
  const strip = <T extends { id: string }>(rec: Record<string, T>) =>
    Object.fromEntries(Object.entries(rec).map(([id, { id: _id, ...rest }]) => [id, rest]));
  return {
    app: 'you-do-you',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: data.settings,
    todos: strip(data.todos),
    routines: strip(data.routines),
    days: data.days,
    sessions: strip(data.sessions || {}),
  };
}
