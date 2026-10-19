import { describe, expect, it } from 'vitest';
import { parseSettings, serializeSettings } from './settings';

const fb = { today: { y: 2026, m: 10, d: 19 }, lang: 'en' as const };

describe('parseSettings', () => {
  it('uses defaults for an empty query', () => {
    expect(parseSettings('', fb)).toEqual({
      start: fb.today, lang: 'en', mode: 'allDay', time: '06:30', durationMin: 30, alarmMin: null,
    });
  });

  it('reads every parameter', () => {
    expect(parseSettings('?start=2026-11-01&lang=zh-Hans&mode=timed&time=07:15&dur=45&alarm=10', fb)).toMatchObject({
      start: { y: 2026, m: 11, d: 1 }, lang: 'zh-Hans', mode: 'timed', time: '07:15', durationMin: 45, alarmMin: 10,
    });
  });

  it('rejects impossible dates and times', () => {
    expect(parseSettings('?start=2026-02-30&time=25:99&dur=20&alarm=5&lang=fr&mode=x', fb)).toEqual(parseSettings('', fb));
  });

  it('round-trips through serializeSettings', () => {
    const timed = parseSettings('?start=2026-11-01&mode=timed&alarm=0', fb);
    expect(parseSettings(serializeSettings(timed), fb)).toEqual(timed);
    const allDay = parseSettings('?start=2026-11-01&lang=zh-Hant', fb);
    expect(serializeSettings(allDay)).toBe('?start=2026-11-01&lang=zh-Hant');
  });
});
