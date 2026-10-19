# Bible Reading Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, trilingual website where a user picks a start date and gets the 730-day TGC Two-Year Bible Reading Plan as an on-page calendar, a downloadable `.ics`, and a 3-page printable checklist.

**Architecture:** A one-time Python extractor turns the TGC PDF into a committed, validated `src/data/plan.json`. The browser app (Vite + TypeScript, no framework) is a set of pure modules (dates, plan schedule, reference formatting, i18n, settings, `.ics`/`VTIMEZONE` generation, calendar and print view models) plus thin DOM renderers. GitHub Actions tests, builds, and deploys to GitHub Pages.

**Tech Stack:** TypeScript 5 (strict), Vite, Vitest, Playwright (print page-count check only), Python 3 + pdfplumber + pytest (extractor only), GitHub Actions + GitHub Pages.

**Spec:** `specs/2026-10-19-bible-reading-calendar-design.md`

## Global Constraints

- No runtime dependencies: `package.json` `dependencies` stays empty; everything else is a `devDependency`.
- No UI framework. Plain DOM APIs only.
- All calendar-date math goes through `PlainDate` (`src/date.ts`). Never do day arithmetic on local-time `Date` objects.
- Language codes are exactly `en`, `zh-Hans`, `zh-Hant`.
- Plan length is exactly **730** days; day _n_ = `start + (n − 1)` days.
- Vite `base` is `/Bible/` (repo `Sorosliu1029/Bible`, project Pages site).
- `.ics` UID host: `sorosliu1029.github.io`. UID format: `tgc2y-day-<NNN>-<startYYYYMMDD>@sorosliu1029.github.io` (NNN zero-padded to 3).
- `.ics` filename: `tgc-two-year-plan-<YYYY-MM-DD>.ics`.
- Bible links: EN → `https://www.esv.org/<Book>+<ref>/`; 简 → BibleGateway `version=CUVS`; 繁 → BibleGateway `version=CUV`. Link query strings use English book names.
- Display ranges use an en dash `–`. URL ranges use a hyphen `-`.
- Python work happens in a repo-local venv `.venv` (gitignored), set up with `python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt`.

**Decisions beyond the spec (found in the source data):**
1. References contain partial verses (`1 Sam 2.12-4.1a`, `Mark 6.6b-8.21`). A `Ref` may carry a part letter: `[4, 1, "a"]`. Display keeps the letter (`4:1a`); URLs drop it (`4:1`).
2. Multi-chapter whole-book readings (Jonah, Habakkuk, Haggai, Nahum) need chapter counts for URLs, so `books.ts` has `chapters`. `esvName`/`bgName` collapse into the single English name `en`, used for both link targets.
3. The print-width budget is measured on the whole line with a display-width count (CJK = 2, everything else = 1), limit **46**. The spec's ≈32/≈18 counted only part of the line and was too tight for real data (the longest reading pair is already ~31 characters).

## Review Focus

1. A URL like `?start=2026-02-30` or `?time=25:99` is well-formed but invalid. It must fall back to defaults, not render `NaN` or throw. (Task 6 test `rejects impossible dates and times`.)
2. A timed event late in the evening (`time=23:45`, 30 min) crosses midnight, so `DTEND` must be on the next date. (Task 8 test `timed event crossing midnight ends next day`.)
3. Browser time zone `UTC` / `Etc/UTC` or a no-DST zone like `Asia/Shanghai` must still produce a valid `VTIMEZONE`. (Task 8 tests `no-DST zone emits single STANDARD` and `UTC zone`.)
4. A start date more than two years ago or in the future means today is outside the plan. The calendar must then open on the start month, not an empty month. (Task 10 test `initial month falls back to start when today is outside plan`.)
5. After the user changes language or start date, the download, calendar, and print view must all reflect the new settings, not values cached from page load. (Task 9 manual check step and Task 11 Playwright check, which runs per language.)

---

### Task 1: Project scaffold and `PlainDate`

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `src/date.ts`
- Test: `src/date.test.ts`

