"""Build the week's data for hiranya: the usd releases that move gold, and what gold did.

Sources, all free and keyless:
  - schedule, impact, forecast, previous: the Forex Factory weekly calendar feed
  - actual numbers: FRED (St. Louis Fed) public CSV downloads
  - gold: COMEX gold futures (GC=F), 5-minute bars from Yahoo Finance's chart endpoint

Usage: python scripts/build_data.py --out docs/data.json
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import logging
import math
import os
import re
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from catalog import Fred, Rule, book_line, book_line_below, ignored, opposite, rule_for

log = logging.getLogger("hiranya")

FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv"
GOLD_URL = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F"
GOLD_SOURCE = "comex gold futures (GC=F), 5-minute bars, yahoo finance"
USER_AGENT = "Mozilla/5.0 (compatible; hiranya/1.0; +https://github.com/vajraniti/s88s8s8s8s8s8)"
HTTP_TIMEOUT = 30

SITE_TZ = timezone(timedelta(hours=3))  # the page shows utc+3
US_EASTERN = ZoneInfo("America/New_York")  # release dates belong to the us calendar
IMPACTS = {"High": "high", "Medium": "medium"}
# what gold did in the hour after a release; inside this many $/oz it shrugged
GOLD_WINDOW = timedelta(minutes=60)
GOLD_FLAT_USD = 2.0
# a bar older than this before a release means the market was shut, not quiet
GOLD_MAX_STALE = timedelta(minutes=20)
GOLD_PATH_STEP = 15 * 60  # seconds between points of the week's line


class FetchError(RuntimeError):
    pass


def fetch(url: str, params: dict[str, str] | None = None) -> bytes:
    full = f"{url}?{urlencode(params)}" if params else url
    request = Request(full, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    try:
        with urlopen(request, timeout=HTTP_TIMEOUT) as response:
            body: bytes = response.read()
            return body
    except (HTTPError, URLError, TimeoutError) as err:
        raise FetchError(f"GET {full} failed: {err}") from err


# ---------------------------------------------------------------- the calendar


@dataclass(frozen=True)
class Release:
    title: str
    when: datetime  # aware, utc
    impact: str
    forecast: str | None
    previous: str | None


def parse_calendar(raw: bytes) -> tuple[list[Release], list[datetime]]:
    """The feed's usd high/medium releases, and the times of every entry (to place the week)."""
    try:
        rows = json.loads(raw)
    except json.JSONDecodeError as err:
        # when the feed rate-limits it answers with an html page instead of json
        raise FetchError(f"calendar feed is not json (rate-limited?): {raw[:120]!r}") from err
    if not isinstance(rows, list):
        raise FetchError(f"calendar feed: expected a list, got {type(rows).__name__}")
    releases: list[Release] = []
    every: list[datetime] = []
    for row in rows:
        try:
            when = datetime.fromisoformat(row["date"]).astimezone(UTC)
        except (KeyError, TypeError, ValueError) as err:
            raise FetchError(f"calendar feed: bad date in {row!r}") from err
        every.append(when)
        if row.get("country") != "USD" or row.get("impact") not in IMPACTS:
            continue
        title = str(row.get("title", "")).strip()
        if not title or ignored(title):
            continue
        releases.append(
            Release(title, when, IMPACTS[row["impact"]], row.get("forecast") or None, row.get("previous") or None)
        )
    releases.sort(key=lambda r: r.when)  # stable: releases at the same minute keep the calendar's order
    return releases, every


def week_monday(times: list[datetime]) -> date:
    """Monday (in utc+3) of the week most of the feed's entries fall in."""
    if not times:
        raise FetchError("calendar feed is empty")
    mondays = Counter((t.astimezone(SITE_TZ).date() - timedelta(days=t.astimezone(SITE_TZ).weekday())) for t in times)
    return mondays.most_common(1)[0][0]


# ---------------------------------------------------------------- numbers


_FIGURE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*(%|K|M|B|T)?\s*$")


