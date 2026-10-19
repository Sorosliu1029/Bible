import { compareDates, formatISO, type PlainDate } from '../date';
import { formatLongDate, formatMonthDay, formatMonthYear, t, weekdayNames } from '../i18n';
import { scheduleFor, type ScheduledDay } from '../plan';
import { formatPassage, passageUrl } from '../reference';
import type { Settings } from '../settings';
import type { Lang, Passage } from '../types';
import { h } from './dom';
import { initialMonth, monthGrid, planMonths, weeks, type YearMonth } from './calendarModel';

let viewed: YearMonth | null = null;
let viewedFor = '';
let scrolledOnce = false;

const links = (ps: Passage[], lang: Lang) =>
  ps.map((p) => h('a', { href: passageUrl(p, lang), target: '_blank', rel: 'noopener' }, formatPassage(p, lang)));

function readings(e: ScheduledDay, lang: Lang): HTMLElement {
  const m = t(lang);
  return h('div', { class: 'readings' },
    h('div', { class: 'main-reading' }, ...(e.day.catchUp ? [m.catchUp] : links(e.day.main, lang))),
    h('div', { class: 'supp-reading' }, ...links(e.day.supp, lang)),
  );
}

const same = (a: PlainDate, b: PlainDate) => compareDates(a, b) === 0;

export function renderCalendar(root: HTMLElement, s: Settings, today: PlainDate): void {
  const m = t(s.lang);
  const schedule = scheduleFor(s.start);
  const months = planMonths(schedule);
  // Re-open on the initial month whenever the start date changes.
  if (viewedFor !== formatISO(s.start) || !viewed) {
    viewed = initialMonth(schedule, today);
    viewedFor = formatISO(s.start);
  }
  const idx = months.findIndex((x) => x.y === viewed!.y && x.m === viewed!.m);
  const todayInPlan =
    compareDates(today, schedule[0].date) >= 0 && compareDates(today, schedule[schedule.length - 1].date) <= 0;
  const todayMonth = { y: today.y, m: today.m };
  const go = (ym: YearMonth) => {
    viewed = ym;
    renderCalendar(root, s, today);
  };

  const grid = h('div', { class: 'month-view' },
    h('div', { class: 'month-nav' },
      h('button', { type: 'button', 'aria-label': m.prevMonth, disabled: idx <= 0, onclick: () => go(months[idx - 1]) }, '‹'),
      h('h2', {}, formatMonthYear(viewed.y, viewed.m, s.lang)),
      h('button', { type: 'button', 'aria-label': m.nextMonth, disabled: idx >= months.length - 1, onclick: () => go(months[idx + 1]) }, '›'),
      h('button', { type: 'button', class: 'today-btn', disabled: !todayInPlan, onclick: () => go(todayMonth) }, m.today),
    ),
    h('div', { class: 'grid', role: 'grid' },
      ...weekdayNames(s.lang).map((w) => h('div', { class: 'weekday', role: 'columnheader' }, w)),
      ...monthGrid(schedule, viewed.y, viewed.m).flat().map((c) => {
        const cls = ['cell'];
        if (c.date.m !== viewed!.m) cls.push('other-month');
        if (!c.entry) cls.push('empty');
        if (c.entry?.day.catchUp) cls.push('catch-up');
        if (same(c.date, today)) cls.push('is-today');
        return h('div', { class: cls.join(' '), role: 'gridcell' },
          h('div', { class: 'cell-head' },
            h('span', { class: 'dom' }, String(c.date.d)),
            c.entry && h('span', { class: 'plan-day' }, m.dayN(c.entry.day.day)),
          ),
          c.entry && readings(c.entry, s.lang),
        );
      }),
    ),
  );

  let target: HTMLElement | null = null;
  const focus = todayInPlan ? today : s.start;
  const list = h('div', { class: 'list-view' },
    ...weeks(schedule).map((week) =>
      h('section', { class: 'week' },
        h('h3', {}, `${formatMonthDay(week[0].date, s.lang)} – ${formatMonthDay(week[week.length - 1].date, s.lang)}`),
        ...week.map((e) => {
          const row = h('div', { class: `row${e.day.catchUp ? ' catch-up' : ''}${same(e.date, today) ? ' is-today' : ''}` },
            h('div', { class: 'row-date' },
              h('time', { dateTime: formatISO(e.date), title: formatLongDate(e.date, s.lang) }, formatMonthDay(e.date, s.lang)),
              h('span', { class: 'plan-day' }, m.dayN(e.day.day)),
            ),
            readings(e, s.lang),
          );
          if (same(e.date, focus)) target = row;
          return row;
        }),
      ),
    ),
  );

  root.replaceChildren(grid, list);

  if (!scrolledOnce && target && window.matchMedia('(max-width: 639px)').matches) {
    scrolledOnce = true;
    (target as HTMLElement).scrollIntoView({ block: 'start' });
  }
}
