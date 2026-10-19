import { describe, expect, it } from 'vitest';
import { displayWidth, formatPassage, formatPassages, passageUrl } from './reference';
import type { Passage } from './types';

const gen: Passage = { book: 'GEN', start: [1, 1], end: [2, 3] };

describe('formatPassage', () => {
  it('formats in all three languages', () => {
    expect(formatPassage(gen, 'en')).toBe('Genesis 1:1–2:3');
    expect(formatPassage(gen, 'zh-Hans')).toBe('创世记 1:1–2:3');
    expect(formatPassage(gen, 'zh-Hant')).toBe('創世記 1:1–2:3');
  });

  it('formats compactly', () => {
    expect(formatPassage(gen, 'en', { compact: true })).toBe('Gn 1:1–2:3');
    expect(formatPassage(gen, 'zh-Hans', { compact: true })).toBe('创 1:1–2:3');
  });

  it('handles every range shape', () => {
    expect(formatPassage({ book: 'PSA', start: [1] }, 'en')).toBe('Psalm 1');
    expect(formatPassage({ book: '2SA', start: [13], end: [14] }, 'en')).toBe('2 Samuel 13–14');
    expect(formatPassage({ book: 'PRO', start: [15, 1], end: [15, 29] }, 'en')).toBe('Proverbs 15:1–29');
    expect(formatPassage({ book: 'PRO', start: [21], end: [22, 16] }, 'en')).toBe('Proverbs 21:1–22:16');
    expect(formatPassage({ book: '1SA', start: [2, 12], end: [4, 1, 'a'] }, 'en')).toBe('1 Samuel 2:12–4:1a');
    expect(formatPassage({ book: 'JON', start: [1], wholeBook: true }, 'zh-Hans')).toBe('约拿书');
  });

  it('joins multiple passages', () => {
    expect(formatPassages([gen, { book: 'GEN', start: [3] }], 'en')).toBe('Genesis 1:1–2:3; Genesis 3');
  });
});

describe('passageUrl', () => {
  it('links to ESV in English', () => {
    expect(passageUrl(gen, 'en')).toBe('https://www.esv.org/Genesis+1:1-2:3/');
    expect(passageUrl({ book: '1SA', start: [2, 12], end: [4, 1, 'a'] }, 'en')).toBe('https://www.esv.org/1+Samuel+2:12-4:1/');
  });

  it('links to CUV on BibleGateway in Chinese', () => {
    expect(passageUrl(gen, 'zh-Hans')).toBe('https://www.biblegateway.com/passage/?search=Genesis%201%3A1-2%3A3&version=CUVS');
    expect(passageUrl(gen, 'zh-Hant')).toContain('&version=CUV');
    expect(passageUrl(gen, 'zh-Hant')).not.toContain('CUVS');
  });

  it('covers whole books by chapter count', () => {
    expect(passageUrl({ book: 'JON', start: [1], wholeBook: true }, 'en')).toBe('https://www.esv.org/Jonah+1-4/');
    expect(passageUrl({ book: 'OBA', start: [1], wholeBook: true }, 'en')).toBe('https://www.esv.org/Obadiah+1/');
  });
});

describe('displayWidth', () => {
  it('counts CJK characters as 2', () => {
    expect(displayWidth('创 1:1')).toBe(6);
    expect(displayWidth('Gn 1:1')).toBe(6);
  });
});
