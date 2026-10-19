import { formatISO, parsePlainDate, type PlainDate } from './date';
import type { Lang } from './types';

export type Duration = 15 | 30 | 45 | 60;
export type Alarm = null | 0 | 10 | 30;

export interface Settings {
  start: PlainDate;
  lang: Lang;
  mode: 'allDay' | 'timed';
  /** HH:MM, 24-hour. */
  time: string;
  durationMin: Duration;
  alarmMin: Alarm;
}

const LANGS: readonly Lang[] = ['en', 'zh-Hans', 'zh-Hant'];
const DURATIONS: readonly Duration[] = [15, 30, 45, 60];
const ALARMS: readonly Exclude<Alarm, null>[] = [0, 10, 30];
const DEFAULT_TIME = '06:30';

function validTime(s: string | null): s is string {
  const m = s?.match(/^(\d{2}):(\d{2})$/);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

export function parseSettings(search: string, fallback: { today: PlainDate; lang: Lang }): Settings {
  const q = new URLSearchParams(search);
  const lang = q.get('lang') as Lang;
  const time = q.get('time');
  const dur = Number(q.get('dur')) as Duration;
  const alarm = q.get('alarm');
  return {
    start: parsePlainDate(q.get('start') ?? '') ?? fallback.today,
    lang: LANGS.includes(lang) ? lang : fallback.lang,
    mode: q.get('mode') === 'timed' ? 'timed' : 'allDay',
    time: validTime(time) ? time : DEFAULT_TIME,
    durationMin: DURATIONS.includes(dur) ? dur : 30,
    alarmMin: alarm !== null && alarm !== '' && ALARMS.includes(Number(alarm) as 0) ? (Number(alarm) as Alarm) : null,
  };
}

export function serializeSettings(s: Settings): string {
  const q = new URLSearchParams({ start: formatISO(s.start), lang: s.lang });
  if (s.mode === 'timed') {
    q.set('mode', 'timed');
    q.set('time', s.time);
    q.set('dur', String(s.durationMin));
    q.set('alarm', s.alarmMin === null ? 'none' : String(s.alarmMin));
  }
  return `?${q.toString().replaceAll('%3A', ':')}`;
}
