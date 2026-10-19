import pytest

from extract_plan import parse_reference, validate


def test_cross_chapter_range():
    assert parse_reference("Gn 1.1-2.3") == [{"book": "GEN", "start": [1, 1], "end": [2, 3]}]


def test_single_chapter():
    assert parse_reference("Ps 1") == [{"book": "PSA", "start": [1]}]


def test_chapter_range():
    assert parse_reference("2 Sam 13-14") == [{"book": "2SA", "start": [13], "end": [14]}]


def test_bare_end_after_verse_is_same_chapter_verse():
    assert parse_reference("Prv 15.1- 29") == [{"book": "PRO", "start": [15, 1], "end": [15, 29]}]


def test_chapter_to_verse():
    assert parse_reference("Prv 21- 22.16") == [{"book": "PRO", "start": [21], "end": [22, 16]}]


def test_partial_verses():
    assert parse_reference("1 Sam 2.12-4.1a") == [{"book": "1SA", "start": [2, 12], "end": [4, 1, "a"]}]
    assert parse_reference("Mark 6.6b-8.21") == [{"book": "MRK", "start": [6, 6, "b"], "end": [8, 21]}]


def test_whole_book():
    assert parse_reference("Obadiah") == [{"book": "OBA", "start": [1], "wholeBook": True}]


def test_odd_aliases():
    assert parse_reference("P 5.1-6.19")[0]["book"] == "PRO"
    assert parse_reference("Ez 4-5")[0]["book"] == "EZK"
    assert parse_reference("1 K 16.21-17.24")[0]["book"] == "1KI"


def test_catch_up():
    assert parse_reference("Catch-up day") == []


def test_rejects_unknown_book_and_bad_syntax():
    with pytest.raises(ValueError):
        parse_reference("Foo 1")
    with pytest.raises(ValueError):
        parse_reference("Gn 1.x")


def test_validate_rejects_bad_plan():
    with pytest.raises(SystemExit):
        validate([{"day": 1, "main": [], "supp": []}])
