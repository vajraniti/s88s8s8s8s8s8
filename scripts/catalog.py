"""What hiranya knows about each kind of US release.

For every calendar title it can recognise: a short code for the event id, the textbook reading
for gold ("the book"), and, where FRED carries the number, which series to read the actual from.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Fred:
    """Where the actual number lives on FRED and how to turn it into the calendar's figure."""

    series: str
    # FRED's own transformation: "lin" (as is), "chg" (change), "pch" (% change), "pc1" (% change on a year ago)
    transform: str
    # "m" monthly, "w" weekly (week ending saturday), "q" quarterly, "d" daily
    freq: str
    # monthly only: how many months the reported period lies before the release month
    lag: int = 0
    # FRED's value divided by this gives the calendar's unit (K, M, B or plain)
    factor: float = 1.0
    # a later estimate of a period that already printed (prelim/final GDP): the new value is only
    # trusted once it differs from the calendar's "previous"
    revision: bool = False


@dataclass(frozen=True)
class Rule:
    code: str
    # "data": a number against a forecast; "voice": someone talks; "text": a statement or minutes
    kind: str
    # gold's direction in the book when the number comes in above forecast
    above: str = "down"
    # the step in between, for an above-forecast number ("usd up", "hot inflation")
    why: str = "usd up"
    # what the number is about, for the margin notes ("jobs came in hot")
    noun: str = "the number"
    fred: Fred | None = None


VOICE = "hawkish -> gold down. dovish -> gold up."

