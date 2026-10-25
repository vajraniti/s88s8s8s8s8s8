# hiranya

One page: the usd releases that move gold this week, in utc+3. The number, the forecast, what the
textbook says gold should do, and what gold actually did in the hour after. It starts in fog, clears
into the week, and goes under the ice after sunset.

## how it works

- `docs/` is the page: plain html, css and javascript, no build step. `script.js` reads `data.json`
  and writes the week into the table; its clock runs the countdown, the big time and the voice.
- `scripts/build_data.py` writes `docs/data.json` from three free, keyless sources:
  the Forex Factory weekly calendar feed (schedule, impact, forecast, previous), FRED (actual numbers)
  and Yahoo Finance's COMEX gold futures chart (what gold did). `scripts/catalog.py` holds the textbook
  rule for each kind of release and the FRED series behind it.
- `.github/workflows/site.yml` runs the builder every ten minutes and on every push, commits
  `docs/data.json` when the week has changed, and asks GitHub Pages to rebuild.

Numbers that no free feed carries (ISM, S&P Global PMIs, Michigan, Conference Board) show the
forecast and the book, and stay blank for the actual.

## turning it on

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, branch `sssss8s8s8`,
folder `/docs`. Every push publishes `docs/` as it is; the workflow keeps `data.json` in it fresh.

## running it locally

```sh
python3 scripts/build_data.py --out docs/data.json
python3 -m http.server -d docs 8000      # then open http://localhost:8000
```

`?now=2026-10-21T16:23` pretends it is that time (utc+3); `?data=other.json` reads another file from
`docs/`.

## checks

```sh
ruff check . && ruff format --check . && mypy && pytest
```

`design/style-brief.md` is the style research behind the look; `sketches/` holds the sketches it came from.
