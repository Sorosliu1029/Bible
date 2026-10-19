# Bible Reading Calendar — Design Spec

**Date:** 2026-10-19
**Status:** Draft for review

## 1. Summary

A public, static website that turns the **TGC Two-Year Bible Reading Plan** into a personal schedule starting on a user-chosen date. Users browse their schedule in an on-page calendar and download it as an `.ics` file to import into Apple, Google, or Outlook calendar. The site is available in English, Simplified Chinese, and Traditional Chinese.

## 2. Goals and non-goals

### Goals
- Anyone can pick a start date and get a correct 730-day reading schedule.
- Download the schedule as a standards-compliant `.ics` that imports cleanly into Apple Calendar, Google Calendar, and Outlook.
- Browse the schedule on the page (month grid on desktop, list on mobile).
- Each reading links to the Bible text: ESV (esv.org) in English, 和合本 (BibleGateway) in Chinese.
- Full UI and book-name localization: EN / 简体 / 繁體.
- Free hosting on GitHub Pages with no backend.

### Non-goals (out of scope)
- User accounts, progress tracking, or check-offs.
- Calendar subscription feeds (`webcal://`) or OAuth direct import into Google/Outlook.
- Plans other than the TGC two-year plan.
- User-selectable Bible versions.
- Print / PDF export.

## 3. Users and success criteria

**Users:** the general public, mostly individual Christians, often on phones, English- or Chinese-speaking.

**Success criteria:**
- A first-time visitor can pick a date and download a calendar in under a minute without instructions.
- The downloaded file imports without errors into Apple Calendar (iOS + macOS), Google Calendar (web), and Outlook (web), in both all-day and timed modes, with correct local dates/times.
- All 730 days display correct, consistently formatted references in all three languages, and every reference link opens the right passage.

## 4. Source data

- Source: `TGC-Two-Year-Bible-Reading-Plan1.pdf` (in repo root).
- 730 sequential days. Each day has a **main** reading and a **supplemental** reading (Psalms/Proverbs). Some days are "Catch-up day" for the main reading.
- The plan is day-indexed. Calendar dates in the PDF are ignored: **day _n_ falls on `start + (n − 1)` days**, so leap years need no special handling.
- Raw references are inconsistent (e.g. `Prv` vs `Prov`, `Ps`, `Gn`, whole-book names like `Obadiah`) and use `.` as the chapter/verse separator.

## 5. Architecture

Static site built with **Vite + TypeScript**, no UI framework, deployed to **GitHub Pages**. All generation happens in the browser.

```
TGC PDF ──(offline, one-time)──> scripts/extract_plan.py ──> src/data/plan.json (committed)
                                                                    │
browser:  plan.ts ── scheduleFor(start) ──┬── ui/calendar (render)
                                          └── ics.ts ──> Blob download
          reference.ts (format + link)    i18n.ts (UI strings)
```

### 5.1 Data pipeline — `scripts/extract_plan.py`
- Refactored from the existing `bible-reading-plan-calendar.py` (pdfplumber extraction and Year 1/Year 2 ordering logic).
- Parses each raw reference into structured passages using standard **USFM book codes** (`GEN`, `PSA`, `PRO`, `1TH`, …) via an abbreviation alias table (`Gn`→`GEN`, `Prv`/`Prov`→`PRO`, …).
- Output `src/data/plan.json`:

```json
[
  { "day": 1, "main": [{ "book": "GEN", "start": [1, 1], "end": [2, 3] }],
               "supp": [{ "book": "PSA", "start": [1] }] },
  { "day": 30, "catchUp": true,
               "supp": [{ "book": "PSA", "start": [42] }] }
]
```

  A passage has `book`, `start` (`[chapter]` or `[chapter, verse]`), and optional `end` (`[chapter]` or `[chapter, verse]`). Whole-book readings (e.g. Obadiah) have `start: [1]` and the flag `"wholeBook": true`. A day may have more than one passage in `main` or `supp`.
- **Validation (script exits non-zero):** day count ≠ 730, any unknown abbreviation, any unparseable reference, any day missing `supp`.
- `plan.json` is committed. The site never reads the PDF. The old script and `BiblePlan_Sorted.ics` are removed once the new pipeline reproduces the same readings.

### 5.2 Modules (`src/`)

| Module | Responsibility | Depends on |
|---|---|---|
| `data/plan.json` | 730 structured days | — |
| `data/books.ts` | USFM code → `{ en, zhHans, zhHant, esvName, bgName }` for all 66 books | — |
| `plan.ts` | `scheduleFor(start: PlainDate): { date: PlainDate, day: PlanDay }[]`; `endDate(start)` | plan.json |
| `reference.ts` | `formatPassage(p, lang)` → e.g. "Genesis 1:1–2:3" / "创世记 1:1–2:3"; `passageUrl(p, lang)` | books.ts |
| `ics.ts` | `buildIcs(schedule, options, lang): string`. Pure, no DOM. | reference.ts, i18n.ts |
| `i18n.ts` | UI strings for `en`, `zh-Hans`, `zh-Hant`; language detection | — |
| `ui/` | form, calendar grid/list, download button, import help; URL-state sync | all above |

`PlainDate` is a `{ y, m, d }` value type with helper functions (add days, compare, format). No `Date`-timestamp arithmetic, to avoid DST/time-zone off-by-one errors.

### 5.3 Bible links
- **English:** `https://www.esv.org/<Book>+<ref>/` (e.g. `https://www.esv.org/Genesis+1:1-2:3/`).
- **简体:** BibleGateway, version `CUVS`: `https://www.biblegateway.com/passage/?search=<ref>&version=CUVS`.
- **繁體:** BibleGateway, version `CUV`.
- Links use English book names in the query string for reliability; the visible text is localized.

