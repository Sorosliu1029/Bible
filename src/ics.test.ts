import { describe, expect, it } from 'vitest';
import { buildIcs, escapeText, foldLine, icsFilename } from './ics';
import { scheduleFor } from './plan';

const sched = scheduleFor({ y: 2026, m: 11, d: 1 });
const now = new Date(Date.UTC(2026, 9, 19, 12, 0, 0));

describe('buildIcs all-day', () => {
  const ics = buildIcs(sched, { mode: 'allDay' }, 'en', now);

  it('uses CRLF line endings and calendar wrapper', () => {
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('X-WR-CALNAME:TGC Two-Year Bible Plan');
    expect(ics).not.toContain('VTIMEZONE');
  });

  it('emits one all-day event per day', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(730);
    expect(ics).toContain('UID:tgc2y-day-001-20261101@sorosliu1029.github.io');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261101\r\nDTEND;VALUE=DATE:20261102');
    expect(ics).toContain('DTSTAMP:20261019T120000Z');
    expect(ics).toContain('SUMMARY:Day 1 · Genesis 1:1–2:3 | Psalm 1');
    expect(ics).toContain('SUMMARY:Day 30 · Catch-up day | Psalm');
  });

  it('matches the golden file', async () => {
    await expect(ics).toMatchFileSnapshot('./__snapshots__/allday-en.ics');
  });

  it('localizes text', () => {
    const zh = buildIcs(sched, { mode: 'allDay' }, 'zh-Hans', now);
    expect(zh).toContain('X-WR-CALNAME:TGC 两年读经计划');
    expect(zh).toContain('SUMMARY:第1天 · 创世记 1:1–2:3 | 诗篇 1');
  });
});

describe('text rules', () => {
  it('escapes special characters', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds at 75 octets without splitting characters', () => {
    const long = 'SUMMARY:' + '创'.repeat(40);
    const folded = foldLine(long).split('\r\n');
    expect(folded.length).toBeGreaterThan(1);
    folded.forEach((l) => expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75));
    expect(folded.slice(1).every((l) => l.startsWith(' '))).toBe(true);
    expect(folded.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(long);
  });

  it('names the file by start date', () => {
    expect(icsFilename({ y: 2026, m: 11, d: 1 })).toBe('tgc-two-year-plan-2026-11-01.ics');
  });
});
