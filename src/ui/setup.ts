import { endDate } from '../plan';
import { formatISO, parsePlainDate } from '../date';
import { formatLongDate, t } from '../i18n';
import type { Alarm, Duration, Settings } from '../settings';
import { h } from './dom';
import { browserTimeZone, downloadIcs } from './download';

const DURATIONS: Duration[] = [15, 30, 45, 60];
const ALARMS: Alarm[] = [null, 0, 10, 30];

/**
 * Render the setup panel. Returns `update` to refresh derived text without
 * rebuilding inputs (so typing in a field never loses focus).
 */
export function renderSetup(
  root: HTMLElement,
  s: Settings,
  onChange: (next: Settings) => void,
): { update: (s: Settings) => void } {
  const m = t(s.lang);
  let current = s;
  const set = (patch: Partial<Settings>) => onChange({ ...current, ...patch });

  const finishes = h('p', { class: 'finishes' });
  const error = h('p', { class: 'error', role: 'alert', hidden: true });

  const startInput = h('input', {
    type: 'date',
    id: 'start',
    value: formatISO(s.start),
    required: true,
    onchange: (e: Event) => {
      const d = parsePlainDate((e.target as HTMLInputElement).value);
      if (d) set({ start: d });
    },
  });

  const radio = (mode: Settings['mode'], label: string) =>
    h('label', { class: 'radio' },
      h('input', { type: 'radio', name: 'mode', value: mode, checked: s.mode === mode, onchange: () => set({ mode }) }),
      h('span', {}, label),
    );

  const timed = h('div', { class: 'timed', hidden: s.mode !== 'timed' },
    h('label', { class: 'field' }, h('span', {}, m.time),
      h('input', {
        type: 'time',
        value: s.time,
        onchange: (e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          if (/^\d{2}:\d{2}$/.test(v)) set({ time: v });
        },
      }),
    ),
    h('label', { class: 'field' }, h('span', {}, m.duration),
      h('select', { onchange: (e: Event) => set({ durationMin: Number((e.target as HTMLSelectElement).value) as Duration }) },
        ...DURATIONS.map((d) => h('option', { value: String(d), selected: d === s.durationMin }, `${d} ${m.minutes}`)),
      ),
    ),
    h('label', { class: 'field' }, h('span', {}, m.reminder),
      h('select', {
        onchange: (e: Event) => {
          const v = (e.target as HTMLSelectElement).value;
          set({ alarmMin: v === 'none' ? null : (Number(v) as Alarm) });
        },
      },
        ...ALARMS.map((a) =>
          h('option', { value: a === null ? 'none' : String(a), selected: a === s.alarmMin },
            a === null ? m.reminderNone : a === 0 ? m.reminderAtStart : m.reminderBefore(a)),
        ),
      ),
    ),
    h('p', { class: 'field tz' }, h('span', {}, m.timeZone), h('output', {}, browserTimeZone())),
  );

  const download = h('button', {
    type: 'button',
    class: 'primary',
    onclick: () => {
      error.hidden = true;
      try {
        downloadIcs(current);
      } catch (err) {
        console.error(err);
        error.textContent = m.downloadError;
        error.hidden = false;
      }
    },
  }, m.download);

  const print = h('button', { type: 'button', class: 'secondary', onclick: () => window.print() }, m.print);

  root.replaceChildren(
    h('div', { class: 'setup-grid' },
      h('label', { class: 'field', for: 'start' }, h('span', {}, m.startDate), startInput),
      h('fieldset', { class: 'field' }, h('legend', {}, m.eventStyle),
        h('div', { class: 'radios' }, radio('allDay', m.allDay), radio('timed', m.atATime)),
      ),
    ),
    timed,
    finishes,
    h('div', { class: 'actions' }, download, print),
    error,
    h('details', { class: 'import-help' },
      h('summary', {}, m.howToImport),
      h('ul', {}, h('li', {}, m.importApple), h('li', {}, m.importGoogle), h('li', {}, m.importOutlook)),
    ),
  );

  const update = (next: Settings) => {
    current = next;
    finishes.textContent = m.finishesOn(formatLongDate(endDate(next.start), next.lang));
    timed.hidden = next.mode !== 'timed';
  };
  update(s);
  return { update };
}
