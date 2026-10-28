import { describe, expect, it } from 'vitest';
import { normalizeImport } from '../../data/schema';
import { compute } from '../compute';
import { addDays } from '../dates';
import { planReminders } from '../reminders';
import type { Session } from '../types';
import { emptyData } from './fixtures';

const TODAY = '2026-10-27';

function session(id: string, date: string, seconds: number, extra: Partial<Session> = {}): Session {
  return { id, date, startedAt: date + 'T08:00:00Z', minutes: Math.ceil(seconds / 60), seconds, completed: true, pattern: 'calm', ...extra };
}

function withSessions(...list: Session[]) {
  return { ...emptyData(), sessions: Object.fromEntries(list.map((s) => [s.id, s])) };
}

describe('meditation XP', () => {
  it('gives 2 XP per full minute and +15 when the mindful goal is reached', () => {
    const st = compute(withSessions(session('a', TODAY, 600)), TODAY, 3, 10);
    expect(st.xpByDay.get(TODAY)).toBe(20 + 15);
    expect(st.mindfulMinutes).toBe(10);
    expect(st.calmDays).toBe(1);
  });

  it('adds up several sessions for the daily goal', () => {
    const st = compute(withSessions(session('a', TODAY, 300), session('b', TODAY, 300)), TODAY, 3, 10);
    expect(st.xpByDay.get(TODAY)).toBe(10 + 10 + 15);
  });

  it('counts only full minutes and caps a session at 60 minutes', () => {
    expect(compute(withSessions(session('a', TODAY, 90)), TODAY, 3, 10).xpByDay.get(TODAY)).toBe(2);
    expect(compute(withSessions(session('a', TODAY, 59)), TODAY, 3, 10).xpByDay.get(TODAY)).toBeUndefined();
    expect(compute(withSessions(session('a', TODAY, 3 * 3600)), TODAY, 3, 10).xpByDay.get(TODAY)).toBe(120 + 15);
  });

  it('counts meditation days towards the streak', () => {
    const st = compute(withSessions(session('a', TODAY, 60), session('b', addDays(TODAY, -1), 60)), TODAY, 3, 10);
    expect(st.streak).toBe(2);
    expect(st.medStreak).toBe(2);
  });

  it('unlocks the meditation badges', () => {
    const week = Array.from({ length: 7 }, (_, i) => session('d' + i, addDays(TODAY, -i), 15 * 60));
    const st = compute(withSessions(...week, session('long', addDays(TODAY, -10), 20 * 60)), TODAY, 3, 10);
    expect(st.unlocked.has('calm1')).toBe(true);
    expect(st.unlocked.has('calm7')).toBe(true);
    expect(st.unlocked.has('calm100')).toBe(true);
    expect(st.unlocked.has('deep20')).toBe(true);
    const fresh = compute(withSessions(session('a', TODAY, 60, { completed: false })), TODAY, 3, 10);
    expect(fresh.unlocked.has('calm1')).toBe(false);
  });
});

describe('meditation data', () => {
  it('imports sessions and drops broken ones', () => {
    const d = normalizeImport({ todos: {}, sessions: { a: { date: TODAY, seconds: 300, minutes: 5, completed: true, pattern: 'box', moodAfter: 4 }, b: { date: 'x', seconds: 60 }, c: { date: TODAY, seconds: 0 } } });
    expect(Object.keys(d.sessions)).toEqual(['a']);
    expect(d.sessions.a).toMatchObject({ pattern: 'box', moodAfter: 4, completed: true });
  });

  it('older exports without sessions still import', () => {
    expect(normalizeImport({ todos: {} }).sessions).toEqual({});
  });
});

describe('mindful reminder', () => {
  const push = { enabled: false, mindful: true, mindfulTime: '12:30' };

  it('reminds today if the goal is still open, and on the next days', () => {
    const plan = planReminders(withSessions(), push, 3, TODAY, '09:00', 10);
    expect(plan[0]).toMatchObject({ kind: 'mindful', day: TODAY, time: '12:30' });
    expect(plan).toHaveLength(8);
  });

  it('skips today once the mindful goal is reached', () => {
    const plan = planReminders(withSessions(session('a', TODAY, 600)), push, 3, TODAY, '09:00', 10);
    expect(plan[0].day).toBe(addDays(TODAY, 1));
  });
});

describe('breathing guide', () => {
  it('walks through the calm and box cycles', async () => {
    const { breathPhase, clock } = await import('../breath');
    expect(breathPhase('calm', 0)).toMatchObject({ step: 'in', remainingMs: 4000 });
    expect(breathPhase('calm', 5000)).toMatchObject({ step: 'out', remainingMs: 5000 });
    expect(breathPhase('calm', 10000)).toMatchObject({ step: 'in', cycle: 1 });
    expect(breathPhase('box', 9000)).toMatchObject({ step: 'out', remainingMs: 3000 });
    expect(breathPhase('box', 13000)).toMatchObject({ step: 'rest' });
    expect(clock(605000)).toBe('10:05');
    expect(clock(400)).toBe('00:01');
  });
});
