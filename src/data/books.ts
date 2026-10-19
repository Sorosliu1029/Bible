import type { Book, BookCode } from '../types';

// code | en | zhHans | zhHant | enShort | zhHansShort | zhHantShort | chapters
const ROWS = `
GEN|Genesis|创世记|創世記|Gn|创|創|50
EXO|Exodus|出埃及记|出埃及記|Ex|出|出|40
LEV|Leviticus|利未记|利未記|Lv|利|利|27
NUM|Numbers|民数记|民數記|Nm|民|民|36
DEU|Deuteronomy|申命记|申命記|Dt|申|申|34
JOS|Joshua|约书亚记|約書亞記|Jos|书|書|24
JDG|Judges|士师记|士師記|Jgs|士|士|21
RUT|Ruth|路得记|路得記|Ru|得|得|4
1SA|1 Samuel|撒母耳记上|撒母耳記上|1 Sm|撒上|撒上|31
2SA|2 Samuel|撒母耳记下|撒母耳記下|2 Sm|撒下|撒下|24
1KI|1 Kings|列王纪上|列王紀上|1 Kgs|王上|王上|22
2KI|2 Kings|列王纪下|列王紀下|2 Kgs|王下|王下|25
1CH|1 Chronicles|历代志上|歷代志上|1 Chr|代上|代上|29
2CH|2 Chronicles|历代志下|歷代志下|2 Chr|代下|代下|36
EZR|Ezra|以斯拉记|以斯拉記|Ezr|拉|拉|10
NEH|Nehemiah|尼希米记|尼希米記|Neh|尼|尼|13
EST|Esther|以斯帖记|以斯帖記|Est|斯|斯|10
JOB|Job|约伯记|約伯記|Jb|伯|伯|42
PSA|Psalm|诗篇|詩篇|Ps|诗|詩|150
PRO|Proverbs|箴言|箴言|Prv|箴|箴|31
ECC|Ecclesiastes|传道书|傳道書|Eccl|传|傳|12
SNG|Song of Solomon|雅歌|雅歌|Sg|歌|歌|8
ISA|Isaiah|以赛亚书|以賽亞書|Is|赛|賽|66
JER|Jeremiah|耶利米书|耶利米書|Jer|耶|耶|52
LAM|Lamentations|耶利米哀歌|耶利米哀歌|Lam|哀|哀|5
EZK|Ezekiel|以西结书|以西結書|Ez|结|結|48
DAN|Daniel|但以理书|但以理書|Dn|但|但|12
HOS|Hosea|何西阿书|何西阿書|Hos|何|何|14
JOL|Joel|约珥书|約珥書|Jl|珥|珥|3
AMO|Amos|阿摩司书|阿摩司書|Am|摩|摩|9
OBA|Obadiah|俄巴底亚书|俄巴底亞書|Ob|俄|俄|1
JON|Jonah|约拿书|約拿書|Jon|拿|拿|4
MIC|Micah|弥迦书|彌迦書|Mi|弥|彌|7
NAM|Nahum|那鸿书|那鴻書|Na|鸿|鴻|3
HAB|Habakkuk|哈巴谷书|哈巴谷書|Hb|哈|哈|3
ZEP|Zephaniah|西番雅书|西番雅書|Zep|番|番|3
HAG|Haggai|哈该书|哈該書|Hg|该|該|2
ZEC|Zechariah|撒迦利亚书|撒迦利亞書|Zec|亚|亞|14
MAL|Malachi|玛拉基书|瑪拉基書|Mal|玛|瑪|4
MAT|Matthew|马太福音|馬太福音|Mt|太|太|28
MRK|Mark|马可福音|馬可福音|Mk|可|可|16
LUK|Luke|路加福音|路加福音|Lk|路|路|24
JHN|John|约翰福音|約翰福音|Jn|约|約|21
ACT|Acts|使徒行传|使徒行傳|Acts|徒|徒|28
ROM|Romans|罗马书|羅馬書|Rom|罗|羅|16
1CO|1 Corinthians|哥林多前书|哥林多前書|1 Cor|林前|林前|16
2CO|2 Corinthians|哥林多后书|哥林多後書|2 Cor|林后|林後|13
GAL|Galatians|加拉太书|加拉太書|Gal|加|加|6
EPH|Ephesians|以弗所书|以弗所書|Eph|弗|弗|6
PHP|Philippians|腓立比书|腓立比書|Phil|腓|腓|4
COL|Colossians|歌罗西书|歌羅西書|Col|西|西|4
1TH|1 Thessalonians|帖撒罗尼迦前书|帖撒羅尼迦前書|1 Th|帖前|帖前|5
2TH|2 Thessalonians|帖撒罗尼迦后书|帖撒羅尼迦後書|2 Th|帖后|帖後|3
1TI|1 Timothy|提摩太前书|提摩太前書|1 Tm|提前|提前|6
2TI|2 Timothy|提摩太后书|提摩太後書|2 Tm|提后|提後|4
TIT|Titus|提多书|提多書|Ti|多|多|3
PHM|Philemon|腓利门书|腓利門書|Phlm|门|門|1
HEB|Hebrews|希伯来书|希伯來書|Heb|来|來|13
JAS|James|雅各书|雅各書|Jas|雅|雅|5
1PE|1 Peter|彼得前书|彼得前書|1 Pt|彼前|彼前|5
2PE|2 Peter|彼得后书|彼得後書|2 Pt|彼后|彼後|3
1JN|1 John|约翰一书|約翰一書|1 Jn|约一|約一|5
2JN|2 John|约翰二书|約翰二書|2 Jn|约二|約二|1
3JN|3 John|约翰三书|約翰三書|3 Jn|约三|約三|1
JUD|Jude|犹大书|猶大書|Jude|犹|猶|1
REV|Revelation|启示录|啟示錄|Rv|启|啟|22
`;

export const BOOKS: Record<BookCode, Book> = Object.fromEntries(
  ROWS.trim()
    .split('\n')
    .map((row) => {
      const [code, en, zhHans, zhHant, enShort, zhHansShort, zhHantShort, chapters] = row.split('|');
      return [code, { en, zhHans, zhHant, enShort, zhHansShort, zhHantShort, chapters: Number(chapters) }];
    }),
);

export function getBook(code: BookCode): Book {
  const book = BOOKS[code];
  if (!book) throw new Error(`Unknown book code: ${code}`);
  return book;
}
