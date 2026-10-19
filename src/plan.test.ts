import { describe, expect, it } from 'vitest';
import { BOOKS } from './data/books';
import { endDate, PLAN, scheduleFor } from './plan';

describe('plan data', () => {
  it('has 730 well-formed days with known books', () => {
    expect(PLAN).toHaveLength(730);
    PLAN.forEach((d, i) => {
      expect(d.day).toBe(i + 1);
      expect(d.supp.length).toBeGreaterThan(0);
      expect(d.catchUp ? d.main.length === 0 : d.main.length > 0).toBe(true);
      [...d.main, ...d.supp].forEach((p) => expect(BOOKS[p.book], p.book).toBeDefined());
    });
  });
});

describe('scheduleFor', () => {
  it('maps day n to start + n - 1', () => {
    const s = scheduleFor({ y: 2026, m: 11, d: 1 });
    expect(s).toHaveLength(730);
    expect(s[0].date).toEqual({ y: 2026, m: 11, d: 1 });
    expect(s[0].day.day).toBe(1);
    expect(s[729].date).toEqual({ y: 2028, m: 10, d: 30 });
    expect(endDate({ y: 2026, m: 11, d: 1 })).toEqual({ y: 2028, m: 10, d: 30 });
  });

  it('includes Feb 29 in leap years', () => {
    const leap = scheduleFor({ y: 2028, m: 2, d: 28 });
    expect(leap[1].date).toEqual({ y: 2028, m: 2, d: 29 });
    expect(leap[1].day.day).toBe(2);
  });

  it('stays contiguous across DST changes', () => {
    const dst = scheduleFor({ y: 2027, m: 3, d: 13 });
    expect(dst.slice(0, 3).map((x) => x.date.d)).toEqual([13, 14, 15]);
  });
});
