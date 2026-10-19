#!/usr/bin/env python3
"""Extract the TGC Two-Year Bible Reading Plan PDF into src/data/plan.json.

Usage: .venv/bin/python scripts/extract_plan.py [pdf] [out]
"""

import json
import re
import sys
from datetime import datetime

PLAN_LENGTH = 730

# Every book token seen in the PDF, mapped to its USFM code.
ALIASES = {
    "Gn": "GEN", "Exod": "EXO", "Lev": "LEV", "Num": "NUM", "Deut": "DEU", "Dt": "DEU",
    "Josh": "JOS", "Judges": "JDG", "Ruth": "RUT",
    "1 Sam": "1SA", "1 Sa": "1SA", "2 Sam": "2SA",
    "1 Kgs": "1KI", "1 K": "1KI", "2 Kgs": "2KI", "2 Kg": "2KI",
    "1 Chr": "1CH", "2 Chr": "2CH", "Ezra": "EZR", "Neh": "NEH", "Esth": "EST", "Job": "JOB",
    "Ps": "PSA", "Prv": "PRO", "Prov": "PRO", "Pr": "PRO", "P": "PRO",
    "Eccl": "ECC", "Song": "SNG", "Isa": "ISA", "Jer": "JER", "Lam": "LAM", "Ez": "EZK",
    "Dan": "DAN", "Hos": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
    "Mic": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zeph": "ZEP", "Haggai": "HAG",
    "Zech": "ZEC", "Mal": "MAL",
    "Matt": "MAT", "Mark": "MRK", "Mk": "MRK", "Luke": "LUK", "Lk": "LUK", "John": "JHN",
    "Acts": "ACT", "Rom": "ROM", "1 Cor": "1CO", "2 Cor": "2CO", "Gal": "GAL", "Eph": "EPH",
    "Phil": "PHP", "Col": "COL", "1 Thess": "1TH", "2 Thess": "2TH", "1 Tim": "1TI",
    "2 Tim": "2TI", "Titus": "TIT", "Philemon": "PHM", "Heb": "HEB", "James": "JAS",
    "1 Pet": "1PE", "2 Pet": "2PE", "1 Jn": "1JN", "2 John": "2JN", "3 John": "3JN",
    "Jude": "JUD", "Rev": "REV",
}

CATCH_UP = "Catch-up day"
BOOK_RE = re.compile(r"^((?:[123] )?[A-Za-z]+)\s*(.*)$")
POINT = r"(\d+)(?:\.(\d+)([abc])?)?"
REF_RE = re.compile(rf"^{POINT}(?:\s*-\s*{POINT})?$")


def _point(chapter, verse, part):
    ref = [int(chapter)]
    if verse is not None:
        ref.append(int(verse))
        if part:
            ref.append(part)
    return ref


def parse_reference(raw):
    """Parse one raw reference like 'Gn 1.1-2.3' into a list of passages."""
    raw = " ".join(raw.split())
    if raw == CATCH_UP:
        return []
    m = BOOK_RE.match(raw)
    if not m or m.group(1) not in ALIASES:
        raise ValueError(f"Unknown book in reference: {raw!r}")
    book, rest = ALIASES[m.group(1)], m.group(2)
    if not rest:
        return [{"book": book, "start": [1], "wholeBook": True}]
    r = REF_RE.match(rest)
    if not r:
        raise ValueError(f"Unparseable reference: {raw!r}")
    c1, v1, p1, c2, v2, p2 = r.groups()
    passage = {"book": book, "start": _point(c1, v1, p1)}
    if c2 is not None:
        if v2 is None and v1 is not None:
            # 'Prv 15.1-29': a bare end number after a verse is a verse in the same chapter.
            passage["end"] = [int(c1), int(c2)]
        else:
            passage["end"] = _point(c2, v2, p2)
    return [passage]


def extract_raw(pdf_path):
    """Return 730 (main, supp) raw strings in plan order."""
    import pdfplumber

    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue
            for row in table:
                row = list(filter(None, [c.strip() if c else "" for c in row]))
                if len(row) < 3:
                    continue
                if row[0]:
                    rows.append((row[0], row[1], row[2]))
                if len(row) >= 6 and row[3]:
                    rows.append((row[3], row[4], row[5]))

    # The PDF lists each calendar date twice (Year 1, then Year 2); the second
    # occurrence of a month/day belongs to Year 2.
    ordered = []
    seen = set()
    for raw_date, main, supp in rows:
        m = re.search(r"([A-Za-z]+)\s*(\d+)", raw_date)
        if not m:
            continue
        key = m.groups()
        year = 2001 if key in seen else 2000
        seen.add(key)
        sort_key = datetime.strptime(f"{year} {key[0][:3]} {key[1]}", "%Y %b %d")
        ordered.append((sort_key, main.replace("\n", " "), supp.replace("\n", " ")))
    ordered.sort(key=lambda x: x[0])
    return [(main, supp) for _, main, supp in ordered]


def build_plan(raw_days):
    plan = []
    for i, (main, supp) in enumerate(raw_days, start=1):
        day = {"day": i, "main": parse_reference(main), "supp": parse_reference(supp)}
        if " ".join(main.split()) == CATCH_UP:
            day["catchUp"] = True
        plan.append(day)
    return plan


def validate(plan):
    errors = []
    if len(plan) != PLAN_LENGTH:
        errors.append(f"expected {PLAN_LENGTH} days, got {len(plan)}")
    for d in plan:
        if not d["supp"]:
            errors.append(f"day {d['day']}: missing supplemental reading")
        if not d["main"] and not d.get("catchUp"):
            errors.append(f"day {d['day']}: missing main reading")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        raise SystemExit(1)


def main(argv):
    pdf_path = argv[1] if len(argv) > 1 else "TGC-Two-Year-Bible-Reading-Plan1.pdf"
    out_path = argv[2] if len(argv) > 2 else "src/data/plan.json"
    try:
        plan = build_plan(extract_raw(pdf_path))
    except ValueError as e:
        print(e, file=sys.stderr)
        raise SystemExit(1)
    validate(plan)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("[\n")
        f.write(",\n".join(json.dumps(d, ensure_ascii=False) for d in plan))
        f.write("\n]\n")
    print(f"Wrote {len(plan)} days to {out_path}")


if __name__ == "__main__":
    main(sys.argv)
