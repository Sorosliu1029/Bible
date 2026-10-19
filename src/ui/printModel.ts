import { formatMonthDay, formatMonthYear, t } from '../i18n';
import type { ScheduledDay } from '../plan';
import { formatPassages } from '../reference';
import type { Lang } from '../types';

export type PrintItem = { kind: 'month'; label: string } | { kind: 'day'; text: string; catchUp: boolean };

export function printLine(e: ScheduledDay, lang: Lang): string {
  const main = e.day.catchUp ? t(lang).catchUpShort : formatPassages(e.day.main, lang, { compact: true });
  const supp = formatPassages(e.day.supp, lang, { compact: true });
  return `☐ ${formatMonthDay(e.date, lang)}  ${main} · ${supp}`;
}

export function printItems(schedule: ScheduledDay[], lang: Lang): PrintItem[] {
  const items: PrintItem[] = [];
  let month = '';
  for (const e of schedule) {
    const key = `${e.date.y}-${e.date.m}`;
    if (key !== month) {
      month = key;
      items.push({ kind: 'month', label: formatMonthYear(e.date.y, e.date.m, lang) });
    }
    items.push({ kind: 'day', text: printLine(e, lang), catchUp: !!e.day.catchUp });
  }
  return items;
}
