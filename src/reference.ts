import { getBook } from './data/books';
import type { Book, Lang, Passage, Ref } from './types';

const BOOK_NAME_KEY: Record<Lang, { full: keyof Book; short: keyof Book }> = {
  en: { full: 'en', short: 'enShort' },
  'zh-Hans': { full: 'zhHans', short: 'zhHansShort' },
  'zh-Hant': { full: 'zhHant', short: 'zhHantShort' },
};

function point(ref: Ref, withPart: boolean): string {
  const [c, v, part] = ref;
  if (v === undefined) return String(c);
  return `${c}:${v}${withPart && part ? part : ''}`;
}

/** The chapter/verse part of a reference, e.g. "1:1–2:3", or "" for a whole book. */
function refText(p: Passage, dash: string, withPart: boolean): string {
  if (p.wholeBook) return '';
  const { start, end } = p;
  if (!end) return point(start, withPart);
  if (start.length === 1 && end.length === 1) return `${start[0]}${dash}${end[0]}`;
  // A chapter-only start running to a verse begins at verse 1: "21:1–22:16".
  const from: Ref = start.length === 1 ? [start[0], 1] : start;
  const to = end.length > 1 && end[0] === from[0] ? point(end, withPart).split(':')[1] : point(end, withPart);
  return `${point(from, withPart)}${dash}${to}`;
}

export function formatPassage(p: Passage, lang: Lang, opts: { compact?: boolean } = {}): string {
  const keys = BOOK_NAME_KEY[lang];
  const name = getBook(p.book)[opts.compact ? keys.short : keys.full];
  const ref = refText(p, '–', true);
  return ref ? `${name} ${ref}` : String(name);
}

export function formatPassages(ps: Passage[], lang: Lang, opts: { compact?: boolean } = {}): string {
  return ps.map((p) => formatPassage(p, lang, opts)).join('; ');
}

/** English query text for links: no part letters, whole books expanded to their chapters. */
function linkQuery(p: Passage): string {
  const book = getBook(p.book);
  const ref = p.wholeBook ? (book.chapters > 1 ? `1-${book.chapters}` : '1') : refText(p, '-', false);
  return `${book.en} ${ref}`;
}

export function passageUrl(p: Passage, lang: Lang): string {
  const query = linkQuery(p);
  if (lang === 'en') return `https://www.esv.org/${query.replaceAll(' ', '+')}/`;
  const version = lang === 'zh-Hans' ? 'CUVS' : 'CUV';
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(query)}&version=${version}`;
}

/** Approximate printed width: CJK and full-width characters count 2, others 1. */
export function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    w += (cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xff00 && cp <= 0xffef) ? 2 : 1;
  }
  return w;
}
