import { formatLongDate, t } from '../i18n';
import { endDate, scheduleFor } from '../plan';
import type { Settings } from '../settings';
import { h } from './dom';
import { printItems } from './printModel';

/** Always rendered (hidden on screen) so the browser's own Print command works too. */
export function renderPrint(root: HTMLElement, s: Settings): void {
  const m = t(s.lang);
  root.replaceChildren(
    h('p', { class: 'print-title' },
      `${m.calName} · ${formatLongDate(s.start, s.lang)} – ${formatLongDate(endDate(s.start), s.lang)}`),
    h('ul', { class: 'print-list' },
      ...printItems(scheduleFor(s.start), s.lang).map((item) =>
        item.kind === 'month'
          ? h('li', { class: 'print-month' }, item.label)
          : h('li', { class: item.catchUp ? 'print-day catch-up' : 'print-day' }, item.text),
      ),
      // Inside the list so it flows into the last column instead of forcing a new page.
      h('li', { class: 'print-credit' }, m.credit),
    ),
  );
}