**Interfaces:**
- Produces:
  - `interface PlainDate { y: number; m: number; d: number }` (m is 1–12)
  - `parsePlainDate(s: string): PlainDate | null` accepts only real `YYYY-MM-DD` dates
  - `formatISO(d: PlainDate): string` → `"2026-11-01"`
  - `formatBasic(d: PlainDate): string` → `"20261101"`
  - `addDays(d: PlainDate, n: number): PlainDate`
  - `compareDates(a: PlainDate, b: PlainDate): number` (negative/0/positive)
  - `dayOfWeek(d: PlainDate): number` (0 = Sunday)
  - `todayLocal(now?: Date): PlainDate` (the viewer's local calendar date)

- [ ] **Step 1: Scaffold.**
  - `npm init -y` and set `"type": "module"`.
  - Install devDependencies: `typescript vite vitest`.
  - Scripts: `"dev": "vite"`, `"build": "tsc --noEmit && vite build"`, `"test": "vitest run"`.
  - `tsconfig.json`: `strict`, `target ES2022`, `module ESNext`, `moduleResolution bundler`, `resolveJsonModule`, `lib ["ES2022","DOM"]`.
  - `vite.config.ts`: `base: '/Bible/'`.
  - `.gitignore`: `node_modules/`, `dist/`, `.venv/`, `__pycache__/`.

- [ ] **Step 2: Write failing tests in `src/date.test.ts`**

```ts
expect(parsePlainDate('2026-11-01')).toEqual({ y: 2026, m: 11, d: 1 });
expect(parsePlainDate('2026-02-30')).toBeNull();
expect(parsePlainDate('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 });
expect(parsePlainDate('2026-1-1')).toBeNull();
expect(parsePlainDate('garbage')).toBeNull();
expect(formatISO(addDays({ y: 2026, m: 11, d: 1 }, 729))).toBe('2028-10-30');
expect(formatISO(addDays({ y: 2028, m: 2, d: 28 }, 1))).toBe('2028-02-29');
expect(formatISO(addDays({ y: 2026, m: 12, d: 31 }, 1))).toBe('2027-01-01');
expect(formatBasic({ y: 2026, m: 3, d: 8 })).toBe('20260308');
expect(dayOfWeek({ y: 2026, m: 11, d: 1 })).toBe(0); // Sunday
expect(compareDates({ y: 2026, m: 1, d: 2 }, { y: 2026, m: 1, d: 1 })).toBeGreaterThan(0);
expect(todayLocal(new Date(2026, 9, 19, 23, 59))).toEqual({ y: 2026, m: 10, d: 19 });
```

- [ ] **Step 2b: Run** `npx vitest run src/date.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `src/date.ts`.** Do arithmetic through `Date.UTC(...)` / `getUTC*` (UTC has no DST). `parsePlainDate` uses `/^\d{4}-\d{2}-\d{2}$/` and then a round-trip check.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: scaffold vite project and PlainDate helpers`.

---

### Task 2: Book table

**Files:**
- Create: `src/types.ts`, `src/data/books.ts`
- Test: `src/data/books.test.ts`

**Interfaces:**
- Produces in `src/types.ts`:
  ```ts
  export type Lang = 'en' | 'zh-Hans' | 'zh-Hant';
  export type BookCode = string; // USFM, e.g. 'GEN', '1SA', 'PSA'
  export type VersePart = 'a' | 'b' | 'c';
  export type Ref = [number] | [number, number] | [number, number, VersePart];
  export interface Passage { book: BookCode; start: Ref; end?: Ref; wholeBook?: true }
  export interface PlanDay { day: number; main: Passage[]; supp: Passage[]; catchUp?: true }
  export interface Book { en: string; zhHans: string; zhHant: string;
    enShort: string; zhHansShort: string; zhHantShort: string; chapters: number }
  ```
- Produces in `books.ts`: `BOOKS: Record<BookCode, Book>` (66 entries, canonical order) and `getBook(code): Book` (throws on an unknown code).

- [ ] **Step 1: Write failing tests.**

```ts
expect(Object.keys(BOOKS)).toHaveLength(66);
for (const [code, b] of Object.entries(BOOKS)) {
  for (const k of ['en','zhHans','zhHant','enShort','zhHansShort','zhHantShort'] as const)
    expect(b[k], `${code}.${k}`).toBeTruthy();
  expect(b.chapters).toBeGreaterThan(0);
}
expect(BOOKS.PSA).toMatchObject({ en: 'Psalm', zhHans: '诗篇', zhHant: '詩篇', enShort: 'Ps', zhHansShort: '诗', chapters: 150 });
expect(BOOKS.GEN).toMatchObject({ en: 'Genesis', zhHans: '创世记', zhHant: '創世記', enShort: 'Gn', zhHansShort: '创' });
expect(BOOKS['1TH'].enShort).toBe('1 Th');
expect(BOOKS['1TH'].zhHansShort).toBe('帖前');
expect(BOOKS.SNG.en).toBe('Song of Solomon');
expect(BOOKS.JON.chapters).toBe(4);
expect(() => getBook('XXX')).toThrow();
```

- [ ] **Step 2: Run** `npx vitest run src/data/books.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `books.ts`.**
  - `en`: standard English names, with `PSA` = `Psalm` (singular, used in display and links).
  - `zhHans`/`zhHant`: 和合本 book names.
  - Short names to use verbatim, in canonical order:
    - `enShort`: Gn Ex Lv Nm Dt Jos Jgs Ru 1 Sm 2 Sm 1 Kgs 2 Kgs 1 Chr 2 Chr Ezr Neh Est Jb Ps Prv Eccl Sg Is Jer Lam Ez Dn Hos Jl Am Ob Jon Mi Na Hb Zep Hg Zec Mal Mt Mk Lk Jn Acts Rom 1 Cor 2 Cor Gal Eph Phil Col 1 Th 2 Th 1 Tm 2 Tm Ti Phlm Heb Jas 1 Pt 2 Pt 1 Jn 2 Jn 3 Jn Jude Rv
    - `zhHansShort`: 创 出 利 民 申 书 士 得 撒上 撒下 王上 王下 代上 代下 拉 尼 斯 伯 诗 箴 传 歌 赛 耶 哀 结 但 何 珥 摩 俄 拿 弥 鸿 哈 番 该 亚 玛 太 可 路 约 徒 罗 林前 林后 加 弗 腓 西 帖前 帖后 提前 提后 多 门 来 雅 彼前 彼后 约一 约二 约三 犹 启
    - `zhHantShort`: 創 出 利 民 申 書 士 得 撒上 撒下 王上 王下 代上 代下 拉 尼 斯 伯 詩 箴 傳 歌 賽 耶 哀 結 但 何 珥 摩 俄 拿 彌 鴻 哈 番 該 亞 瑪 太 可 路 約 徒 羅 林前 林後 加 弗 腓 西 帖前 帖後 提前 提後 多 門 來 雅 彼前 彼後 約一 約二 約三 猶 啟
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add trilingual Bible book table`.

---

### Task 3: PDF extractor → `plan.json`

**Files:**
- Create: `scripts/extract_plan.py`, `scripts/test_extract_plan.py`, `scripts/requirements.txt` (`pdfplumber`, `pytest`), `src/data/plan.json` (generated)
- Delete (last step): `bible-reading-plan-calendar.py`, `BiblePlan_Sorted.ics`

**Interfaces:**
- Consumes: the `Passage`/`PlanDay` JSON shape from Task 2. USFM codes must match `BOOKS` keys.
- Produces:
  - `extract_raw(pdf_path) -> list[tuple[str, str]]`: 730 `(main, supp)` raw strings in plan order. This is the existing script's pdfplumber + Year 1/Year 2 ordering logic, moved here.
  - `parse_reference(raw: str) -> list[dict]`: raises `ValueError` on an unknown book or bad syntax. Returns `[]` for `Catch-up day`.
  - `build_plan(raw_days) -> list[dict]`
  - `validate(plan) -> None`: raises `SystemExit(1)` with a message.
  - CLI: `.venv/bin/python scripts/extract_plan.py [pdf] [out]`, with defaults `TGC-Two-Year-Bible-Reading-Plan1.pdf` and `src/data/plan.json`.

**Parsing rules:**
- **Book token:** a leading optional `1 `/`2 `/`3 ` plus letters. Map it through `ALIASES`, which must include every token seen in the data:
  - `Gn Exod Lev Num Deut Dt Josh Judges Ruth 1 Sam 1 Sa 2 Sam 1 Kgs 1 K 2 Kgs 2 Kg 1 Chr 2 Chr Ezra Neh Esth Job Ps Prv Prov Pr P Eccl Song Isa Jer Lam Ez Dan Hos Joel Amos Obadiah Jonah Mic Nahum Habakkuk Zeph Haggai Zech Mal Matt Mark Mk Luke Lk John Acts Rom 1 Cor 2 Cor Gal Eph Phil Col 1 Thess 2 Thess 1 Tim 2 Tim Titus Philemon Heb James 1 Pet 2 Pet 1 Jn 2 John 3 John Jude Rev`
  - `Ez` = Ezekiel and `P` = Proverbs.
- **Reference:** `chap[.verse[part]]` optionally followed by `-` (spaces allowed around it) and another `chap[.verse[part]]`.
- **A bare number after `-`:**
  - If the start has a verse, it's a verse in the same chapter (`Prv 15.1- 29` → end `[15, 29]`).
  - Otherwise it's a chapter (`2 Sam 13-14` → end `[14]`).
- **No numbers:** `wholeBook: true`, `start: [1]`.
- **Catch-up:** `Catch-up day` as the main reading → `main: []`, `catchUp: true`.

- [ ] **Step 1: Set up the venv.** Run `python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt`.
- [ ] **Step 2: Write failing tests in `scripts/test_extract_plan.py`.**

```python
assert parse_reference("Gn 1.1-2.3") == [{"book": "GEN", "start": [1, 1], "end": [2, 3]}]
assert parse_reference("Ps 1") == [{"book": "PSA", "start": [1]}]
assert parse_reference("2 Sam 13-14") == [{"book": "2SA", "start": [13], "end": [14]}]
assert parse_reference("Prv 15.1- 29") == [{"book": "PRO", "start": [15, 1], "end": [15, 29]}]
assert parse_reference("Prv 21- 22.16") == [{"book": "PRO", "start": [21], "end": [22, 16]}]
assert parse_reference("1 Sam 2.12-4.1a") == [{"book": "1SA", "start": [2, 12], "end": [4, 1, "a"]}]
assert parse_reference("Mark 6.6b-8.21") == [{"book": "MRK", "start": [6, 6, "b"], "end": [8, 21]}]
assert parse_reference("Obadiah") == [{"book": "OBA", "start": [1], "wholeBook": True}]
assert parse_reference("P 5.1-6.19")[0]["book"] == "PRO"
assert parse_reference("Ez 4-5")[0]["book"] == "EZK"
assert parse_reference("Catch-up day") == []
with pytest.raises(ValueError): parse_reference("Foo 1")
with pytest.raises(ValueError): parse_reference("Gn 1.x")
# validate
with pytest.raises(SystemExit): validate([{"day": 1, "main": [], "supp": []}])  # wrong count + missing supp
```

- [ ] **Step 3: Run** `.venv/bin/pytest scripts -q`. Expected: FAIL (import error).
- [ ] **Step 4: Implement `scripts/extract_plan.py`.** Write JSON with `ensure_ascii=False` and one day per line, for readable diffs.
- [ ] **Step 5: Run** `.venv/bin/pytest scripts -q`. Expected: PASS.
- [ ] **Step 6: Generate the data.** Run `.venv/bin/python scripts/extract_plan.py`. Expected: exit 0, and `src/data/plan.json` has 730 entries.
- [ ] **Step 7: Regression check against the old output.**
  - Compare `extract_raw()` against `BiblePlan_Sorted.ics`:
    ```bash
    .venv/bin/python -c "import re,sys;sys.path.insert(0,'scripts');from extract_plan import extract_raw;r=extract_raw('TGC-Two-Year-Bible-Reading-Plan1.pdf');o=re.findall(r'DESCRIPTION:Main: (.*)\\\\nSupplemental: (.*)',open('BiblePlan_Sorted.ics').read());print(r==[tuple(x) for x in o])"
    ```
  - Expected: `True`.
  - Then delete `bible-reading-plan-calendar.py` and `BiblePlan_Sorted.ics`.
- [ ] **Step 8: Commit** `feat: extract TGC plan into validated plan.json`. Include the scripts, `plan.json`, and the deletions.

---

### Task 4: `plan.ts` schedule

**Files:**
- Create: `src/plan.ts`
- Test: `src/plan.test.ts` (also the data-integrity tests)

**Interfaces:**
- Consumes: `PlainDate`/`addDays` (Task 1), `PlanDay` and `BOOKS` (Task 2), `src/data/plan.json` (Task 3).
- Produces:
  - `interface ScheduledDay { date: PlainDate; day: PlanDay }`
  - `PLAN: PlanDay[]`
  - `PLAN_LENGTH = 730`
  - `scheduleFor(start: PlainDate): ScheduledDay[]`
  - `endDate(start: PlainDate): PlainDate`

- [ ] **Step 1: Write failing tests.**

```ts
// data integrity
expect(PLAN).toHaveLength(730);
PLAN.forEach((d, i) => {
  expect(d.day).toBe(i + 1);
  expect(d.supp.length).toBeGreaterThan(0);
  expect(d.catchUp ? d.main.length === 0 : d.main.length > 0).toBe(true);
  [...d.main, ...d.supp].forEach(p => expect(BOOKS[p.book], p.book).toBeDefined());
});
// schedule
const s = scheduleFor({ y: 2026, m: 11, d: 1 });
expect(s).toHaveLength(730);
expect(s[0].date).toEqual({ y: 2026, m: 11, d: 1 });
expect(s[729].date).toEqual({ y: 2028, m: 10, d: 30 });
expect(endDate({ y: 2026, m: 11, d: 1 })).toEqual({ y: 2028, m: 10, d: 30 });
const leap = scheduleFor({ y: 2028, m: 2, d: 28 });
expect(leap[1].date).toEqual({ y: 2028, m: 2, d: 29 });
expect(leap[1].day.day).toBe(2);
// DST: consecutive dates across US DST change are contiguous
const dst = scheduleFor({ y: 2027, m: 3, d: 13 });
expect(dst.slice(0, 3).map(x => x.date.d)).toEqual([13, 14, 15]);
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Use `import planData from './data/plan.json'` cast to `PlanDay[]`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: compute 730-day schedule from start date`.

---

### Task 5: `reference.ts` formatting and links

**Files:**
- Create: `src/reference.ts`
- Test: `src/reference.test.ts`

**Interfaces:**
- Consumes: `Passage`, `Lang`, `getBook`, `PLAN`.
- Produces:
  - `formatPassage(p: Passage, lang: Lang, opts?: { compact?: boolean }): string`
  - `formatPassages(ps: Passage[], lang: Lang, opts?): string`: joins with `; `
  - `passageUrl(p: Passage, lang: Lang): string`
  - `displayWidth(s: string): number`: characters in U+2E80–U+9FFF and U+FF00–U+FFEF count 2, others count 1

**Format rules:** the book name is followed by a space, then the reference.
- Whole book: name only.
- `[c]` → `c`. `[c]–[c2]` → `c–c2`.
- `[c,v]–[c,v2]` (same chapter) → `c:v–v2`. `[c,v]–[c2,v2]` → `c:v–c2:v2`.
- `[c]–[c2,v2]` → `c:1–c2:v2`.
- Part letters are appended to the verse.
- URL refs use the same structure with `-`, no part letters, and the English `en` name. Whole book → `1-<chapters>`, or `1` for single-chapter books.

- [ ] **Step 1: Write failing tests.**

```ts
const gen = { book: 'GEN', start: [1, 1], end: [2, 3] } as Passage;
expect(formatPassage(gen, 'en')).toBe('Genesis 1:1–2:3');
expect(formatPassage(gen, 'zh-Hans')).toBe('创世记 1:1–2:3');
expect(formatPassage(gen, 'zh-Hant')).toBe('創世記 1:1–2:3');
expect(formatPassage(gen, 'en', { compact: true })).toBe('Gn 1:1–2:3');
expect(formatPassage(gen, 'zh-Hans', { compact: true })).toBe('创 1:1–2:3');
expect(formatPassage({ book: 'PSA', start: [1] }, 'en')).toBe('Psalm 1');
expect(formatPassage({ book: '2SA', start: [13], end: [14] }, 'en')).toBe('2 Samuel 13–14');
expect(formatPassage({ book: 'PRO', start: [15, 1], end: [15, 29] }, 'en')).toBe('Proverbs 15:1–29');
expect(formatPassage({ book: 'PRO', start: [21], end: [22, 16] }, 'en')).toBe('Proverbs 21:1–22:16');
expect(formatPassage({ book: '1SA', start: [2, 12], end: [4, 1, 'a'] }, 'en')).toBe('1 Samuel 2:12–4:1a');
expect(formatPassage({ book: 'JON', start: [1], wholeBook: true }, 'zh-Hans')).toBe('约拿书');
expect(formatPassages([gen, { book: 'GEN', start: [3] }], 'en')).toBe('Genesis 1:1–2:3; Genesis 3');
// URLs
expect(passageUrl(gen, 'en')).toBe('https://www.esv.org/Genesis+1:1-2:3/');
expect(passageUrl({ book: '1SA', start: [2, 12], end: [4, 1, 'a'] }, 'en')).toBe('https://www.esv.org/1+Samuel+2:12-4:1/');
expect(passageUrl(gen, 'zh-Hans')).toBe('https://www.biblegateway.com/passage/?search=Genesis%201%3A1-2%3A3&version=CUVS');
expect(passageUrl(gen, 'zh-Hant')).toContain('&version=CUV');
expect(passageUrl({ book: 'JON', start: [1], wholeBook: true }, 'en')).toBe('https://www.esv.org/Jonah+1-4/');
expect(passageUrl({ book: 'OBA', start: [1], wholeBook: true }, 'en')).toBe('https://www.esv.org/Obadiah+1/');
// width helper
expect(displayWidth('创 1:1')).toBe(6);
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement `src/reference.ts`.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: format Bible references and build passage links`.

(The print-line width budget test lives in Task 11, where the print line is defined.)

---

### Task 6: i18n and URL settings

**Files:**
- Create: `src/i18n.ts`, `src/settings.ts`
- Test: `src/i18n.test.ts`, `src/settings.test.ts`

**Interfaces:**
- Produces in `i18n.ts`:
  - `detectLang(navLangs: readonly string[]): Lang`: `zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant*` → `zh-Hant`; other `zh*` → `zh-Hans`; otherwise `en`. The first matching entry wins.
  - `t(lang: Lang): Messages`
  - `formatLongDate(d: PlainDate, lang)`: `November 1, 2026` / `2026年11月1日`
  - `formatMonthDay(d, lang)`: `Nov 1` / `11月1日`
  - `formatMonthYear(y, m, lang)`: `November 2026` / `2026年11月`
  - `weekdayNames(lang): string[7]`, Sunday first
- `Messages` keys: `title, tagline, startDate, eventStyle, allDay, atATime, time, duration, minutes, reminder, reminderNone, reminderAtStart, reminderBefore(n), timeZone, download, downloadError, print, finishesOn(date: string), howToImport, importApple, importGoogle, importOutlook, today, prevMonth, nextMonth, dayN(n), catchUp, catchUpShort, calName, credit, unofficial, noscript`.
- Fixed copy:

  | key | en | zh-Hans | zh-Hant |
  |---|---|---|---|
  | calName | TGC Two-Year Bible Plan | TGC 两年读经计划 | TGC 兩年讀經計劃 |
  | dayN(12) | Day 12 | 第12天 | 第12天 |
  | catchUp | Catch-up day | 补读日 | 補讀日 |
  | catchUpShort | Catch-up | 补读 | 補讀 |
  | finishesOn(x) | Finishes on x | 结束于 x | 結束於 x |

  The import steps follow spec §6.2, including the note that the Google mobile app can't import files.
- Produces in `settings.ts`:
  ```ts
  interface Settings { start: PlainDate; lang: Lang; mode: 'allDay' | 'timed';
    time: string /* HH:MM */; durationMin: 15 | 30 | 45 | 60; alarmMin: null | 0 | 10 | 30 }
  parseSettings(search: string, fallback: { today: PlainDate; lang: Lang }): Settings
  serializeSettings(s: Settings): string // e.g. "?start=2026-11-01&lang=en"
  ```
- `serializeSettings` writes only `start` and `lang` when `mode` is `allDay`. It writes `mode`, `time`, `dur`, and `alarm` too when `mode` is `timed` (`alarm=none` for null).

- [ ] **Step 1: Write failing tests.**

```ts
expect(detectLang(['zh-TW'])).toBe('zh-Hant');
expect(detectLang(['zh-Hant-HK'])).toBe('zh-Hant');
expect(detectLang(['zh-CN'])).toBe('zh-Hans');
expect(detectLang(['zh'])).toBe('zh-Hans');
expect(detectLang(['fr', 'en'])).toBe('en');
expect(t('zh-Hans').calName).toBe('TGC 两年读经计划');
expect(t('en').dayN(12)).toBe('Day 12');
expect(formatMonthDay({ y: 2026, m: 11, d: 1 }, 'zh-Hant')).toBe('11月1日');
// every language defines every key
for (const l of ['en', 'zh-Hans', 'zh-Hant'] as const) expect(Object.keys(t(l)).sort()).toEqual(Object.keys(t('en')).sort());

const fb = { today: { y: 2026, m: 10, d: 19 }, lang: 'en' as const };
expect(parseSettings('', fb)).toEqual({ start: fb.today, lang: 'en', mode: 'allDay', time: '06:30', durationMin: 30, alarmMin: null });
expect(parseSettings('?start=2026-11-01&lang=zh-Hans&mode=timed&time=07:15&dur=45&alarm=10', fb))
  .toMatchObject({ start: { y: 2026, m: 11, d: 1 }, lang: 'zh-Hans', mode: 'timed', time: '07:15', durationMin: 45, alarmMin: 10 });
// test name: rejects impossible dates and times
expect(parseSettings('?start=2026-02-30&time=25:99&dur=20&alarm=5&lang=fr', fb))
  .toEqual(parseSettings('', fb));
const s = parseSettings('?start=2026-11-01&mode=timed&alarm=0', fb);
expect(parseSettings(serializeSettings(s), fb)).toEqual(s);
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement both modules.** Use `Intl` only for weekday names. Build date strings with templates per language so the output is exact.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add trilingual strings and URL settings`.

---

### Task 7: `.ics` builder (all-day)

**Files:**
- Create: `src/ics.ts`
- Test: `src/ics.test.ts`, snapshot `src/__snapshots__/allday-en.ics`

**Interfaces:**
- Consumes: `ScheduledDay`, `formatPassages`, `passageUrl`, `t`, `formatBasic`, `addDays`.
- Produces:
  - `type IcsOptions = { mode: 'allDay' } | { mode: 'timed'; time: string; durationMin: number; alarmMin: number | null; tzid: string }`
  - `buildIcs(schedule: ScheduledDay[], opts: IcsOptions, lang: Lang, now: Date): string`
  - `escapeText(s: string): string`
  - `foldLine(line: string): string`: folds at 75 UTF-8 octets, continuation lines start with one space, never splits a code point
  - `icsFilename(start: PlainDate): string`

**Event content:**
- `SUMMARY`: `${dayN} · ${main or catchUp} | ${supp}`.
- `DESCRIPTION`: one line per passage, `"<formatted> — <url>"`, joined by `\n` (before escaping).
- `URL`: main passage link, or the first supp link on catch-up days.
- `DTSTAMP`: `now` in UTC, as `YYYYMMDDTHHMMSSZ`.

- [ ] **Step 1: Write failing tests.**

```ts
const sched = scheduleFor({ y: 2026, m: 11, d: 1 });
const now = new Date(Date.UTC(2026, 9, 19, 12, 0, 0));
const ics = buildIcs(sched, { mode: 'allDay' }, 'en', now);
expect(ics.split('\r\n').every(l => !l.includes('\n'))).toBe(true);
expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(730);
expect(ics).toContain('X-WR-CALNAME:TGC Two-Year Bible Plan');
expect(ics).toContain('UID:tgc2y-day-001-20261101@sorosliu1029.github.io');
expect(ics).toContain('DTSTART;VALUE=DATE:20261101\r\nDTEND;VALUE=DATE:20261102');
expect(ics).toContain('SUMMARY:Day 1 · Genesis 1:1–2:3 | Psalm 1');
expect(ics).toContain('SUMMARY:Day 30 · Catch-up day | Psalm');
expect(ics).not.toContain('VTIMEZONE');
expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
const long = 'SUMMARY:' + '创'.repeat(40);
const folded = foldLine(long).split('\r\n');
folded.forEach(l => expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75));
expect(folded.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(long);
expect(new TextEncoder().encode(buildIcs(sched, { mode: 'allDay' }, 'zh-Hans', now)).length).toBeGreaterThan(0);
expect(icsFilename({ y: 2026, m: 11, d: 1 })).toBe('tgc-two-year-plan-2026-11-01.ics');
await expect(ics).toMatchFileSnapshot('./__snapshots__/allday-en.ics');
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement `src/ics.ts`.** Make the timed branch `throw new Error('timed: Task 8')` for now.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, and the snapshot file is written. Open the snapshot and eyeball the first 3 events and day 30.
- [ ] **Step 5: Commit** `feat: generate all-day .ics calendar`.

---

### Task 8: `VTIMEZONE`, timed events, and reminders

**Files:**
- Create: `src/vtimezone.ts`
- Modify: `src/ics.ts` (timed branch)
- Test: `src/vtimezone.test.ts`, add to `src/ics.test.ts`

**Interfaces:**
- Produces:
  - `offsetMinutes(tzid: string, utcMs: number): number`: parse `Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })` output (`GMT`, `GMT+08:00`, `GMT-04:00`)
  - `buildVTimezone(tzid: string, fromYear: number, toYear: number): string[]`: unfolded lines, `BEGIN:VTIMEZONE` … `END:VTIMEZONE`

**Algorithm for `buildVTimezone`:**
1. Start at UTC `Jan 1 fromYear 00:00` and step one day at a time to `Dec 31 toYear`. Wherever the offset differs between steps, binary-search to the exact minute of change.
2. Emit a first `STANDARD` component: `DTSTART:19700101T000000`, with `TZOFFSETFROM` = `TZOFFSETTO` = the offset at the scan start.
3. For each transition, emit `DAYLIGHT` if the new offset is greater than the old one, otherwise `STANDARD`.
   - `DTSTART` is the local wall-clock time of the transition in the *old* offset (`YYYYMMDDTHHMMSS`).
   - `TZOFFSETFROM` is the old offset and `TZOFFSETTO` the new one, formatted `±HHMM`.
   - `TZNAME` is not emitted.

**`buildIcs` timed branch:**
- `DTSTART;TZID=<tzid>:<YYYYMMDD>T<HHMM>00`.
- `DTEND` is the start plus `durationMin` on the wall clock. When it passes 24:00 it rolls over to the next `PlainDate`.
- The `VTIMEZONE` is built for `startYear − 1 .. endYear + 1` and placed before the first `VEVENT`.
- If `alarmMin` is not null, add a `VALARM` with `ACTION:DISPLAY`, `DESCRIPTION:<summary>`, and `TRIGGER:-PT<n>M` (`TRIGGER:PT0M` when n = 0).

- [ ] **Step 1: Write failing tests.**

```ts
// vtimezone
const ny = buildVTimezone('America/New_York', 2027, 2027).join('\n');
expect(ny).toContain('BEGIN:DAYLIGHT\nDTSTART:20270314T020000\nTZOFFSETFROM:-0500\nTZOFFSETTO:-0400');
expect(ny).toContain('BEGIN:STANDARD\nDTSTART:20271107T020000\nTZOFFSETFROM:-0400\nTZOFFSETTO:-0500');
// test name: no-DST zone emits single STANDARD
const sh = buildVTimezone('Asia/Shanghai', 2026, 2028);
expect(sh.filter(l => l === 'BEGIN:STANDARD')).toHaveLength(1);
expect(sh).toContain('TZOFFSETTO:+0800');
expect(sh).not.toContain('BEGIN:DAYLIGHT');
// test name: UTC zone
expect(buildVTimezone('UTC', 2026, 2027)).toContain('TZOFFSETTO:+0000');
// ics timed
const base = { mode: 'timed', time: '06:30', durationMin: 30, alarmMin: 10, tzid: 'America/New_York' } as const;
const ics = buildIcs(scheduleFor({ y: 2026, m: 11, d: 1 }), base, 'en', now);
expect(ics).toContain('DTSTART;TZID=America/New_York:20261101T063000\r\nDTEND;TZID=America/New_York:20261101T070000');
expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(730);
expect(ics).toContain('TRIGGER:-PT10M');
expect(ics.indexOf('BEGIN:VTIMEZONE')).toBeLessThan(ics.indexOf('BEGIN:VEVENT'));
expect(buildIcs(sched, { ...base, alarmMin: null }, 'en', now)).not.toContain('VALARM');
expect(buildIcs(sched, { ...base, alarmMin: 0 }, 'en', now)).toContain('TRIGGER:PT0M');
// test name: timed event crossing midnight ends next day
expect(buildIcs(sched, { ...base, time: '23:45' }, 'en', now)).toContain('DTEND;TZID=America/New_York:20261102T001500');
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement `src/vtimezone.ts` and the timed branch of `buildIcs`.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS. The Task 7 snapshot is unchanged.
- [ ] **Step 5: Commit** `feat: timed events with VTIMEZONE and reminders`.

