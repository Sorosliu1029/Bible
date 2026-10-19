/** A calendar date with no time or time zone. `m` is 1–12. */
export interface PlainDate {
  y: number;
  m: number;
  d: number;
}

const DAY_MS = 86_400_000;

// UTC has no DST, so day arithmetic through UTC timestamps is exact.
function toUtcMs(d: PlainDate): number {
  return Date.UTC(d.y, d.m - 1, d.d);
}

function fromUtcMs(ms: number): PlainDate {
  const dt = new Date(ms);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function parsePlainDate(s: string): PlainDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const parsed = { y, m, d };
  const roundTrip = fromUtcMs(toUtcMs(parsed));
  return compareDates(parsed, roundTrip) === 0 ? parsed : null;
}

export function formatISO(d: PlainDate): string {
  return `${pad(d.y, 4)}-${pad(d.m)}-${pad(d.d)}`;
}

export function formatBasic(d: PlainDate): string {
  return `${pad(d.y, 4)}${pad(d.m)}${pad(d.d)}`;
}

export function addDays(d: PlainDate, n: number): PlainDate {
  return fromUtcMs(toUtcMs(d) + n * DAY_MS);
}

export function compareDates(a: PlainDate, b: PlainDate): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

/** 0 = Sunday. */
export function dayOfWeek(d: PlainDate): number {
  return new Date(toUtcMs(d)).getUTCDay();
}

/** The viewer's local calendar date. */
export function todayLocal(now: Date = new Date()): PlainDate {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}
