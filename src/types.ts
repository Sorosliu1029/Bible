export type Lang = 'en' | 'zh-Hans' | 'zh-Hant';
/** USFM book code, e.g. 'GEN', '1SA', 'PSA'. */
export type BookCode = string;
export type VersePart = 'a' | 'b' | 'c';
export type Ref = [number] | [number, number] | [number, number, VersePart];

export interface Passage {
  book: BookCode;
  start: Ref;
  end?: Ref;
  wholeBook?: true;
}

export interface PlanDay {
  day: number;
  main: Passage[];
  supp: Passage[];
  catchUp?: true;
}

export interface Book {
  en: string;
  zhHans: string;
  zhHant: string;
  enShort: string;
  zhHansShort: string;
  zhHantShort: string;
  chapters: number;
}