---

### Task 9: Page shell, setup panel, download

**Files:**
- Create: `index.html`, `src/main.ts`, `src/ui/setup.ts`, `src/ui/download.ts`, `src/styles.css`
- Test: manual (DOM wiring only; all logic is already tested)

**Interfaces:**
- Consumes: `parseSettings`/`serializeSettings`, `detectLang`, `t`, `scheduleFor`/`endDate`, `buildIcs`/`icsFilename`, `todayLocal`.
- Produces:
  - `main.ts` owns a single `state: Settings` and `render()`.
  - `renderSetup(root: HTMLElement, s: Settings, onChange: (s: Settings) => void)`
  - `downloadIcs(s: Settings): void`: builds the file at click time from the current state. It uses a Blob, an object URL, and a temporary `<a download>`. On exception it shows `t(lang).downloadError` inline with a retry button.
  - Later tasks provide `renderCalendar(root, s, today)` (Task 10) and `renderPrint(root, s)` (Task 11). `main.ts` calls both from `render()`.

**Page and behavior:**
- **Layout:** `index.html` contains:
  - `<header>`: title, tagline, and EN/简/繁 buttons.
  - `<section id="setup">` and `<section id="calendar">`.
  - `<section id="print" class="print-only">`.
  - `<footer>`: the credit with a link to `https://www.thegospelcoalition.org/`, plus `unofficial`.
  - A `<noscript>` message.
