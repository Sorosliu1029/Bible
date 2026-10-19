import { buildIcs, icsFilename, type IcsOptions } from '../ics';
import { scheduleFor } from '../plan';
import type { Settings } from '../settings';

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function icsOptions(s: Settings): IcsOptions {
  return s.mode === 'allDay'
    ? { mode: 'allDay' }
    : { mode: 'timed', time: s.time, durationMin: s.durationMin, alarmMin: s.alarmMin, tzid: browserTimeZone() };
}

/** Build the file from the current settings at click time and hand it to the browser. Throws on failure. */
export function downloadIcs(s: Settings): void {
  const text = buildIcs(scheduleFor(s.start), icsOptions(s), s.lang, new Date());
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFilename(s.start);
  document.body.append(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
