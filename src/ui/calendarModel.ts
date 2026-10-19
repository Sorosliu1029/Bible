import { addDays, compareDates, dayOfWeek, formatISO, type PlainDate } from '../date';
import type { ScheduledDay } from '../plan';

export interface Cell {
  date: PlainDate;
  entry: ScheduledDay | null;
}

export interface YearMonth {
  y: number;
  m: number;
}

function entryIndex(schedule: ScheduledDay[]): Map<string, ScheduledDay> {
  return new Map(schedule.map((e) => [formatISO(e.date), e]));
}

/** Sunday-first weeks covering month `m` of year `y`, padded with adjacent-month dates. */
export function monthGrid(schedule: ScheduledDay[], y: number, m: number): Cell[][] {
  const index = entryIndex(schedule);
  const first = { y, m, d: 1 };
  let day = addDays(first, -dayOfWeek(first));
  const grid: Cell[][] = [];
  do {
    const week: Cell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: day, entry: index.get(formatISO(day)) ?? null });
      day = addDays(day, 1);
    }
    grid.push(week);
  } while (day.m === m);
  return grid;
}

export function planMonths(schedule: ScheduledDay[]): YearMonth[] {
  const months: YearMonth[] = [];
  for (const { date } of schedule) {
    const last = months[months.length - 1];
    if (!last || last.y !== date.y || last.m !== date.m) months.push({ y: date.y, m: date.m });
  }
  return months;
}

export function initialMonth(schedule: ScheduledDay[], today: PlainDate): YearMonth {
  const first = schedule[0].date;
  const last = schedule[schedule.length - 1].date;
  const inPlan = compareDates(today, first) >= 0 && compareDates(today, last) <= 0;
  const d = inPlan ? today : first;
  return { y: d.y, m: d.m };
}

/** The schedule split into Sunday-first weeks (the first and last may be partial). */
export function weeks(schedule: ScheduledDay[]): ScheduledDay[][] {
  const out: ScheduledDay[][] = [];
  for (const e of schedule) {
    if (out.length === 0 || dayOfWeek(e.date) === 0) out.push([]);
    out[out.length - 1].push(e);
  }
  return out;
}