- **Language:**
  - Precedence: URL `lang` > `localStorage['lang']` > `detectLang(navigator.languages)`.
  - Changing the language writes `localStorage` (wrapped in try/catch) and sets `<html lang>`.
- **URL sync:** every state change calls `history.replaceState(null, '', serializeSettings(state))` and re-renders everything.
- **Time zone:** taken from `Intl.DateTimeFormat().resolvedOptions().timeZone`, shown read-only in timed mode.
- **Setup panel:**
  - It contains the date input, the all-day/timed radio, and the timed fields: time, duration select (15/30/45/60), reminder select, and time zone.
  - It also has the Download button, the Print button (`window.print()`), the `finishesOn(formatLongDate(endDate))` line, and a `<details>` element for the import instructions.
- **Styles:** `styles.css` is a mobile-first single column. `.print-only { display: none }` on screen.

- [ ] **Step 1: Implement the files above.**
- [ ] **Step 2: Run** `npm run build`. Expected: exit 0, no type errors.
- [ ] **Step 3: Manual check.** Run `npm run dev` and open the printed URL.
  - Download in all-day mode. The file is named `tgc-two-year-plan-<today>.ics`, starts with `BEGIN:VCALENDAR`, and has 730 events.
  - Switch to 简 and change the start to 2027-01-01, then download again. Without reloading, the new file has Chinese summaries and starts on 20270101.
  - Switch to timed mode with a 10-min reminder and download. The file contains `VTIMEZONE` and `VALARM`.
  - The URL reflects each change, and reloading the URL restores the same state.
  - Load `?start=2026-02-30`. The page falls back to today and the URL is corrected.