# matched against the calendar title, case-insensitive, whole title
_CATALOG: list[tuple[str, Rule]] = [
    (r"cpi m/m", Rule("CPI", "data", "down", "hot inflation", "inflation", Fred("CPIAUCSL", "pch", "m", 1))),
    (r"core cpi m/m", Rule("CCPI", "data", "down", "hot inflation", "inflation", Fred("CPILFESL", "pch", "m", 1))),
    (r"cpi y/y", Rule("CPIY", "data", "down", "hot inflation", "inflation", Fred("CPIAUCNS", "pc1", "m", 1))),
    (r"core cpi y/y", Rule("CCPY", "data", "down", "hot inflation", "inflation", Fred("CPILFENS", "pc1", "m", 1))),
    (r"ppi m/m", Rule("PPI", "data", "down", "hot prices", "prices", Fred("PPIFIS", "pch", "m", 1))),
    (r"core ppi m/m", Rule("CPPI", "data", "down", "hot prices", "prices", Fred("PPIFES", "pch", "m", 1))),
    (r"retail sales m/m", Rule("RS", "data", "down", "strong spending", "spending", Fred("RSAFS", "pch", "m", 1))),
    (
        r"core retail sales m/m",
        Rule("CRS", "data", "down", "strong spending", "spending", Fred("RSFSXMV", "pch", "m", 1)),
    ),
    (r"non-farm employment change", Rule("NFP", "data", "down", "strong jobs", "jobs", Fred("PAYEMS", "chg", "m", 1))),
    (r"unemployment rate", Rule("UNR", "data", "up", "weak jobs", "unemployment", Fred("UNRATE", "lin", "m", 1))),
    (
        r"average hourly earnings m/m",
        Rule("AHE", "data", "down", "wage inflation", "wages", Fred("CES0500000003", "pch", "m", 1)),
    ),
    (r"unemployment claims", Rule("UNCL", "data", "up", "weak jobs", "claims", Fred("ICSA", "lin", "w", factor=1000))),
    (
        r"jolts job openings",
        Rule("JOLT", "data", "down", "strong jobs", "jobs", Fred("JTSJOL", "lin", "m", 2, factor=1000)),
    ),
    (
        r"adp non-farm employment change",
        Rule("ADP", "data", "down", "strong jobs", "jobs", Fred("ADPMNUSNERSA", "chg", "m", 1, factor=1000)),
    ),
    (r"advance gdp q/q", Rule("GDPA", "data", "down", "strong growth", "growth", Fred("A191RL1Q225SBEA", "lin", "q"))),
    (
        r"prelim gdp q/q",
        Rule("GDPP", "data", "down", "strong growth", "growth", Fred("A191RL1Q225SBEA", "lin", "q", revision=True)),
    ),
    (
        r"final gdp q/q",
        Rule("GDPF", "data", "down", "strong growth", "growth", Fred("A191RL1Q225SBEA", "lin", "q", revision=True)),
    ),
    (
        r"core pce price index m/m",
        Rule("CPCE", "data", "down", "hot inflation", "inflation", Fred("PCEPILFE", "pch", "m", 1)),
    ),
    (r"pce price index m/m", Rule("PCE", "data", "down", "hot inflation", "inflation", Fred("PCEPI", "pch", "m", 1))),
    (
        r"core pce price index y/y",
        Rule("CPCY", "data", "down", "hot inflation", "inflation", Fred("PCEPILFE", "pc1", "m", 1)),
    ),
    (r"pce price index y/y", Rule("PCEY", "data", "down", "hot inflation", "inflation", Fred("PCEPI", "pc1", "m", 1))),
    (r"personal spending m/m", Rule("PSP", "data", "down", "strong spending", "spending", Fred("PCE", "pch", "m", 1))),
    (r"personal income m/m", Rule("PINC", "data", "down", "strong income", "income", Fred("PI", "pch", "m", 1))),
    (
        r"industrial production m/m",
        Rule("IP", "data", "down", "strong industry", "industry", Fred("INDPRO", "pch", "m", 1)),
    ),
    (
        r"capacity utilization rate",
        Rule("CU", "data", "down", "strong industry", "industry", Fred("TCU", "lin", "m", 1)),
    ),
    (
        r"durable goods orders m/m",
        Rule("DGO", "data", "down", "strong orders", "orders", Fred("DGORDER", "pch", "m", 1)),
    ),
    (
        r"core durable goods orders m/m",
        Rule("CDGO", "data", "down", "strong orders", "orders", Fred("ADXTNO", "pch", "m", 1)),
    ),
    (
        r"building permits",
        Rule("BP", "data", "down", "strong housing", "housing", Fred("PERMIT", "lin", "m", 1, factor=1000)),
    ),
    (
        r"housing starts",
        Rule("HS", "data", "down", "strong housing", "housing", Fred("HOUST", "lin", "m", 1, factor=1000)),
    ),
    (r"new home sales", Rule("NHS", "data", "down", "strong housing", "housing", Fred("HSN1F", "lin", "m", 1))),
    (
        r"existing home sales",
        Rule("EHS", "data", "down", "strong housing", "housing", Fred("EXHOSLUSM495S", "lin", "m", 1, factor=1e6)),
    ),
    (
        r"empire state manufacturing index",
        Rule("ESMI", "data", "down", "strong industry", "industry", Fred("GACDINA066MNFRBNY", "lin", "m", 0)),
    ),
    (
        r"philly fed manufacturing index",
        Rule("PHIL", "data", "down", "strong industry", "industry", Fred("GACDFSA066MSFRBPHI", "lin", "m", 0)),
    ),
    (r"import prices m/m", Rule("IMP", "data", "down", "hot prices", "prices", Fred("IR", "pch", "m", 1))),
    (
        r"trade balance",
        Rule("TB", "data", "down", "smaller deficit", "the deficit", Fred("BOPGSTB", "lin", "m", 2, factor=1000)),
    ),
    (
        r"employment cost index q/q",
        Rule("ECI", "data", "down", "wage inflation", "wages", Fred("ECIALLCIV", "pch", "q")),
    ),
    (r"federal funds rate", Rule("FFR", "data", "down", "higher rates", "rates", Fred("DFEDTARU", "lin", "d"))),
    # numbers that no free feed carries: the book still applies, the actual is not tracked
    (r"ism manufacturing pmi", Rule("ISMM", "data", "down", "usd up", "industry")),
    (r"ism services pmi", Rule("ISMS", "data", "down", "usd up", "services")),
    (r"ism manufacturing prices", Rule("ISMP", "data", "down", "hot prices", "prices")),
    (r"ism services prices", Rule("ISSP", "data", "down", "hot prices", "prices")),
    (r"flash manufacturing pmi", Rule("FMPM", "data", "down", "usd up", "industry")),
    (r"flash services pmi", Rule("FSPM", "data", "down", "usd up", "services")),
    (r"(prelim|revised) uom consumer sentiment", Rule("UOM", "data", "down", "confident consumers", "consumers")),
    (r"(prelim|revised) uom inflation expectations", Rule("UOMI", "data", "down", "inflation fears", "inflation")),
    (r"cb consumer confidence", Rule("CBCC", "data", "down", "confident consumers", "consumers")),
    (r"pending home sales m/m", Rule("PHS", "data", "down", "strong housing", "housing")),
    (r"chicago pmi", Rule("CPMI", "data", "down", "strong industry", "industry")),
    (r"richmond manufacturing index", Rule("RMI", "data", "down", "strong industry", "industry")),
    (r"(prelim |revised )?unit labor costs q/q", Rule("ULC", "data", "down", "wage inflation", "wages")),
    (r"(prelim |revised )?nonfarm productivity q/q", Rule("PROD", "data", "down", "usd up", "productivity")),
    (r"prelim gdp price index q/q", Rule("GDPI", "data", "down", "hot inflation", "inflation")),
    # words, not numbers
    (r"fomc statement", Rule("FOMC", "text")),
    (r"fomc press conference", Rule("FOMP", "voice")),
    (r"fomc meeting minutes", Rule("FOMM", "text")),
    (r"beige book", Rule("BEIG", "text")),
    (r"fed chair .+ (speaks|testifies)", Rule("FEDC", "voice")),
    (r".+ (speaks|testifies)", Rule("", "voice")),
]

