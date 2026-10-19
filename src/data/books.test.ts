import { describe, expect, it } from 'vitest';
import { BOOKS, getBook } from './books';

describe('BOOKS', () => {
  it('has 66 fully named books', () => {
    expect(Object.keys(BOOKS)).toHaveLength(66);
    for (const [code, b] of Object.entries(BOOKS)) {
      for (const k of ['en', 'zhHans', 'zhHant', 'enShort', 'zhHansShort', 'zhHantShort'] as const)
        expect(b[k], `${code}.${k}`).toBeTruthy();
      expect(b.chapters, code).toBeGreaterThan(0);
    }
  });

  it('has expected names and short names', () => {
    expect(BOOKS.PSA).toMatchObject({ en: 'Psalm', zhHans: '诗篇', zhHant: '詩篇', enShort: 'Ps', zhHansShort: '诗', chapters: 150 });
    expect(BOOKS.GEN).toMatchObject({ en: 'Genesis', zhHans: '创世记', zhHant: '創世記', enShort: 'Gn', zhHansShort: '创' });
    expect(BOOKS['1TH'].enShort).toBe('1 Th');
    expect(BOOKS['1TH'].zhHansShort).toBe('帖前');
    expect(BOOKS.SNG.en).toBe('Song of Solomon');
    expect(BOOKS.JON.chapters).toBe(4);
    expect(BOOKS.REV.zhHantShort).toBe('啟');
  });

  it('throws on unknown codes', () => {
    expect(() => getBook('XXX')).toThrow();
  });
});