def parse_figure(text: str | None) -> tuple[float, int, str] | None:
    """'0.3%' -> (0.3, 1, '%'), '7.20M' -> (7.2, 2, 'M'), '200K' -> (200.0, 0, 'K'); else None."""
    if not text:
        return None
    m = _FIGURE.match(text.replace(",", ""))
    if not m:
        return None
    number = m.group(1)
    decimals = len(number.split(".")[1]) if "." in number else 0
    return float(number), decimals, m.group(2) or ""


def format_like(value: float, shape: tuple[float, int, str]) -> str:
    """Write a value the way the calendar writes its forecast: same decimals, same unit."""
    _, decimals, unit = shape
    text = f"{value:.{decimals}f}"
    if text.startswith("-") and float(text) == 0:
        text = text[1:]
    return text + unit


# ---------------------------------------------------------------- fred


def parse_fred_csv(raw: bytes) -> list[tuple[date, float]]:
    """fredgraph.csv: a header, then date,value rows; '.' marks a missing value."""
    rows = list(csv.reader(io.StringIO(raw.decode("utf-8"))))
    if not rows or len(rows[0]) < 2:
        raise FetchError(f"fred csv: unexpected header {rows[:1]!r}")
    out: list[tuple[date, float]] = []
    for row in rows[1:]:
        if len(row) < 2 or row[1] in ("", "."):
            continue
        try:
            out.append((date.fromisoformat(row[0]), float(row[1])))
        except ValueError as err:
            raise FetchError(f"fred csv: bad row {row!r}") from err
    return out


