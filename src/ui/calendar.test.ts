// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { parseSettings } from '../settings';
import { renderCalendar } from './calendar';

const s = parseSettings('?start=2026-11-01&lang=en', { today: { y: 2026, m: 10, d: 19 }, lang: 'en' });

describe('renderCalendar accessibility', () => {
  it('uses a table structure with rows and labelled cells, not an interactive grid', () => {
    const root = document.createElement('div');
    renderCalendar(root, s, { y: 2026, m: 10, d: 19 });
    expect(root.querySelector('[role="grid"], [role="gridcell"]')).toBeNull();
    const table = root.querySelector('.month-view [role="table"]')!;
    expect(table).not.toBeNull();
    const cells = [...table.querySelectorAll('[role="cell"]')];
    expect(cells.length).toBeGreaterThanOrEqual(35);
    for (const c of cells) expect(c.parentElement?.getAttribute('role')).toBe('row');
    expect(table.querySelectorAll('[role="row"] > [role="columnheader"]')).toHaveLength(7);
    // Each cell carries its full date for screen readers.
    expect(cells[0].querySelector('.sr-only')?.textContent).toBe('November 1, 2026');
  });
});