_COMPILED = [(re.compile(rf"^{pattern}$", re.IGNORECASE), rule) for pattern, rule in _CATALOG]

# calendar entries that are usd and high or medium, but say nothing about gold
_IGNORED = re.compile(r"crude oil inventories|natural gas storage|bond auction|bank holiday", re.IGNORECASE)


def ignored(title: str) -> bool:
    return bool(_IGNORED.search(title))


def initials(title: str) -> str:
    """A short code for a title the catalog does not know: the first letters of its words."""
    words = re.findall(r"[A-Za-z0-9]+", title)
    code = "".join(w[0] for w in words).upper()
    return code[:4] or "EV"


def rule_for(title: str) -> Rule:
    """The catalog rule for a calendar title; an unknown number gets the usd default, untracked."""
    for pattern, rule in _COMPILED:
        if pattern.match(title.strip()):
            if not rule.code:
                return Rule(initials(title), rule.kind, rule.above, rule.why, rule.noun, rule.fred)
            return rule
    return Rule(initials(title), "data")


def book_line(rule: Rule) -> str:
    """The textbook rule as one line; the page draws the "->" as arrows."""
    if rule.kind != "data":
        return VOICE
    return f"above forecast -> {rule.why} -> gold {rule.above}"


_TURNED = {
    "hot": "cool",
    "strong": "weak",
    "weak": "strong",
    "smaller": "bigger",
    "higher": "lower",
    "confident": "gloomy",
    "usd": "usd",
}
_TURNED_WHOLE = {"usd up": "usd down", "wage inflation": "soft wages", "inflation fears": "calmer inflation"}


def opposite(direction: str) -> str:
    return "up" if direction == "down" else "down"


def why_below(why: str) -> str:
    """The middle step for a number that came in under the forecast: "strong jobs" -> "weak jobs"."""
    if why in _TURNED_WHOLE:
        return _TURNED_WHOLE[why]
    first, _, rest = why.partition(" ")
    return f"{_TURNED.get(first, 'soft')} {rest}".strip() if rest else _TURNED.get(first, first)


def book_line_below(rule: Rule) -> str | None:
    """The same rule read from below, for a number under the forecast; None for words."""
    if rule.kind != "data":
        return None
    return f"below forecast -> {why_below(rule.why)} -> gold {opposite(rule.above)}"