## 6. User experience

Single page, three areas.

### 6.1 Header
Title, one-line description, and language switcher (EN / 简 / 繁). The default comes from `navigator.language` (`zh-TW`/`zh-HK`/`zh-Hant*` → 繁; other `zh*` → 简; else EN). The choice is persisted in `localStorage`.

### 6.2 Setup panel
- **Start date:** date input, default today. Any date allowed.
- **Event style:** radio `All-day` (default) / `At a time`. `At a time` reveals:
  - Time (default 06:30)
  - Duration (default 30 min; options 15 / 30 / 45 / 60)
  - Reminder: None (default) / At start / 10 min before / 30 min before
  - Time zone: auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`, shown read-only
- **"Download calendar (.ics)"** primary button.
- **Plan end date** shown: "Finishes on <date>".
- **"How to import"** expandable help, with short steps for:
  - **Apple (iPhone/Mac):** open the downloaded file → Add All.
  - **Google Calendar:** on a computer, Settings → Import & export → Import (note: not possible in the Google Calendar mobile app).
  - **Outlook:** Add calendar → Upload from file.

### 6.3 Calendar view
- **Desktop (≥ 640px):** month grid opening on the start date's month. ‹ › navigation and a "Today" button, constrained to the plan's months. Each cell shows the day-of-month, plan day number, main reading, and supplemental reading as links. Catch-up days are muted. Dates outside the plan are blank.
- **Mobile (< 640px):** vertical list grouped by week, same content per day, scrolled to today (or the start date if today is outside the plan).

### 6.4 URL state
Settings sync to the query string, e.g. `?start=2026-11-01&lang=zh-Hans&mode=timed&time=06:30&dur=30&alarm=10`, so a configured page can be bookmarked or shared. Invalid values fall back to defaults and the URL is corrected via `history.replaceState`.

### 6.5 Language scope
The chosen language applies to UI strings, book names in the calendar, link targets, and the text of `.ics` events.

## 7. `.ics` output

- RFC 5545 compliant: CRLF line endings, lines folded at 75 **octets** (UTF-8-safe — never split a multi-byte character), text values escaped (`\\`, `\;`, `\,`, `\n`).
- Calendar properties: `PRODID`, `VERSION:2.0`, `CALSCALE:GREGORIAN`, `METHOD:PUBLISH`, `X-WR-CALNAME` (localized "TGC Two-Year Bible Plan").
- One `VEVENT` per day (730 total):
  - `UID`: `tgc2y-day-<NNN>-<startYYYYMMDD>@<site-host>` (stable for the same start date).
  - `DTSTAMP`: generation time in UTC.
  - `SUMMARY`: `Day 12 · Genesis 11:10–26 | Psalm 12` (localized; catch-up: `Day 30 · Catch-up day | Psalm …`).
  - `DESCRIPTION`: main and supplemental readings each with their link.
  - `URL`: link to the main passage (or the supplemental one on catch-up days).
  - **All-day:** `DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE` (next day).
  - **Timed:** `DTSTART;TZID=<zone>` / `DTEND;TZID=<zone>` plus a `VTIMEZONE` component for the zone, generated for the years the plan covers. If a reminder is chosen, add a `VALARM` (`ACTION:DISPLAY`, `TRIGGER:-PT10M` etc.).
- Filename: `tgc-two-year-plan-<start>.ics`.
- Delivered via `Blob` + object URL + `<a download>`. If that fails, show an inline error message.

## 8. Error handling and edge cases

| Case | Behavior |
|---|---|
| Missing/invalid `start` in URL | Use today; fix URL |
| Unknown `lang` | Detected language, then English |
| Invalid time/duration/alarm params | Defaults |
| Start date in the past | Allowed; calendar opens on today's month if within the plan |
| Plan spans DST changes | Timed events stay at the same local time (via `TZID` + `VTIMEZONE`) |
| Leap years | No special handling needed (day-indexed plan) |
| Blob download failure | Inline error with retry |
| JavaScript disabled | `<noscript>` message |
| Bad source data | Caught at build time by extractor validation and data tests |

## 9. Attribution

The footer credits The Gospel Coalition as the plan's source, with a link to the original plan, and states that the site is unofficial. **Open item:** confirm TGC's terms for redistributing the plan before launch.

## 10. Testing

**Unit tests (Vitest):**
- `plan.ts`: day 1 = start; day 730 = start + 729; ranges crossing Feb 29 and DST transitions.
- `reference.ts`: formatting in all three languages for single chapter, verse range, cross-chapter range, whole book, and multi-passage days; URL generation for ESV, CUVS, and CUV.
- `ics.ts`: CRLF endings; folding at 75 octets with Chinese text (no split characters); escaping; all-day vs. timed output; `VALARM` presence and absence; golden-file snapshot for a fixed start date and fixed `DTSTAMP`.
- Data: `plan.json` has 730 days, every passage's book code exists in `books.ts` with all names filled, and every day has `supp`.

**Manual pre-launch check:** import generated files (all-day and timed + reminder, EN and 中文) into Apple Calendar (iOS and macOS), Google Calendar (web), and Outlook (web). Verify dates, times, text, and links.

## 11. Delivery

- Repo layout: `scripts/` (Python extractor), `src/` (site), `specs/`, existing PDFs stay at root.
- GitHub Actions workflow on push to `master`: `npm ci` → `npm test` → `npm run build` → deploy `dist/` to GitHub Pages.
- Vite `base` is set to the repo path for project Pages hosting.
