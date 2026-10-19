# Bible
⛪ Read The Bible

**Two-Year Bible Reading Calendar**: https://bible.sorosliu.xyz/

Pick a start date and get the [TGC](https://www.thegospelcoalition.org/) Two-Year Bible Reading Plan as:

- an on-page calendar (month grid on desktop, list on phones),
- a downloadable `.ics` file for Apple, Google or Outlook calendar (all-day, or at a set time with an optional reminder),
- a printable 3-page checklist.

Available in English, 简体中文 and 繁體中文. Readings link to the ESV (English) or 和合本 on BibleGateway (Chinese).

## Development

```sh
npm install
npm run dev          # local dev server
npm test             # unit tests
npm run build        # production build into dist/
npx playwright install chromium   # once
npm run check:print  # confirm the print view is 3 pages (A4 + Letter, all languages)
```

Pushes to `master` are tested, built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Reading plan data

`src/data/plan.json` is generated once from `TGC-Two-Year-Bible-Reading-Plan1.pdf`:

```sh
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
.venv/bin/pytest -q                       # extractor tests
.venv/bin/python scripts/extract_plan.py  # regenerate src/data/plan.json
```

The extractor fails loudly on unknown book abbreviations, unparseable references, or a day count other than 730.

## Credits

The reading plan is by The Gospel Coalition. This site is unofficial and not affiliated with TGC.
Open item: confirm TGC's terms for redistributing the plan.

Design and implementation notes: `specs/` and `plans/`.
