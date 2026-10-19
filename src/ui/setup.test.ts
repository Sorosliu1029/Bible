// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { parseSettings, type Settings } from '../settings';
import { renderSetup } from './setup';

const s = parseSettings('?start=2026-11-01&lang=en', { today: { y: 2026, m: 10, d: 19 }, lang: 'en' });

describe('start date input', () => {
  it('restores the current start when cleared or invalid, so input and download agree', () => {
    const root = document.createElement('div');
    const changes: Settings[] = [];
    renderSetup(root, s, (n) => changes.push(n));
    const input = root.querySelector<HTMLInputElement>('#start')!;
    input.value = '';
    input.dispatchEvent(new Event('change'));
    expect(changes).toHaveLength(0);
    expect(input.value).toBe('2026-11-01');
  });

  it('bounds the year to four digits', () => {
    const root = document.createElement('div');
    renderSetup(root, s, () => {});
    const input = root.querySelector<HTMLInputElement>('#start')!;
    expect(input.min).toBe('1900-01-01');
    expect(input.max).toBe('9999-12-31');
  });
});
