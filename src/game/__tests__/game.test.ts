import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  aktuellLists,
  compute,
  daysLeft,
  hints,
  isoWeek,
  levelInfo,
  levelThreshold,
  levelTitleKey,
  listProgress,
  periodEnd,
  periodKey,
  periodStart,
  quoteIndex,
  routineReview,
  shiftPeriod,
  todayKey,
  todoXp,
  toggleSub,
  groupBySlot,
  slotAt,
} from '../index';
import { normalizeImport } from '../../data/schema';
import { emptyData, randomHistory, routine, todo } from './fixtures';
import { prototypeCompute } from './prototype-reference.js';

const TODAY = '2026-10-26'; // Monday

describe('todoXp', () => {
  it('follows the XP table incl. difficulty', () => {
    expect(todoXp({ scope: 'ewig', diff: 3 })).toBe(30);
    expect(todoXp({ scope: 'woche', diff: 2 })).toBe(38); // 37.5 rounded
    expect(todoXp({ scope: 'jahr', diff: 1 })).toBe(120);
    expect(todoXp({ scope: 'tag', diff: 1 })).toBe(10);
    expect(todoXp({ scope: 'monat', diff: 2 })).toBe(75);
  });
});

describe('level', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [249, 2],
    [250, 3],
    [449, 3],
    [450, 4],
    [700, 5],
    [1000, 6],
  ])('%i XP -> level %i', (xp, level) => {
    expect(levelInfo(xp).level).toBe(level);
  });

  it('reports progress inside the level', () => {
    expect(levelInfo(130)).toMatchObject({ level: 2, into: 30, need: 150 });
    expect(levelThreshold(5)).toBe(700);
  });

  it('picks titles by level', () => {
    expect(levelTitleKey(1)).toBe('rookie');
    expect(levelTitleKey(6)).toBe('pathfinder');
    expect(levelTitleKey(7)).toBe('summitSeeker');
    expect(levelTitleKey(25)).toBe('legend');
  });
});

describe('routines', () => {
  it('3×/week: Mon, Wed, Fri -> bonus only on Friday, no second bonus', () => {
    const data = emptyData();
    data.routines.run = routine({ id: 'run', scope: 'woche', target: 3 });
    for (const d of ['2026-10-26', '2026-10-28', '2026-10-30', '2026-10-31']) data.days[d] = { date: d, routines: { run: 1 } };
    const st = compute(data, '2026-11-01', 0);
    expect(st.xpByDay.get('2026-10-26')).toBe(15);
    expect(st.xpByDay.get('2026-10-28')).toBe(15);
    expect(st.xpByDay.get('2026-10-30')).toBe(15 + 25);
    expect(st.xpByDay.get('2026-10-31')).toBe(15);
    expect(st.met.woche).toBe(1);
  });

  it('daily goal 3: three check-ins -> +20, two -> 0', () => {
    const data = emptyData();
    data.routines.a = routine({ id: 'a', target: 5 });
    data.days['2026-10-25'] = { date: '2026-10-25', routines: { a: 3 } };
    data.days['2026-10-26'] = { date: '2026-10-26', routines: { a: 2 } };
    const st = compute(data, TODAY, 3);
    expect(st.xpByDay.get('2026-10-25')).toBe(30 + 20);
    expect(st.xpByDay.get('2026-10-26')).toBe(20);
    expect(st.perfectDays).toBe(1);
  });

  it('look back covers the last 6 finished periods', () => {
    const data = emptyData();
    data.routines.r = routine({ id: 'r', scope: 'woche', target: 1 });
    for (const d of ['2026-10-19', '2026-10-12', '2026-09-21']) data.days[d] = { date: d, routines: { r: 1 } };
    const st = compute(data, TODAY, 0);
    const rv = routineReview(st, data.routines.r, TODAY);
    expect(rv.entries).toHaveLength(6);
    expect(rv.hits).toBe(3);
    expect(rv.run).toBe(2);
  });
});

describe('streak', () => {
  it('XP yesterday and the day before, nothing today -> 2', () => {
    const data = emptyData();
    data.todos.a = todo({ id: 'a', done: true, doneOn: '2026-10-25' });
    data.todos.b = todo({ id: 'b', done: true, doneOn: '2026-10-24' });
    data.todos.c = todo({ id: 'c', done: true, doneOn: '2026-10-20' });
    const st = compute(data, TODAY, 3);
    expect(st.streak).toBe(2);
    expect(st.best).toBe(2);
  });

  it('counts today when today already has XP', () => {
    const data = emptyData();
    for (const d of ['2026-10-26', '2026-10-25', '2026-10-24']) data.todos[d] = todo({ id: d, done: true, doneOn: d });
    expect(compute(data, TODAY, 3).streak).toBe(3);
  });
});

describe('dates', () => {
  it('2026-12-28 to 2027-01-03 are the same ISO week 2026-W53', () => {
    for (let i = 0; i < 7; i++) expect(periodKey('woche', addDays('2026-12-28', i))).toBe('2026-W53');
    expect(periodKey('woche', '2027-01-04')).toBe('2027-W01');
    expect(periodStart('woche', '2026-W53')).toBe('2026-12-28');
    expect(isoWeek('2026-10-26')).toEqual({ y: 2026, w: 44 });
  });

  it('handles period ends, shifts and days left', () => {
    expect(periodEnd('monat', '2028-02-10')).toBe('2028-02-29');
    expect(periodEnd('woche', TODAY)).toBe('2026-11-01');
    expect(daysLeft('woche', TODAY)).toBe(7);
    expect(daysLeft('jahr', '2026-12-31')).toBe(1);
    expect(shiftPeriod('monat', '2026-01-31', 1)).toBe('2026-02-01');
    expect(shiftPeriod('jahr', TODAY, -1)).toBe('2025-01-01');
  });

  it('computes today in a given time zone', () => {
    const now = new Date('2026-10-26T23:30:00Z');
    expect(todayKey('Europe/Berlin', now)).toBe('2026-10-27');
    expect(todayKey('America/New_York', now)).toBe('2026-10-26');
  });
});

