#!/usr/bin/env python3

import re
from datetime import datetime, timedelta

import pdfplumber


def extract_readings_from_pdf(pdf_path):
    all_raw_data = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue

            for row in table:
                # Clean row and ensure it has enough columns
                row = list(filter(None, [c.strip() if c else "" for c in row]))
                if len(row) < 3:
                    continue

                # Column Set 1 (Left)
                if row[0]:  # Date column
                    all_raw_data.append(
                        {
                            "raw_date": row[0],
                            "main": row[1],
                            "supp": row[2],
                        }
                    )

                # Column Set 2 (Right)
                if len(row) >= 6 and row[3]:
                    all_raw_data.append(
                        {
                            "raw_date": row[3],
                            "main": row[4],
                            "supp": row[5],
                        }
                    )

    # Logic to assign Year 1 or Year 2 based on vertical flow
    # The document flows: Page 1-4 (Year 1), Page 5-9 (Year 2)
    structured_readings = []
    dates_seen = set()
    for item in all_raw_data:
        # Parse the month and day (e.g., "Jan 1" or "Jan5")
        date_match = re.search(r"([A-Za-z]+)\s*(\d+)", item["raw_date"])
        if date_match:
            month_str, day_val = date_match.groups()
            try:
                # Create a sorting key using a reference year
                month_day_tuple = (month_str, day_val)
                date_str = f"{2000 + (1 if month_day_tuple in dates_seen else 0)} {month_str[:3]} {day_val}"
                sort_date = datetime.strptime(date_str, "%Y %b %d")
                dates_seen.add(month_day_tuple)
                structured_readings.append(
                    {
                        "sort_key": sort_date,
                        "main": item["main"].replace("\n", " "),
                        "supp": item["supp"].replace("\n", " "),
                    }
                )
            except ValueError as e:
                print(f"Error parsing date '{item['raw_date']}': {e}")
                continue

    # Sort by the artificial sort_key to ensure Year 1 comes before Year 2
    structured_readings.sort(key=lambda x: x["sort_key"])
    return structured_readings


def create_ics_file(readings, start_date, output_file):
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Gemini//Bible Reading Plan//EN",
        "METHOD:PUBLISH",
    ]

    current_date = start_date
    for item in readings:
        start_str = current_date.strftime("%Y%m%d")
        end_str = (current_date + timedelta(days=1)).strftime("%Y%m%d")

        ics_lines.extend(
            [
                "BEGIN:VEVENT",
                f"SUMMARY:Bible: {item['main']} | {item['supp']}",
                f"DTSTART;VALUE=DATE:{start_str}",
                f"DTEND;VALUE=DATE:{end_str}",
                f"DESCRIPTION:Main: {item['main']}\\nSupplemental: {item['supp']}",
                "END:VEVENT",
            ]
        )
        current_date += timedelta(days=1)

    ics_lines.append("END:VCALENDAR")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(ics_lines))
    print(f"ICS file '{output_file}' created successfully.")


if __name__ == "__main__":
    pdf_file = "TGC-Two-Year-Bible-Reading-Plan1.pdf"
    actual_start = datetime(2026, 2, 2)
    readings_list = extract_readings_from_pdf(pdf_file)
    create_ics_file(readings_list, actual_start, "BiblePlan_Sorted.ics")
