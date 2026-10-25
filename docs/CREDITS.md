# credits: hiranya

Three photographs from Wikimedia Commons are used. They were downloaded as Commons thumbnails and
processed with numpy, Pillow and ImageMagick; only the processed files ship in `img/`. The processed
versions are derivative works and carry the licence of their source.

## photographs

| processed file(s) | original (Commons page) | author | licence |
|---|---|---|---|
| `img/hero.png`, `img/hero-front.png`; the fog that thins the top of the big time (`img/t/fog-mask.png`, inlined in `style.css`) | https://commons.wikimedia.org/wiki/File:2025-03-20_Pine_forest_on_Mtatsminda_Range_in_fog.jpg | Yuri Samoylov | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |
| `img/frost-line.png` | https://commons.wikimedia.org/wiki/File:Hoar_frost_on_a_wire_fence_in_Brastad.jpg | W.carter | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |
| `img/after-sunset.jpg` | https://commons.wikimedia.org/wiki/File:Sun_Dogs_(53451941131).jpg | BLM Alaska | Public domain (work of the US Bureau of Land Management) |

Because their sources are CC BY-SA 4.0, `hero.png`, `hero-front.png`, `fog-mask.png` and
`frost-line.png` are shared under CC BY-SA 4.0 with the credits above. The sunset is public domain.
The colophon at the bottom of the page names all three authors and points here.

What was done to them:

- **fog** (`hero.png`, `hero-front.png`): sketch A's treatment, kept: grayscale, levels lifted to a
  whiteout, a fog bank brightened on the left where the voice sits, error-diffusion dither. Changed for
  D: the ground below the grass is still dragged sideways row by row (a slit-scan, each row stretched
  from its own anchor, anchors shared in clumps), but instead of falling into the dark it clears into
  the page. Fog comes down over the dragged ground first, in tongues (the photo's own fog tone, mottled,
  with its grain); then the page takes the fog unevenly, its edge wandering about 130 rows up and down
  across the width, with white climbing into the ground in clumps. The last rows are exact paper white.
  The dither palette gained paper white as a seventh tone; the photo above the ground never uses it, so
  A's fog keeps its tone. `hero-front.png` is the grass and everything below it, standing in front of the
  wordmark, so the word's feet sink into the ground.
- **frost line** (`frost-line.png`): sketch C's file, unchanged (local-contrast copy of the frost, the
  wire closed along its path, three copier generations, tilted 1.2 degrees, two tones).
- **after sunset** (`after-sunset.jpg`): sketch C's file, unchanged (red/luma mix crushed to night, the
  sun burned to the only white hole, re-saved as a low-quality JPEG five times).

## made from scratch (no third-party material)

- `img/hiranya.png` (from sketch A): the word set in Arimo, stretched about four times taller, then
  copied four generations (blur, threshold, slight rotation each time), toner dropouts clumped where the
  drum was tired, a few scanlines dragged to the right where the page slipped.
- `img/t/*.png`, the copier figures: sketch A's "17:00" was one image. Here every digit and the colon go
  through the same copier (Arimo Regular, the same 3.4x stretch, the same drag and dropout settings).
  All glyphs are set on one line and copied together, so the slip runs at the same height through every
  glyph, the way one copied line of text would. There are two copies of each glyph (`0a`, `0b`, ...) so a
  repeated digit is never a clone. `script.js` sets the big time (whatever release comes next) and the
  day numbers of the week from them. The fog that thins the top of the big time is a mask cut from the
  fog photo (see above): the top tenth of the figures thins out grain by grain, never all the way.
- `img/kin-white.png`: sketch C's 金, rendered from the Dela Gothic One font file (OFL, google/fonts
  repository) with ImageMagick, thinned, stretched about 2.4x, pushed through three copier generations,
  with two dragged bands, sun scratches and a drifting foot. Same alpha, every grain kept; the ink is
  turned from black to A's fog tone (#eeede9), so it reads white in the night while the sun stays the
  only paper white.
- hand-plotted SVG, drawn by `script.js` with a small seeded wobble so each mark stays put between
  redraws: the impact strokes (three for high, two for medium), the arrows in the book's rules, the
  triangles for gold's move, the gold line in the sky over the word (this week's gold from monday 00:00), and
  the tally scratched into the night (one mark per call the book made, the lies crossed out). The
  "you are here" line, the playbook bracket and the underline were drawn once for the sketches and are
  reused as they are. The red pencil through a textbook line that lied is the only colour on the page.
- the eight-rayed star: `icon.svg` for the tab, drawn on a 16-unit grid centred on a pixel's centre so
  the upright and level rays land on whole pixels; it turns #e9e9e6 on a dark tab. `favicon.ico` is the
  same star at 16, 32 and 48 px with a pale rim, for browsers that skip svg icons.
  `apple-touch-icon.png` is the night's version: the star in #e9e9e6 on black, its edges eaten by toner
  grain, the top ray thinned by the fog, a few rows of the lower rays dragged to the right.

## data

- calendar, impact, forecast, previous: the Forex Factory weekly calendar feed (nfs.faireconomy.media).
- actual numbers: FRED, Federal Reserve Bank of St. Louis, public CSV downloads (fredgraph.csv).
- gold: COMEX gold futures (GC=F), 5-minute bars, Yahoo Finance chart endpoint.
