// Verifies the print view fits on exactly 3 pages for every language and paper size.
// Usage: npm run check:print   (needs `npx playwright install chromium` once)
import { chromium } from 'playwright';
import { preview } from 'vite';

const LANGS = ['en', 'zh-Hans', 'zh-Hant'];
const FORMATS = ['A4', 'Letter'];
const EXPECTED = 3;

const server = await preview({ preview: { port: 4173, strictPort: true } });
const browser = await chromium.launch();
const page = await browser.newPage();
let ok = true;
try {
  for (const lang of LANGS) {
    await page.goto(`http://localhost:4173/Bible/?start=2026-11-01&lang=${lang}`);
    for (const format of FORMATS) {
      const pdf = await page.pdf({ format, printBackground: false, preferCSSPageSize: true });
      const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
      const pass = pages === EXPECTED;
      ok &&= pass;
      console.log(`${lang.padEnd(8)} ${format.padEnd(7)} ${pages} page(s) ${pass ? 'OK' : 'FAIL'}`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(ok ? 0 : 1);
