import { addDays, formatBasic, formatISO, type PlainDate } from './date';
import { t } from './i18n';
import type { ScheduledDay } from './plan';
import { formatPassage, formatPassages, passageUrl } from './reference';
import type { Lang } from './types';
import { buildVTimezone } from './vtimezone';

export type IcsOptions =
  | { mode: 'allDay' }
  | { mode: 'timed'; time: string; durationMin: number; alarmMin: number | null; tzid: string };

const UID_HOST = 'sorosliu1029.github.io';

export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold a content line at 75 UTF-8 octets, never splitting a code point. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    // Continuation lines carry a leading space, which counts toward the limit.
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += n;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function icsFilename(start: PlainDate): string {
  return `tgc-two-year-plan-${formatISO(start)}.ics`;
}

function utcStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function eventLines(e: ScheduledDay, lang: Lang): { summary: string; lines: string[] } {
  const m = t(lang);
  const { day } = e;
  const main = day.catchUp ? m.catchUp : formatPassages(day.main, lang);
  const summary = `${m.dayN(day.day)} · ${main} | ${formatPassages(day.supp, lang)}`;
  const description = [...day.main, ...day.supp]
    .map((p) => `${formatPassage(p, lang)} — ${passageUrl(p, lang)}`)
    .join('\n');
  const url = passageUrl(day.catchUp ? day.supp[0] : day.main[0], lang);
  return {
    summary,
    lines: [`SUMMARY:${escapeText(summary)}`, `DESCRIPTION:${escapeText(description)}`, `URL:${url}`],
  };
}

/** Start and end lines for one event. Timed ends roll over midnight onto the next date. */
function whenLines(date: PlainDate, opts: IcsOptions): string[] {
  if (opts.mode === 'allDay') {
    return [`DTSTART;VALUE=DATE:${formatBasic(date)}`, `DTEND;VALUE=DATE:${formatBasic(addDays(date, 1))}`];
  }
  const [h, m] = opts.time.split(':').map(Number);
  const startMin = h * 60 + m;
  const endMin = startMin + opts.durationMin;
  const stamp = (d: PlainDate, mins: number) =>
    `${formatBasic(d)}T${String(Math.floor(mins / 60)).padStart(2, '0')}${String(mins % 60).padStart(2, '0')}00`;
  const endDate = addDays(date, Math.floor(endMin / 1440));
  return [
    `DTSTART;TZID=${opts.tzid}:${stamp(date, startMin)}`,
    `DTEND;TZID=${opts.tzid}:${stamp(endDate, endMin % 1440)}`,
  ];
}

function alarmLines(summary: string, opts: IcsOptions): string[] {
  if (opts.mode !== 'timed' || opts.alarmMin === null) return [];
  const trigger = opts.alarmMin === 0 ? 'PT0M' : `-PT${opts.alarmMin}M`;
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(summary)}`, `TRIGGER:${trigger}`, 'END:VALARM'];
}

export function buildIcs(schedule: ScheduledDay[], opts: IcsOptions, lang: Lang, now: Date): string {
  const start = schedule[0].date;
  const stamp = utcStamp(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//sorosliu1029//TGC Two-Year Bible Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(t(lang).calName)}`,
  ];
  if (opts.mode === 'timed') {
    const lastYear = schedule[schedule.length - 1].date.y;
    lines.push(...buildVTimezone(opts.tzid, start.y - 1, lastYear + 1));
  }
  for (const e of schedule) {
    const { summary, lines: content } = eventLines(e, lang);
    lines.push(
      'BEGIN:VEVENT',
      `UID:tgc2y-day-${String(e.day.day).padStart(3, '0')}-${formatBasic(start)}@${UID_HOST}`,
      `DTSTAMP:${stamp}`,
      ...whenLines(e.date, opts),
      ...content,
      ...alarmLines(summary, opts),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
