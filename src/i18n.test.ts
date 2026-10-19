import { describe, expect, it } from 'vitest';
import { detectLang, formatLongDate, formatMonthDay, formatMonthYear, t, weekdayNames } from './i18n';

describe('detectLang', () => {
  it('maps browser languages', () => {
    expect(detectLang(['zh-TW'])).toBe('zh-Hant');
    expect(detectLang(['zh-HK'])).toBe('zh-Hant');
    expect(detectLang(['zh-Hant-HK'])).toBe('zh-Hant');
    expect(detectLang(['zh-CN'])).toBe('zh-Hans');
    expect(detectLang(['zh'])).toBe('zh-Hans');
    expect(detectLang(['fr', 'en'])).toBe('en');
    expect(detectLang(['fr', 'zh-TW'])).toBe('zh-Hant');
    expect(detectLang([])).toBe('en');
  });
});

describe('messages', () => {
  it('has fixed copy', () => {
    expect(t('zh-Hans').calName).toBe('TGC 两年读经计划');
    expect(t('zh-Hant').calName).toBe('TGC 兩年讀經計劃');
    expect(t('en').calName).toBe('TGC Two-Year Bible Plan');
    expect(t('en').dayN(12)).toBe('Day 12');
    expect(t('zh-Hans').dayN(12)).toBe('第12天');
    expect(t('en').catchUp).toBe('Catch-up day');
    expect(t('zh-Hant').catchUpShort).toBe('補讀');
    expect(t('zh-Hans').finishesOn('x')).toBe('结束于 x');
  });

  it('defines every key in every language', () => {
    for (const l of ['en', 'zh-Hans', 'zh-Hant'] as const)
      expect(Object.keys(t(l)).sort()).toEqual(Object.keys(t('en')).sort());
  });
});

describe('date formatting', () => {
  const d = { y: 2026, m: 11, d: 1 };
  it('formats dates per language', () => {
    expect(formatMonthDay(d, 'en')).toBe('Nov 1');
    expect(formatMonthDay(d, 'zh-Hant')).toBe('11月1日');
    expect(formatLongDate(d, 'en')).toBe('November 1, 2026');
    expect(formatLongDate(d, 'zh-Hans')).toBe('2026年11月1日');
    expect(formatMonthYear(2026, 11, 'en')).toBe('November 2026');
    expect(formatMonthYear(2026, 11, 'zh-Hans')).toBe('2026年11月');
    expect(weekdayNames('en')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(weekdayNames('zh-Hans')).toHaveLength(7);
  });
});

describe('import help', () => {
  it('tells users to import into a separate calendar', () => {
    expect(t('en').importGoogle).toMatch(/new calendar/i);
    expect(t('en').importApple).toMatch(/new calendar/i);
    expect(t('zh-Hans').importGoogle).toContain('新');
    expect(t('zh-Hant').importGoogle).toContain('新');
  });
});