- [ ] **Step 4: Commit** `feat: page shell, setup panel and .ics download`.

---

### Task 10: Calendar view

**Files:**
- Create: `src/ui/calendarModel.ts`, `src/ui/calendar.ts`
- Modify: `src/styles.css`, `src/main.ts` (call `renderCalendar`)
- Test: `src/ui/calendarModel.test.ts`

**Interfaces:**
- Consumes: `ScheduledDay`, `scheduleFor`, `PlainDate` helpers, `formatPassages`, `passageUrl`, `t`, `weekdayNames`, `formatMonthYear`.
- Produces:
  - `interface Cell { date: PlainDate; entry: ScheduledDay | null }`
  - `monthGrid(schedule: ScheduledDay[], y: number, m: number): Cell[][]`: weeks run Sunday through Saturday. Leading and trailing cells from adjacent months are included with `entry: null` if outside the plan.
  - `planMonths(schedule): { y: number; m: number }[]`
  - `initialMonth(schedule, today: PlainDate): { y; m }`: today's month if today is within the plan, otherwise the start month
  - `weeks(schedule): ScheduledDay[][]`: Sunday-start weeks, for the mobile list
  - `renderCalendar(root: HTMLElement, s: Settings, today: PlainDate)`: renders the grid and the list. CSS shows the grid at ≥ 640px and the list below that.
    - ‹ › buttons are disabled at the first and last plan month. "Today" is disabled when today is outside the plan.
    - Readings are `<a target="_blank" rel="noopener">` links. Catch-up cells have class `catch-up` (muted).
    - On mobile, after rendering, scroll the list to today's or the start date's row with `scrollIntoView({ block: 'start' })`, only on first load.

