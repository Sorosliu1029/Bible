import { todayLocal } from './date';
import { detectLang, t } from './i18n';
import { parseSettings, serializeSettings, type Settings } from './settings';
import type { Lang } from './types';
import { renderCalendar } from './ui/calendar';
import { renderPrint } from './ui/print';
import { renderSetup } from './ui/setup';

const LANG_KEY = 'lang';

function storedLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'en' || v === 'zh-Hans' || v === 'zh-Hant' ? v : null;
  } catch {
    return null;
  }
}

function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage may be unavailable (private mode); the URL still carries the language.
  }
}

const $ = (id: string) => document.getElementById(id)!;

let state: Settings = parseSettings(location.search, {
  today: todayLocal(),
  lang: storedLang() ?? detectLang(navigator.languages ?? [navigator.language]),
});
let setupKey = '';
let setup: { update: (s: Settings) => void } | null = null;

function renderChrome(): void {
  const m = t(state.lang);
  document.documentElement.lang = state.lang;
  document.title = m.title;
  $('title').textContent = m.title;
  $('tagline').textContent = m.tagline;
  $('credit').textContent = m.credit;
  $('unofficial').textContent = m.unofficial;
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-lang]')) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
  }
}

function render(): void {
  history.replaceState(null, '', serializeSettings(state));
  renderChrome();
  // Rebuild the setup panel only when its shape changes, so inputs keep focus.
  const key = state.lang;
  if (key !== setupKey || !setup) {
    setup = renderSetup($('setup'), state, update);
    setupKey = key;
  } else {
    setup.update(state);
  }
  renderCalendar($('calendar'), state, todayLocal());
  renderPrint($('print'), state);
}

function update(next: Settings): void {
  state = next;
  render();
}

for (const b of document.querySelectorAll<HTMLButtonElement>('[data-lang]')) {
  b.addEventListener('click', () => {
    const lang = b.dataset.lang as Lang;
    storeLang(lang);
    update({ ...state, lang });
  });
}

render();
