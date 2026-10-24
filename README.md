# hiranya

One page: the usd releases that move gold this week, in utc+3. The number, the forecast, what the
textbook says gold should do, and what gold actually did in the hour after. It starts in fog, clears
into the week, and goes under the ice after sunset.

## how it works

- `site/` is the page: plain html, css and javascript, no build step. `script.js` reads `data.json`
  and writes the week into the table; its clock runs the countdown, the big time and the voice.
- `scripts/build_data.py` writes `site/data.json` from three free, keyless sources:
  the Forex Factory weekly calendar feed (schedule, impact, forecast, previous), FRED (actual numbers)
  and Yahoo Finance's COMEX gold futures chart (what gold did). `scripts/catalog.py` holds the textbook
  rule for each kind of release and the FRED series behind it.
- `.github/workflows/site.yml` runs the builder every ten minutes and on every push, and publishes
  `site/` to GitHub Pages.

Numbers that no free feed carries (ISM, S&P Global PMIs, Michigan, Conference Board) show the
forecast and the book, and stay blank for the actual.

## turning it on

Settings → Pages → Build and deployment → Source: **GitHub Actions**. The next run publishes the site.

## running it locally

```sh
python3 scripts/build_data.py --out site/data.json
python3 -m http.server -d site 8000      # then open http://localhost:8000
```

`?now=2026-10-21T16:23` pretends it is that time (utc+3); `?data=other.json` reads another file from
`site/`.

## checks

```sh
ruff check . && ruff format --check . && mypy && pytest
```

`docs/style-brief.md` is the style research behind the look; `sketches/` holds the sketches it came from.
