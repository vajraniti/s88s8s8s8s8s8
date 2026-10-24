from __future__ import annotations

import json
import sys
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any, cast

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from build_data import (
    FetchError,
    Release,
    book_call,
    build,
    expected_period,
    format_like,
    gold_direction,
    gold_move,
    parse_calendar,
    parse_figure,
    parse_fred_csv,
    verdict,
    week_monday,
)
from catalog import Fred, book_line, book_line_below, rule_for, why_below


def feed(*rows: dict[str, str]) -> bytes:
    return json.dumps(list(rows)).encode()


def row(
    title: str, when: str, impact: str = "High", country: str = "USD", forecast: str = "", previous: str = ""
) -> dict[str, str]:
    return {
        "title": title,
        "country": country,
        "date": when,
        "impact": impact,
        "forecast": forecast,
        "previous": previous,
    }


class TestFigures:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("0.3%", (0.3, 1, "%")),
            ("7.20M", (7.2, 2, "M")),
            ("200K", (200.0, 0, "K")),
            ("-78.3B", (-78.3, 1, "B")),
            ("52.0", (52.0, 1, "")),
            ("1,234K", (1234.0, 0, "K")),
        ],
    )
    def test_parse(self, text: str, expected: tuple[float, int, str]) -> None:
        assert parse_figure(text) == expected

    @pytest.mark.parametrize("text", [None, "", "n/a", "4.3%%", "abc"])
    def test_parse_rejects(self, text: str | None) -> None:
        assert parse_figure(text) is None

    def test_format_follows_the_forecast(self) -> None:
        assert format_like(0.64855, (0.3, 1, "%")) == "0.6%"
        assert format_like(7.079, (7.2, 2, "M")) == "7.08M"
        assert format_like(-0.04, (0.1, 1, "%")) == "0.0%"


class TestPeriods:
    def test_monthly_lag(self) -> None:
        cpi = Fred("CPIAUCSL", "pch", "m", 1)
        assert expected_period(cpi, date(2026, 1, 14)) == date(2025, 12, 1)
        jolts = Fred("JTSJOL", "lin", "m", 2)
        assert expected_period(jolts, date(2026, 10, 7)) == date(2026, 8, 1)

    def test_weekly_claims_report_the_saturday_before(self) -> None:
        claims = Fred("ICSA", "lin", "w")
        assert expected_period(claims, date(2026, 10, 22)) == date(2026, 10, 17)  # thursday -> saturday

    def test_quarterly_is_the_last_finished_quarter(self) -> None:
        gdp = Fred("A191RL1Q225SBEA", "lin", "q")
        assert expected_period(gdp, date(2026, 10, 29)) == date(2026, 7, 1)
        assert expected_period(gdp, date(2026, 1, 29)) == date(2025, 10, 1)

    def test_daily_has_no_fixed_period(self) -> None:
        assert expected_period(Fred("DFEDTARU", "lin", "d"), date(2026, 10, 28)) is None


class TestFredCsv:
    def test_missing_values_are_skipped(self) -> None:
        raw = b"observation_date,PAYEMS_CHG\n2026-08-01,133\n2026-09-01,.\n2026-10-01,29\n"
        assert parse_fred_csv(raw) == [(date(2026, 8, 1), 133.0), (date(2026, 10, 1), 29.0)]

    def test_garbage_raises(self) -> None:
        with pytest.raises(FetchError):
            parse_fred_csv(b"<html>")


class TestBook:
    def test_rules_from_the_catalog(self) -> None:
        assert book_line(rule_for("Non-Farm Employment Change")) == "above forecast -> strong jobs -> gold down"
        assert book_line(rule_for("Unemployment Rate")) == "above forecast -> weak jobs -> gold up"
        assert rule_for("Fed Chair Warsh Speaks").kind == "voice"
        assert rule_for("FOMC Member Smith Speaks").code == "FMSS"
        assert rule_for("Core CPI m/m").code == "CCPI"

    def test_read_from_below(self) -> None:
        assert book_line_below(rule_for("ADP Non-Farm Employment Change")) == "below forecast -> weak jobs -> gold up"
        assert book_line_below(rule_for("Unemployment Claims")) == "below forecast -> strong jobs -> gold down"
        assert book_line_below(rule_for("ISM Services PMI")) == "below forecast -> usd down -> gold up"
        assert book_line_below(rule_for("Fed Chair Warsh Speaks")) is None
        assert why_below("hot inflation") == "cool inflation"
        assert why_below("smaller deficit") == "bigger deficit"
        assert why_below("wage inflation") == "soft wages"

    def test_unknown_numbers_get_the_usd_default(self) -> None:
        rule = rule_for("Some New Index")
        assert (rule.kind, rule.above, rule.fred) == ("data", "down", None)

    def test_call(self) -> None:
        nfp, claims = rule_for("Non-Farm Employment Change"), rule_for("Unemployment Claims")
        assert book_call(nfp, "180K", "140K") == "down"
        assert book_call(nfp, "100K", "140K") == "up"
        assert book_call(nfp, "140K", "140K") is None
        assert book_call(claims, "230K", "200K") == "up"
        assert book_call(nfp, "180K", "0.3%") is None  # units differ: no call

    def test_verdict(self) -> None:
        assert gold_direction(11.2) == "up"
        assert gold_direction(-1.9) == "flat"
        assert verdict("down", "down") == "right"
        assert verdict("down", "up") == "lied"
        assert verdict("down", "flat") == "shrug"
        assert verdict(None, "up") is None


