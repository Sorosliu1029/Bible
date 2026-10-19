const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();

/** UTC offset of `tzid` at the instant `utcMs`, in minutes (east positive). */
export function offsetMinutes(tzid: string, utcMs: number): number {
  let f = formatters.get(tzid);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tzid, timeZoneName: 'longOffset' });
    formatters.set(tzid, f);
  }
  const name = f.formatToParts(utcMs).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0; // plain "GMT"
  const mins = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === '-' ? -mins : mins;
}

function formatOffset(mins: number): string {
  const abs = Math.abs(mins);
  const sign = mins < 0 ? '-' : '+';
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}${String(abs % 60).padStart(2, '0')}`;
}

/** Wall-clock time of `utcMs` at `offset`, as YYYYMMDDTHHMMSS. */
function localStamp(utcMs: number, offset: number): string {
  return new Date(utcMs + offset * MINUTE_MS).toISOString().replace(/[-:]/g, '').slice(0, 15);
}

/** Every offset change in [fromMs, toMs), found by daily steps refined to the minute. */
function transitions(tzid: string, fromMs: number, toMs: number): { at: number; from: number; to: number }[] {
  const found = [];
  let prevMs = fromMs;
  let prevOff = offsetMinutes(tzid, fromMs);
  for (let ms = fromMs + DAY_MS; ms <= toMs; ms += DAY_MS) {
    const off = offsetMinutes(tzid, ms);
    if (off !== prevOff) {
      // Binary search for the first minute carrying the new offset.
      let lo = prevMs;
      let hi = ms;
      while (hi - lo > MINUTE_MS) {
        const mid = lo + Math.floor((hi - lo) / 2 / MINUTE_MS) * MINUTE_MS;
        if (offsetMinutes(tzid, mid) === prevOff) lo = mid;
        else hi = mid;
      }
      found.push({ at: hi, from: prevOff, to: off });
    }
    prevMs = ms;
    prevOff = off;
  }
  return found;
}

export function buildVTimezone(tzid: string, fromYear: number, toYear: number): string[] {
  const fromMs = Date.UTC(fromYear, 0, 1);
  const toMs = Date.UTC(toYear, 11, 31);
  const initial = offsetMinutes(tzid, fromMs);
  const lines = [
    'BEGIN:VTIMEZONE',
    `TZID:${tzid}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    `TZOFFSETFROM:${formatOffset(initial)}`,
    `TZOFFSETTO:${formatOffset(initial)}`,
    'END:STANDARD',
  ];
  for (const tr of transitions(tzid, fromMs, toMs)) {
    const kind = tr.to > tr.from ? 'DAYLIGHT' : 'STANDARD';
    lines.push(
      `BEGIN:${kind}`,
      `DTSTART:${localStamp(tr.at, tr.from)}`,
      `TZOFFSETFROM:${formatOffset(tr.from)}`,
      `TZOFFSETTO:${formatOffset(tr.to)}`,
      `END:${kind}`,
    );
  }
  lines.push('END:VTIMEZONE');
  return lines;
}