describe('to-dos', () => {
  it('last subtask completes the to-do, reopening a subtask reopens it', () => {
    let t = todo({ id: 't', subs: [{ id: 'a', title: 'a', done: true, doneOn: TODAY }, { id: 'b', title: 'b', done: false, doneOn: null }] });
    t = toggleSub(t, 'b', TODAY);
    expect(t.done).toBe(true);
    expect(t.doneOn).toBe(TODAY);
    t = toggleSub(t, 'a', TODAY);
    expect(t.done).toBe(false);
    expect(t.doneOn).toBeNull();
  });

  it('list progress is the mean of to-do progress', () => {
    const subs = (n: number, d: number) => Array.from({ length: n }, (_, i) => ({ id: 's' + i, title: '', done: i < d, doneOn: i < d ? TODAY : null }));
    const list = [todo({ id: 'a', done: true, doneOn: TODAY }), todo({ id: 'b', subs: subs(4, 1) }), todo({ id: 'c' })];
    expect(Math.round(listProgress(list))).toBe(42); // (100 + 25 + 0) / 3
  });

  it('"Now" tab: overdue, today, no date; planned separately', () => {
    const data = emptyData();
    data.todos.e = todo({ id: 'e', scope: 'ewig' });
    data.todos.t = todo({ id: 't', scope: 'tag', period: TODAY });
    data.todos.o = todo({ id: 'o', scope: 'tag', period: '2026-10-20' });
    data.todos.p = todo({ id: 'p', scope: 'tag', period: '2026-10-27' });
    data.todos.x = todo({ id: 'x', scope: 'tag', period: TODAY, archived: true });
    const l = aktuellLists(data.todos, TODAY);
    expect(l.open.map((t) => t.id)).toEqual(['o', 't', 'e']);
    expect(l.planned.map((t) => t.id)).toEqual(['p']);
  });

  it('archived to-dos keep their XP', () => {
    const data = emptyData();
    data.todos.a = todo({ id: 'a', done: true, doneOn: TODAY, archived: true });
    expect(compute(data, TODAY, 3).total).toBe(15);
  });
});

describe('hints', () => {
  it('flags overdue day to-dos and tight routines, max 3', () => {
    const data = emptyData();
    data.todos.o = todo({ id: 'o', scope: 'tag', period: '2026-10-20' });
    data.routines.r = routine({ id: 'r', scope: 'woche', target: 3 });
    const sunday = '2026-11-01';
    const st = compute(data, sunday, 3);
    const h = hints(data, st, sunday);
    expect(h.map((x) => x.kind)).toEqual(['routineTight', 'overdue']);
  });
});

describe('quote of the day', () => {
  it('is deterministic per date', () => {
    expect(quoteIndex(TODAY, 48)).toBe(quoteIndex(TODAY, 48));
    expect(quoteIndex(TODAY, 48)).not.toBe(quoteIndex('2026-10-27', 48));
  });
});

describe('matches the prototype', () => {
  afterEach(() => vi.useRealTimers());

  it.each([1, 7, 42, 2026])('random history (seed %i) gives identical stats', (seed) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 12));
    const data = randomHistory(TODAY, seed);
    for (const goal of [0, 3, 5]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref: any = prototypeCompute(data, goal);
      const st = compute(data, TODAY, goal);
      expect(st.total).toBe(ref.total);
      expect(st.level).toEqual(ref.level);
      expect(st.streak).toBe(ref.streak);
      expect(st.best).toBe(ref.best);
      expect(st.perfectDays).toBe(ref.perfectDays);
      expect(st.met).toEqual(ref.met);
      expect([...st.unlocked].sort()).toEqual([...ref.unlocked].sort());
      expect(Object.fromEntries(st.xpByDay)).toEqual(Object.fromEntries(ref.xpByDay));
    }
  });
});

describe('time of day', () => {
  it('maps hours to morning, midday and evening', () => {
    expect([4, 10, 11, 16, 17, 23, 2].map(slotAt)).toEqual(['morning', 'morning', 'midday', 'midday', 'evening', 'evening', 'evening']);
  });

  it('groups routines by time of day, flat when none has one', () => {
    const a = routine({ id: 'a' });
    const b = routine({ id: 'b', slot: 'evening' });
    const m = routine({ id: 'm', slot: 'morning' });
    expect(groupBySlot([a])).toEqual([{ key: 'any', items: [a] }]);
    expect(groupBySlot([a, b, m]).map((g) => [g.key, g.items.map((r) => r.id)])).toEqual([
      ['morning', ['m']],
      ['evening', ['b']],
      ['any', ['a']],
    ]);
    expect(groupBySlot([])).toEqual([]);
  });

  it('keeps a valid time of day on import and drops unknown ones', () => {
    const data = normalizeImport({ routines: { a: { title: 'A', scope: 'tag', target: 1, slot: 'evening' }, b: { title: 'B', slot: 'night' } } });
    expect(data.routines.a.slot).toBe('evening');
    expect(data.routines.b.slot).toBeUndefined();
  });
});