class TestCalendar:
    def test_keeps_usd_high_and_medium_only(self) -> None:
        releases, every = parse_calendar(
            feed(
                row("CPI m/m", "2026-10-15T08:30:00-04:00", forecast="0.3%"),
                row("Crude Oil Inventories", "2026-10-15T10:30:00-04:00", "Medium"),
                row("GDP q/y", "2026-10-15T22:00:00-04:00", country="CNY"),
                row("Bank Holiday", "2026-10-12T00:00:00-04:00", "Holiday"),
                row("Retail Sales m/m", "2026-10-16T08:30:00-04:00", "Low"),
            )
        )
        assert [r.title for r in releases] == ["CPI m/m"]
        assert releases[0].when == datetime(2026, 10, 15, 12, 30, tzinfo=UTC)
        assert len(every) == 5

    def test_rate_limit_page_is_an_error(self) -> None:
        with pytest.raises(FetchError):
            parse_calendar(b"<html>Request Denied</html>")

    def test_week_is_placed_in_utc_plus_3(self) -> None:
        # sunday 18:00 in new york is already monday in utc+3
        _, every = parse_calendar(feed(row("X", "2026-10-18T18:00:00-04:00"), row("Y", "2026-10-21T10:00:00-04:00")))
        assert week_monday(every) == date(2026, 10, 19)


BARS = [(1_792_000_000 + i * 300, 4000.0 + i) for i in range(30)]


class TestGold:
    def release_at(self, stamp: int) -> Release:
        return Release("X", datetime.fromtimestamp(stamp, UTC), "high", None, None)

    def test_hour_after(self) -> None:
        r = self.release_at(1_792_000_000)
        move = gold_move(BARS, r, datetime.fromtimestamp(1_792_000_000 + 7200, UTC))
        assert move is not None and move.move == 12.0 and move.final

    def test_so_far(self) -> None:
        r = self.release_at(1_792_000_000)
        move = gold_move(BARS, r, datetime.fromtimestamp(1_792_000_000 + 900, UTC))
        assert move is not None and move.move == 3.0 and not move.final

    def test_closed_market_gives_nothing(self) -> None:
        r = self.release_at(1_792_000_000 + 86_400)
        assert gold_move(BARS, r, datetime.fromtimestamp(1_792_000_000 + 90_000, UTC)) is None


class _FakeFred:
    """Stands in for FRED: claims for the week ending saturday 17 oct."""

    def actual(self, fred: Fred, release: Release) -> str | None:
        return "194K" if fred.series == "ICSA" else None


def test_build_end_to_end() -> None:
    calendar = feed(
        row("Unemployment Claims", "2026-10-22T08:30:00-04:00", "Medium", forecast="200K", previous="199K"),
        row("Non-Farm Employment Change", "2026-10-23T08:30:00-04:00", forecast="140K", previous="152K"),
    )
    start = int(datetime(2026, 10, 22, 12, 0, tzinfo=UTC).timestamp())
    gold = {
        "chart": {
            "result": [
                {
                    "timestamp": [start + i * 300 for i in range(40)],
                    "indicators": {"quote": [{"close": [4000.0 + 0.5 * i for i in range(40)]}]},
                }
            ]
        }
    }
    now = datetime(2026, 10, 22, 14, 30, tzinfo=UTC)
    data = build(calendar, json.dumps(gold).encode(), _FakeFred(), now)
    claims, nfp = cast(list[dict[str, Any]], data["events"])
    assert claims["id"] == "XAU-UNCL-2610"
    assert claims["actual"] == "194K"
    assert claims["book_said"] == "down"  # fewer claims than forecast: jobs hold, gold down
    assert claims["gold"]["move"] == 6.0 and claims["gold"]["final"]
    assert claims["gold_did"] == "up" and claims["verdict"] == "lied"
    assert nfp["actual"] is None and nfp["gold"] is None
    assert cast(dict[str, Any], data["week"])["iso_week"] == 43


class _DownFred:
    def actual(self, fred: Fred, release: Release) -> str | None:
        raise FetchError("fred is down")


def test_a_source_that_is_down_keeps_last_time() -> None:
    calendar = feed(row("Unemployment Claims", "2026-10-22T08:30:00-04:00", "Medium", forecast="200K", previous="199K"))
    now = datetime(2026, 10, 22, 14, 30, tzinfo=UTC)
    previous = {
        "week": {"start": "2026-10-19T00:00:00+03:00"},
        "events": [{"id": "XAU-UNCL-2610", "actual": "194K", "gold": {"from": 4000.0, "move": -6.0, "final": True}}],
        "gold": {"points": [[1, 4000.0], [2, 3994.0]]},
    }
    data = build(calendar, None, _DownFred(), now, previous)
    (claims,) = cast(list[dict[str, Any]], data["events"])
    assert claims["actual"] == "194K"
    assert claims["gold"]["move"] == -6.0
    assert claims["verdict"] == "right"  # fewer claims: book says down, gold went down
    assert cast(dict[str, Any], data["gold"])["points"] == [[1, 4000.0], [2, 3994.0]]


def test_last_time_is_not_carried_into_a_new_week() -> None:
    calendar = feed(row("Unemployment Claims", "2026-10-29T08:30:00-04:00", "Medium", forecast="200K"))
    previous = {"week": {"start": "2026-10-19T00:00:00+03:00"}, "events": [{"id": "XAU-UNCL-2610", "actual": "194K"}]}
    data = build(calendar, None, _DownFred(), datetime(2026, 10, 29, 14, 30, tzinfo=UTC), previous)
    (claims,) = cast(list[dict[str, Any]], data["events"])
    assert claims["actual"] is None and claims["gold"] is None
