import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareDates,
  dayOfWeek,
  formatBasic,
  formatISO,
  parsePlainDate,
  todayLocal,
} from './date';

describe('parsePlainDate', () => {
  it('parses real dates', () => {
    expect(parsePlainDate('2026-11-01')).toEqual({ y: 2026, m: 11, d: 1 });
    expect(parsePlainDate('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 });
  });
  it('rejects impossible or malformed dates', () => {
    expect(parsePlainDate('2026-02-30')).toBeNull();
    expect(parsePlainDate('2026-1-1')).toBeNull();
    expect(parsePlainDate('garbage')).toBeNull();
  });
});

describe('date arithmetic', () => {
  it('adds days across years and leap days', () => {
    expect(formatISO(addDays({ y: 2026, m: 11, d: 1 }, 729))).toBe('2028-10-30');
    expect(formatISO(addDays({ y: 2028, m: 2, d: 28 }, 1))).toBe('2028-02-29');
    expect(formatISO(addDays({ y: 2026, m: 12, d: 31 }, 1))).toBe('2027-01-01');
  });
  it('formats basic, weekday and compares', () => {
    expect(formatBasic({ y: 2026, m: 3, d: 8 })).toBe('20260308');
    expect(dayOfWeek({ y: 2026, m: 11, d: 1 })).toBe(0);
    expect(compareDates({ y: 2026, m: 1, d: 2 }, { y: 2026, m: 1, d: 1 })).toBeGreaterThan(0);
    expect(compareDates({ y: 2026, m: 1, d: 1 }, { y: 2026, m: 1, d: 1 })).toBe(0);
  });
  it('takes today from the local calendar date', () => {
    expect(todayLocal(new Date(2026, 9, 19, 23, 59))).toEqual({ y: 2026, m: 10, d: 19 });
  });
});