- [ ] **Step 1: Write failing tests.**

```ts
const sched = scheduleFor({ y: 2026, m: 11, d: 1 }); // Sunday
const g = monthGrid(sched, 2026, 11);
expect(g[0][0].date).toEqual({ y: 2026, m: 11, d: 1 });
expect(g[0][0].entry?.day.day).toBe(1);
expect(g.every(w => w.length === 7)).toBe(true);
const dec = monthGrid(scheduleFor({ y: 2026, m: 11, d: 3 }), 2026, 11);
expect(dec[0][0].entry).toBeNull(); // Nov 1 is before the start
expect(planMonths(sched)).toHaveLength(24);
expect(planMonths(sched)[0]).toEqual({ y: 2026, m: 11 });
expect(initialMonth(sched, { y: 2027, m: 5, d: 9 })).toEqual({ y: 2027, m: 5 });
// test name: initial month falls back to start when today is outside plan
expect(initialMonth(sched, { y: 2030, m: 1, d: 1 })).toEqual({ y: 2026, m: 11 });
expect(initialMonth(sched, { y: 2020, m: 1, d: 1 })).toEqual({ y: 2026, m: 11 });
expect(weeks(sched).flat()).toHaveLength(730);
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement both files and the styles.**
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.
- [ ] **Step 5: Manual check** in `npm run dev`:
  - Desktop width: the grid shows day number, plan day, and both readings as links. ‹ › stop at the plan bounds. Catch-up days are muted.
  - At about 400px width: the list view appears, grouped by week, and opens at today's row.
  - Click a link in each language: EN opens esv.org, 简 opens BibleGateway CUVS, 繁 opens CUV, each at the right passage.
- [ ] **Step 6: Commit** `feat: month grid and mobile list calendar view`.

---

### Task 11: Print view (3 pages)

**Files:**
- Create: `src/ui/printModel.ts`, `src/ui/print.ts`, `scripts/check-print.mjs`
- Modify: `src/styles.css` (`@media print`), `src/main.ts` (call `renderPrint`), `package.json` (devDependency `playwright`; script `"check:print": "vite build && node scripts/check-print.mjs"`)
- Test: `src/ui/printModel.test.ts`

**Interfaces:**
- Consumes: `scheduleFor`/`endDate`, `formatPassages` (compact), `displayWidth`, `formatMonthDay`, `formatMonthYear`, `formatLongDate`, `t`.
- Produces:
  - `type PrintItem = { kind: 'month'; label: string } | { kind: 'day'; text: string; catchUp: boolean }`
  - `printItems(schedule: ScheduledDay[], lang: Lang): PrintItem[]`: a month item precedes each month's first day
  - `printLine(e: ScheduledDay, lang: Lang): string` → `☐ Nov 1  Gn 1:1–2:3 · Ps 1`. Catch-up days use `catchUpShort` in place of the main reading.
  - `renderPrint(root: HTMLElement, s: Settings)`: always renders into `#print`, so Ctrl+P works too.
    - Content: a header line `${calName} · ${formatLongDate(start)} – ${formatLongDate(end)}`, the list, and a final credit line.

