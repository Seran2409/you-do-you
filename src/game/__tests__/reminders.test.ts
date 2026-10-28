import { describe, expect, it } from 'vitest';
import { dayDone, planReminders } from '../reminders';
import { emptyData, routine, todo } from './fixtures';

const TODAY = '2026-10-27';
const PUSH = { enabled: true, time: '07:30', evening: true, eveningTime: '20:00' };

describe('reminders', () => {
  it('counts what got done on a day', () => {
    const data = emptyData();
    data.todos.a = todo({ id: 'a', done: true, doneOn: TODAY, subs: [{ id: 's', title: 's', done: true, doneOn: TODAY }] });
    data.routines.r = routine({ id: 'r' });
    data.days[TODAY] = { date: TODAY, routines: { r: 2 } };
    expect(dayDone(data, TODAY)).toEqual({ todos: 1, subs: 1, checkins: 2, total: 4 });
  });

  it('plans the next mornings; the first one knows yesterday', () => {
    const data = emptyData();
    data.todos.y = todo({ id: 'y', done: true, doneOn: TODAY });
    data.todos.o = todo({ id: 'o' });
    const plan = planReminders(data, { ...PUSH, evening: false }, 3, TODAY, '21:15');
    expect(plan[0]).toMatchObject({ kind: 'morning', day: '2026-10-28', time: '07:30', doneYesterday: 1, open: 1 });
    expect(plan.filter((r) => r.kind === 'morning')).toHaveLength(7);
    expect(plan[1]).toMatchObject({ day: '2026-10-29', doneYesterday: null });
  });

  it('includes this morning when it has not passed yet', () => {
    const plan = planReminders(emptyData(), { ...PUSH, evening: false }, 3, TODAY, '06:00');
    expect(plan[0]).toMatchObject({ day: TODAY, doneYesterday: 0 });
    expect(plan).toHaveLength(8);
  });

  it('skips tonight once the daily goal is reached', () => {
    const data = emptyData();
    data.routines.r = routine({ id: 'r', target: 5 });
    data.days[TODAY] = { date: TODAY, routines: { r: 3 } };
    const evenings = planReminders(data, { ...PUSH, enabled: false }, 3, TODAY, '12:00');
    expect(evenings.every((r) => r.kind === 'evening')).toBe(true);
    expect(evenings[0].day).toBe('2026-10-28');
    data.days[TODAY] = { date: TODAY, routines: { r: 1 } };
    expect(planReminders(data, { ...PUSH, enabled: false }, 3, TODAY, '12:00')[0]).toMatchObject({ day: TODAY, remaining: 2 });
  });

  it('plans nothing when reminders are off', () => {
    expect(planReminders(emptyData(), { enabled: false }, 3, TODAY, '06:00')).toEqual([]);
    expect(planReminders(emptyData(), undefined, 3, TODAY, '06:00')).toEqual([]);
  });
});
