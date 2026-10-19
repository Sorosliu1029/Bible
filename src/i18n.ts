import type { PlainDate } from './date';
import type { Lang } from './types';

export interface Messages {
  title: string;
  tagline: string;
  startDate: string;
  eventStyle: string;
  allDay: string;
  atATime: string;
  time: string;
  duration: string;
  minutes: string;
  reminder: string;
  reminderNone: string;
  reminderAtStart: string;
  reminderBefore: (n: number) => string;
  timeZone: string;
  download: string;
  downloadError: string;
  print: string;
  finishesOn: (date: string) => string;
  howToImport: string;
  importApple: string;
  importGoogle: string;
  importOutlook: string;
  today: string;
  prevMonth: string;
  nextMonth: string;
  dayN: (n: number) => string;
  catchUp: string;
  catchUpShort: string;
  calName: string;
  credit: string;
  unofficial: string;
  noscript: string;
}

const en: Messages = {
  title: 'Two-Year Bible Reading Calendar',
  tagline: 'Pick a start date to get the TGC Two-Year Bible Reading Plan as a calendar you can import or print.',
  startDate: 'Start date',
  eventStyle: 'Calendar events',
  allDay: 'All-day',
  atATime: 'At a time',
  time: 'Time',
  duration: 'Duration',
  minutes: 'min',
  reminder: 'Reminder',
  reminderNone: 'None',
  reminderAtStart: 'At start',
  reminderBefore: (n) => `${n} min before`,
  timeZone: 'Time zone',
  download: 'Download calendar (.ics)',
  downloadError: 'The download failed. Please try again.',
  print: 'Print schedule',
  finishesOn: (date) => `Finishes on ${date}`,
  howToImport: 'How to import',
  importApple: 'Apple Calendar (iPhone/Mac): open the downloaded file, then tap “Add All”.',
  importGoogle:
    'Google Calendar: on a computer, open Settings → Import & export → Import, and choose the file. (The Google Calendar phone app can’t import files.)',
  importOutlook: 'Outlook: go to Add calendar → Upload from file, and choose the file.',
  today: 'Today',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  dayN: (n) => `Day ${n}`,
  catchUp: 'Catch-up day',
  catchUpShort: 'Catch-up',
  calName: 'TGC Two-Year Bible Plan',
  credit: 'Reading plan by The Gospel Coalition.',
  unofficial: 'This site is not affiliated with The Gospel Coalition.',
  noscript: 'This site needs JavaScript to build your calendar.',
};

const zhHans: Messages = {
  title: '两年读经日历',
  tagline: '选择开始日期，生成 TGC 两年读经计划日历，可导入日历或打印。',
  startDate: '开始日期',
  eventStyle: '日历事件',
  allDay: '全天',
  atATime: '指定时间',
  time: '时间',
  duration: '时长',
  minutes: '分钟',
  reminder: '提醒',
  reminderNone: '无',
  reminderAtStart: '开始时',
  reminderBefore: (n) => `提前 ${n} 分钟`,
  timeZone: '时区',
  download: '下载日历 (.ics)',
  downloadError: '下载失败，请重试。',
  print: '打印计划表',
  finishesOn: (date) => `结束于 ${date}`,
  howToImport: '如何导入',
  importApple: 'Apple 日历（iPhone/Mac）：打开下载的文件，然后点击“全部添加”。',
  importGoogle: 'Google 日历：在电脑上打开“设置 → 导入和导出 → 导入”，选择该文件。（Google 日历手机应用无法导入文件。）',
  importOutlook: 'Outlook：选择“添加日历 → 从文件上传”，然后选择该文件。',
  today: '今天',
  prevMonth: '上个月',
  nextMonth: '下个月',
  dayN: (n) => `第${n}天`,
  catchUp: '补读日',
  catchUpShort: '补读',
  calName: 'TGC 两年读经计划',
  credit: '读经计划来自 The Gospel Coalition (TGC)。',
  unofficial: '本网站与 TGC 无关联。',
  noscript: '本网站需要启用 JavaScript 才能生成日历。',
};

const zhHant: Messages = {
  title: '兩年讀經日曆',
  tagline: '選擇開始日期，產生 TGC 兩年讀經計劃日曆，可匯入日曆或列印。',
  startDate: '開始日期',
  eventStyle: '日曆事件',
  allDay: '全天',
  atATime: '指定時間',
  time: '時間',
  duration: '時長',
  minutes: '分鐘',
  reminder: '提醒',
  reminderNone: '無',
  reminderAtStart: '開始時',
  reminderBefore: (n) => `提前 ${n} 分鐘`,
  timeZone: '時區',
  download: '下載日曆 (.ics)',
  downloadError: '下載失敗，請重試。',
  print: '列印計劃表',
  finishesOn: (date) => `結束於 ${date}`,
  howToImport: '如何匯入',
  importApple: 'Apple 日曆（iPhone/Mac）：打開下載的檔案，然後點選「全部加入」。',
  importGoogle: 'Google 日曆：在電腦上打開「設定 → 匯入和匯出 → 匯入」，選擇該檔案。（Google 日曆手機應用程式無法匯入檔案。）',
  importOutlook: 'Outlook：選擇「新增行事曆 → 從檔案上傳」，然後選擇該檔案。',
  today: '今天',
  prevMonth: '上個月',
  nextMonth: '下個月',
  dayN: (n) => `第${n}天`,
  catchUp: '補讀日',
  catchUpShort: '補讀',
  calName: 'TGC 兩年讀經計劃',
  credit: '讀經計劃來自 The Gospel Coalition (TGC)。',
  unofficial: '本網站與 TGC 無關聯。',
  noscript: '本網站需要啟用 JavaScript 才能產生日曆。',
};

const MESSAGES: Record<Lang, Messages> = { en, 'zh-Hans': zhHans, 'zh-Hant': zhHant };

export function t(lang: Lang): Messages {
  return MESSAGES[lang];
}

export function detectLang(navLangs: readonly string[]): Lang {
  for (const raw of navLangs) {
    const l = raw.toLowerCase();
    if (/^zh-(tw|hk|mo|hant)/.test(l)) return 'zh-Hant';
    if (l === 'zh' || l.startsWith('zh-')) return 'zh-Hans';
    if (l === 'en' || l.startsWith('en-')) return 'en';
  }
  return 'en';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS: Record<Lang, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'zh-Hans': ['日', '一', '二', '三', '四', '五', '六'],
  'zh-Hant': ['日', '一', '二', '三', '四', '五', '六'],
};

export function formatLongDate(d: PlainDate, lang: Lang): string {
  return lang === 'en' ? `${MONTHS[d.m - 1]} ${d.d}, ${d.y}` : `${d.y}年${d.m}月${d.d}日`;
}

export function formatMonthDay(d: PlainDate, lang: Lang): string {
  return lang === 'en' ? `${MONTHS[d.m - 1].slice(0, 3)} ${d.d}` : `${d.m}月${d.d}日`;
}

export function formatMonthYear(y: number, m: number, lang: Lang): string {
  return lang === 'en' ? `${MONTHS[m - 1]} ${y}` : `${y}年${m}月`;
}

/** Sunday first. */
export function weekdayNames(lang: Lang): string[] {
  return WEEKDAYS[lang];
}