def expected_period(fred: Fred, released: date) -> date | None:
    """The observation date a release on `released` reports; None for daily series."""
    if fred.freq == "m":
        month = released.year * 12 + released.month - 1 - fred.lag
        return date(month // 12, month % 12 + 1, 1)
    if fred.freq == "w":
        # weekly claims: the week ending on the saturday before the release
        back = (released.weekday() - 5) % 7 or 7
        return released - timedelta(days=back)
    if fred.freq == "q":
        # the last quarter that ended before the release
        q_start_month = ((released.month - 1) // 3) * 3 + 1
        this_q = date(released.year, q_start_month, 1)
        prev_q_month = this_q.year * 12 + this_q.month - 1 - 3
        return date(prev_q_month // 12, prev_q_month % 12 + 1, 1)
    return None


class ActualSource(Protocol):
    def actual(self, fred: Fred, release: Release) -> str | None: ...


class Fredder:
    """Reads FRED series once per run."""

    def __init__(self) -> None:
        self._cache: dict[tuple[str, str], list[tuple[date, float]]] = {}

    def series(self, fred: Fred, since: date) -> list[tuple[date, float]]:
        key = (fred.series, fred.transform)
        if key not in self._cache:
            params = {"id": fred.series, "cosd": since.isoformat()}
            if fred.transform != "lin":
                params["transformation"] = fred.transform
            self._cache[key] = parse_fred_csv(fetch(FRED_CSV_URL, params))
        return self._cache[key]

    def actual(self, fred: Fred, release: Release) -> str | None:
        """The release's number from FRED, written like the calendar writes it; None until FRED has it."""
        shape = parse_figure(release.forecast) or parse_figure(release.previous)
        if shape is None:
            return None
        released = release.when.astimezone(US_EASTERN).date()
        observations = self.series(fred, released - timedelta(days=500))
        if not observations:
            return None
        period = expected_period(fred, released)
        if period is None:
            # daily (the fed's target): the first value dated after the decision
            later = [v for d, v in observations if d > released]
            if not later:
                return None
            value = later[0]
        else:
            matches = [v for d, v in observations if d == period]
            if not matches:
                return None
            value = matches[0]
        text = format_like(value / fred.factor, shape)
        if fred.revision and text == release.previous:
            # FRED still shows the earlier estimate of this quarter
            return None
        return text


# ---------------------------------------------------------------- gold


def parse_gold(raw: bytes) -> list[tuple[int, float]]:
    """Yahoo chart json -> [(epoch seconds, close)], gaps dropped."""
    try:
        result = json.loads(raw)["chart"]["result"][0]
        stamps = result["timestamp"]
        closes = result["indicators"]["quote"][0]["close"]
    except (json.JSONDecodeError, KeyError, IndexError, TypeError) as err:
        raise FetchError(f"gold chart: unexpected answer {raw[:160]!r}") from err
    return [(int(t), float(c)) for t, c in zip(stamps, closes, strict=False) if c is not None and math.isfinite(c)]


def price_at(bars: list[tuple[int, float]], when: datetime) -> float | None:
    """The last close at or before `when`, if the market was trading then."""
    t = when.timestamp()
    before = [(s, c) for s, c in bars if s <= t]
    if not before:
        return None
    stamp, close = before[-1]
    if t - stamp > GOLD_MAX_STALE.total_seconds():
        return None
    return close


@dataclass(frozen=True)
class GoldMove:
    start: float
    move: float
    # the full hour after the release has passed; before that the move is "so far"
    final: bool

    def as_json(self) -> dict[str, object]:
        return {"from": round(self.start, 2), "move": self.move, "final": self.final}


def gold_move(bars: list[tuple[int, float]], release: Release, now: datetime) -> GoldMove | None:
    if now < release.when:
        return None
    start = price_at(bars, release.when)
    end = price_at(bars, min(now, release.when + GOLD_WINDOW))
    if start is None or end is None:
        return None
    return GoldMove(start, round(end - start, 2), now >= release.when + GOLD_WINDOW)


def gold_path(bars: list[tuple[int, float]], start: datetime, end: datetime) -> list[list[float]]:
    """The week's gold, one point per 15 minutes: [epoch seconds, price]."""
    lo, hi = start.timestamp(), end.timestamp()
    buckets: dict[int, tuple[int, float]] = {}
    for stamp, close in bars:
        if lo <= stamp <= hi:
            buckets[stamp // GOLD_PATH_STEP] = (stamp, close)
    return [[stamp, round(close, 1)] for stamp, close in (buckets[k] for k in sorted(buckets))]


# ---------------------------------------------------------------- the book


def gold_direction(move: float) -> str:
    if move >= GOLD_FLAT_USD:
        return "up"
    if move <= -GOLD_FLAT_USD:
        return "down"
    return "flat"


def book_call(rule: Rule, actual: str | None, forecast: str | None) -> str | None:
    """What the book says gold should do, given the number: 'up', 'down' or None (in line, or no number)."""
    if rule.kind != "data":
        return None
    a, f = parse_figure(actual), parse_figure(forecast)
    if a is None or f is None or a[2] != f[2]:
        return None
    if a[0] > f[0]:
        return rule.above
    if a[0] < f[0]:
        return opposite(rule.above)
    return None


def verdict(book: str | None, did: str | None) -> str | None:
    if book is None or did is None:
        return None
    if did == "flat":
        return "shrug"
    return "right" if did == book else "lied"


# ---------------------------------------------------------------- the week


def event_id(rule: Rule, release: Release, taken: set[str]) -> str:
    local = release.when.astimezone(SITE_TZ)
    base = f"XAU-{rule.code}-{local:%y%m}"
    candidate, n = base, 2
    while candidate in taken:
        candidate, n = f"{base}-{n}", n + 1
    taken.add(candidate)
    return candidate


def build(
    calendar_raw: bytes,
    gold_raw: bytes | None,
    fredder: ActualSource | None,
    now: datetime,
    previous: dict[str, Any] | None = None,
) -> dict[str, object]:
    """The week as data.json. `previous` is the last published week: when a source is down, what it
    said last time is kept rather than wiped."""
    releases, every = parse_calendar(calendar_raw)
    monday = week_monday(every)
    week_start = datetime(monday.year, monday.month, monday.day, tzinfo=SITE_TZ)
    week_end = week_start + timedelta(days=5)

    last_week: dict[str, Any] = previous if previous is not None else {}
    same_week = last_week.get("week", {}).get("start") == week_start.isoformat()
    before: dict[str, dict[str, Any]] = {e["id"]: e for e in last_week.get("events", [])} if same_week else {}

    bars: list[tuple[int, float]] = []
    if gold_raw is not None:
        try:
            bars = parse_gold(gold_raw)
        except FetchError as err:
            log.warning("gold left out: %s", err)

    taken: set[str] = set()
    events: list[dict[str, object]] = []
    for release in releases:
        rule = rule_for(release.title)
        eid = event_id(rule, release, taken)
        last = before.get(eid, {})
        actual: str | None = None
        if rule.fred is not None and fredder is not None and release.when <= now:
            try:
                actual = fredder.actual(rule.fred, release)
            except FetchError as err:
                actual = last.get("actual")
                log.warning("fred unreachable for %s, keeping %r: %s", release.title, actual, err)
        gold = gold_move(bars, release, now)
        if not bars and isinstance(last.get("gold"), dict):
            g = last["gold"]
            gold = GoldMove(float(g["from"]), float(g["move"]), bool(g["final"]))
        book = book_call(rule, actual, release.forecast)
        did = gold_direction(gold.move) if gold is not None and gold.final else None
        events.append(
            {
                "id": eid,
                "title": release.title,
                "time": release.when.isoformat().replace("+00:00", "Z"),
                "impact": release.impact,
                "kind": rule.kind,
                "forecast": release.forecast,
                "previous": release.previous,
                "actual": actual,
                "tracked": rule.fred is not None,
                "book": book_line(rule),
                "book_below": book_line_below(rule),
                "above": rule.above if rule.kind == "data" else None,
                "noun": rule.noun,
                "book_said": book,
                "gold": gold.as_json() if gold is not None else None,
                "gold_did": did,
                "verdict": verdict(book, did),
            }
        )

    return {
        "generated_at": now.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "utc_offset_minutes": 180,
        "week": {
            "start": week_start.isoformat(),
            "end": week_end.isoformat(),
            "iso_week": monday.isocalendar().week,
        },
        "events": events,
        "gold": {
            "source": GOLD_SOURCE,
            "points": gold_path(bars, week_start, min(now, week_end))
            if bars or not same_week
            else last_week.get("gold", {}).get("points", []),
        },
        "sources": {
            "calendar": "forex factory weekly calendar feed",
            "actual": "fred, federal reserve bank of st. louis",
            "gold": GOLD_SOURCE,
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", type=Path, required=True, help="where to write data.json")
    parser.add_argument("--calendar", type=Path, help="read the calendar feed from a file instead")
    parser.add_argument("--gold", type=Path, help="read the gold chart json from a file instead")
    parser.add_argument("--no-fred", action="store_true", help="leave actual numbers out")
    parser.add_argument("--now", help="pretend it is this time (iso 8601), for testing")
    parser.add_argument("--previous", help="url of the last published data.json, kept when a source is down")
    parser.add_argument(
        "--soft",
        action="store_true",
        help="when the calendar is unreachable, exit 0 and set skip=true in $GITHUB_OUTPUT instead of failing",
    )
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    now = datetime.fromisoformat(args.now).astimezone(UTC) if args.now else datetime.now(UTC)
    try:
        calendar_raw = args.calendar.read_bytes() if args.calendar else fetch(FF_URL)
    except (OSError, FetchError) as err:
        log.error("no calendar, nothing to build: %s", err)
        return _skip() if args.soft else 1
    previous = _load_previous(args.previous) if args.previous else None
    gold_raw: bytes | None
    try:
        gold_raw = args.gold.read_bytes() if args.gold else fetch(GOLD_URL, {"interval": "5m", "range": "7d"})
    except (OSError, FetchError) as err:
        log.warning("gold left out: %s", err)
        gold_raw = None

    try:
        data = build(calendar_raw, gold_raw, None if args.no_fred else Fredder(), now, previous)
    except FetchError as err:
        log.error("could not build the week: %s", err)
        return _skip() if args.soft else 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log.info("wrote %s", args.out)
    return 0


def _skip() -> int:
    """Tell the workflow to keep the published site as it is."""
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write("skip=true\n")
    return 0


def _load_previous(url: str) -> dict[str, Any] | None:
    """The last published week, or None when there is none yet (first run, or the site is down)."""
    try:
        data = json.loads(fetch(url))
    except (FetchError, json.JSONDecodeError) as err:
        log.info("no previous week to fall back on: %s", err)
        return None
    if not isinstance(data, dict) or not isinstance(data.get("events"), list):
        log.info("previous week at %s is not a hiranya data file, ignored", url)
        return None
    return data


if __name__ == "__main__":
    sys.exit(main())