**Print CSS:**
- `@media print`:
  - Hide everything except `#print`, and show `.print-only`.
  - `@page { margin: 10mm }`
  - `#print .list { columns: 3; column-gap: 4mm; column-fill: auto; font-size: var(--print-font, 7.5pt); line-height: 1.18 }`
  - Each item gets `break-inside: avoid; white-space: nowrap; overflow: hidden`. Catch-up items are italic and month labels bold.
  - `:lang(zh-Hans), :lang(zh-Hant)` may override `--print-font` if the check below fails.

- [ ] **Step 1: Write failing tests.**

```ts
const sched = scheduleFor({ y: 2026, m: 11, d: 1 });
expect(printLine(sched[0], 'en')).toBe('☐ Nov 1  Gn 1:1–2:3 · Ps 1');
expect(printLine(sched[0], 'zh-Hans')).toBe('☐ 11月1日  创 1:1–2:3 · 诗 1');
expect(printLine(sched[29], 'en')).toMatch(/^☐ Nov 30  Catch-up · Ps /);
const items = printItems(sched, 'en');
expect(items.filter(i => i.kind === 'day')).toHaveLength(730);
expect(items.filter(i => i.kind === 'month')).toHaveLength(24);
expect(items[0]).toEqual({ kind: 'month', label: 'November 2026' });
// width budget across every day, every language
for (const lang of ['en', 'zh-Hans', 'zh-Hant'] as const)
  for (const e of sched) expect(displayWidth(printLine(e, lang)), `${lang} day ${e.day.day}`).toBeLessThanOrEqual(46);
```

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement the model, renderer, and print CSS.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Write `scripts/check-print.mjs`.**
  - It serves `dist/` with `vite preview` on port 4173, base `/Bible/`.
  - For each lang in `[en, zh-Hans, zh-Hant]` and each format in `[A4, Letter]`, it opens `/Bible/?start=2026-11-01&lang=<lang>` in Playwright Chromium and calls `page.pdf({ format, printBackground: false })`. The margin comes from `@page` CSS (`preferCSSPageSize: true`).
  - It counts pages with `/\/Type\s*\/Page(?!s)/g`.
  - It prints a table and exits 1 unless every combination has exactly 3 pages.
  - Install Chromium first with `npx playwright install chromium`.
