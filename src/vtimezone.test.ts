import { describe, expect, it } from 'vitest';
import { buildVTimezone, offsetMinutes } from './vtimezone';

describe('offsetMinutes', () => {
  it('reads zone offsets', () => {
    expect(offsetMinutes('Asia/Shanghai', Date.UTC(2027, 0, 1))).toBe(480);
    expect(offsetMinutes('America/New_York', Date.UTC(2027, 0, 1))).toBe(-300);
    expect(offsetMinutes('America/New_York', Date.UTC(2027, 6, 1))).toBe(-240);
    expect(offsetMinutes('UTC', Date.UTC(2027, 0, 1))).toBe(0);
    expect(offsetMinutes('Asia/Kolkata', Date.UTC(2027, 0, 1))).toBe(330);
  });
});

describe('buildVTimezone', () => {
  it('emits DST transitions', () => {
    const ny = buildVTimezone('America/New_York', 2027, 2027).join('\n');
    expect(ny.startsWith('BEGIN:VTIMEZONE\nTZID:America/New_York')).toBe(true);
    expect(ny).toContain('BEGIN:DAYLIGHT\nDTSTART:20270314T020000\nTZOFFSETFROM:-0500\nTZOFFSETTO:-0400');
    expect(ny).toContain('BEGIN:STANDARD\nDTSTART:20271107T020000\nTZOFFSETFROM:-0400\nTZOFFSETTO:-0500');
    expect(ny.endsWith('END:VTIMEZONE')).toBe(true);
  });

  it('no-DST zone emits single STANDARD', () => {
    const sh = buildVTimezone('Asia/Shanghai', 2026, 2028);
    expect(sh.filter((l) => l === 'BEGIN:STANDARD')).toHaveLength(1);
    expect(sh).toContain('TZOFFSETTO:+0800');
    expect(sh).not.toContain('BEGIN:DAYLIGHT');
  });

  it('UTC zone', () => {
    expect(buildVTimezone('UTC', 2026, 2027)).toContain('TZOFFSETTO:+0000');
  });
});
