import { describe, expect, it } from 'vitest';
import { scheduleFor } from '../plan';
import { displayWidth } from '../reference';
import { printItems, printLine } from './printModel';

const sched = scheduleFor({ y: 2026, m: 11, d: 1 });

describe('printLine', () => {
  it('formats a compact checklist line', () => {
    expect(printLine(sched[0], 'en')).toBe('☐ Nov 1  Gn 1:1–2:3 · Ps 1');
    expect(printLine(sched[0], 'zh-Hans')).toBe('☐ 11月1日  创 1:1–2:3 · 诗 1');
    expect(printLine(sched[0], 'zh-Hant')).toBe('☐ 11月1日  創 1:1–2:3 · 詩 1');
  });

  it('marks catch-up days', () => {
    expect(printLine(sched[29], 'en')).toMatch(/^☐ Nov 30  Catch-up · Ps /);
  });

  it('fits the column width budget on every day in every language', () => {
    for (const lang of ['en', 'zh-Hans', 'zh-Hant'] as const)
      for (const e of sched) expect(displayWidth(printLine(e, lang)), `${lang} day ${e.day.day}`).toBeLessThanOrEqual(46);
  });
});

describe('printItems', () => {
  it('interleaves month labels with days', () => {
    const items = printItems(sched, 'en');
    expect(items.filter((i) => i.kind === 'day')).toHaveLength(730);
    expect(items.filter((i) => i.kind === 'month')).toHaveLength(24);
    expect(items[0]).toEqual({ kind: 'month', label: 'November 2026' });
    expect(items[1]).toMatchObject({ kind: 'day', catchUp: false });
    expect(items.find((i) => i.kind === 'day' && i.catchUp)).toBeDefined();
  });
});