- [ ] **Step 6: Run** `npm run check:print`. Expected: all six combinations report `3` pages and the script exits 0. If any shows 4, lower `--print-font` for that language in 0.25pt steps (not below 6.75pt) and re-run. If any shows 2, that's fine; the spec says about 3 and fewer is acceptable, so don't change anything.
- [ ] **Step 7: Manual check.** Open print preview in Safari and Firefox (EN and 简). The output is 3 pages, columns fill top to bottom, and no line is clipped.
- [ ] **Step 8: Commit** `feat: compact 3-page printable checklist`.

---

### Task 12: CI deploy and README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

- [ ] **Step 1: Write `deploy.yml`.**
  - Triggers: `push` to `master` and `workflow_dispatch`.
  - Permissions: `pages: write`, `id-token: write`, `contents: read`.
  - Job `build`: `actions/checkout@v4`, then `actions/setup-node@v4` (node 24, cache npm), `npm ci`, `npm test`, `npm run build`, and `actions/upload-pages-artifact@v3` with `path: dist`.
  - Job `deploy`: needs `build`, uses `actions/deploy-pages@v4`, environment `github-pages`.
  - The print check is not run in CI; it stays a local pre-release step.
- [ ] **Step 2: Update `README.md`.**
  - What the site is, plus the live URL `https://sorosliu1029.github.io/Bible/`.
  - Dev commands: `npm i`, `npm run dev`, `npm test`, `npm run check:print`.
  - How to regenerate `plan.json`: the venv command and the extractor command.
  - The TGC credit and the open item about TGC's redistribution terms.
- [ ] **Step 3: Verify locally.** Run `npm ci && npm test && npm run build`. Expected: all pass, and `dist/index.html` references `/Bible/assets/...`.
- [ ] **Step 4: Commit** `ci: deploy to GitHub Pages`.
- [ ] **Step 5: Hand-off note (the user does this, not the agent).** Pushing to `origin/master` and setting **Settings → Pages → Source: GitHub Actions** both require the user's confirmation. After deploying, run the spec §10 manual import check in Apple, Google, and Outlook.
