import { describe, expect, it } from 'vitest';
import { scheduleFor } from '../plan';
import { initialMonth, monthGrid, planMonths, weeks } from './calendarModel';

const sched = scheduleFor({ y: 2026, m: 11, d: 1 }); // a Sunday

describe('monthGrid', () => {
  it('builds Sunday-first weeks with plan entries', () => {
    const g = monthGrid(sched, 2026, 11);
    expect(g[0][0].date).toEqual({ y: 2026, m: 11, d: 1 });
    expect(g[0][0].entry?.day.day).toBe(1);
    expect(g.every((w) => w.length === 7)).toBe(true);
    expect(g.flat().filter((c) => c.date.m === 11)).toHaveLength(30);
  });

  it('leaves dates outside the plan empty', () => {
    const g = monthGrid(scheduleFor({ y: 2026, m: 11, d: 3 }), 2026, 11);
    expect(g[0][0].entry).toBeNull();
    expect(g[0][2].entry?.day.day).toBe(1);
  });

  it('pads with adjacent-month dates', () => {
    const g = monthGrid(sched, 2026, 12); // Dec 1 2026 is a Tuesday
    expect(g[0][0].date).toEqual({ y: 2026, m: 11, d: 29 });
    expect(g[0][0].entry?.day.day).toBe(29);
  });
});

describe('navigation helpers', () => {
  it('lists plan months', () => {
    expect(planMonths(sched)).toHaveLength(24);
    expect(planMonths(sched)[0]).toEqual({ y: 2026, m: 11 });
    expect(planMonths(sched)[23]).toEqual({ y: 2028, m: 10 });
  });

  it('opens on today when inside the plan', () => {
    expect(initialMonth(sched, { y: 2027, m: 5, d: 9 })).toEqual({ y: 2027, m: 5 });
  });

  it('initial month falls back to start when today is outside plan', () => {
    expect(initialMonth(sched, { y: 2030, m: 1, d: 1 })).toEqual({ y: 2026, m: 11 });
    expect(initialMonth(sched, { y: 2020, m: 1, d: 1 })).toEqual({ y: 2026, m: 11 });
  });

  it('groups the schedule into weeks', () => {
    const w = weeks(sched);
    expect(w.flat()).toHaveLength(730);
    expect(w[0]).toHaveLength(7);
    const mid = weeks(scheduleFor({ y: 2026, m: 11, d: 4 })); // Wednesday start
    expect(mid[0]).toHaveLength(4);
  });
});
