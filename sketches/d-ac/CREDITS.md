# credits, sketch D (A's fog, C's page and night)

Three photographs from Wikimedia Commons are used. The originals sit in `img/src/` as downloaded
(Commons thumbnails). Everything in `img/` that comes from a photograph is our own processing of it
with numpy, Pillow and ImageMagick. The processed versions are derivative works and carry the licence
of their source.

## photographs

| processed file(s) | source in `img/src/` | Commons page | author | licence |
|---|---|---|---|---|
| `img/hero.png`, `img/hero-front.png`; the fog that eats the top of the big time (`img/t/fog-mask.png`, inlined in `style.css`) | `mtatsminda-fog-road.jpg` | https://commons.wikimedia.org/wiki/File:2025-03-20_Pine_forest_on_Mtatsminda_Range_in_fog.jpg | Yuri Samoylov | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |
| `img/frost-line.png` | `hoarfrost-fence.jpg` | https://commons.wikimedia.org/wiki/File:Hoar_frost_on_a_wire_fence_in_Brastad.jpg | W.carter | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |
| `img/after-sunset.jpg` | `sundogs-finger-mountain.jpg` | https://commons.wikimedia.org/wiki/File:Sun_Dogs_(53451941131).jpg | BLM Alaska | Public domain (work of the US Bureau of Land Management) |

Because their sources are CC BY-SA 4.0, `hero.png`, `hero-front.png`, `fog-mask.png` and
`frost-line.png` are shared under CC BY-SA 4.0 with the credits above. The sunset is public domain.
The colophon at the bottom of the page names all three authors and points here.

What was done to them:

- **fog** (`hero.png`, `hero-front.png`): sketch A's treatment, kept: grayscale, levels lifted to a
  whiteout, a fog bank brightened on the left where the voice sits, 6-tone error-diffusion dither.
  Changed for D: in A the ground below the grass was dragged sideways row by row (a slit-scan, each row
  stretched from its own anchor, anchors shared in clumps) and fell into the dark. Here the same drag
  burns out into the page instead: the dragged rows are overexposed a little as soon as they leave the
  grass, then the paper wins, unevenly along the streaks (clumped noise, long in x), and the last rows
  are exact paper white. The dither palette gained paper white as a seventh tone; the photo above the
  ground never uses it, so A's fog keeps its tone. `hero-front.png` is the grass and everything below it,
  standing in front of the wordmark, so the word's feet sink into the ground.
- **frost line** (`frost-line.png`): sketch C's file, unchanged (local-contrast copy of the frost, the
  wire closed along its path, three copier generations, tilted 1.2 degrees, two tones).
- **after sunset** (`after-sunset.jpg`): sketch C's file, unchanged (red/luma mix crushed to night, the
  sun burned to the only white hole, re-saved as a low-quality JPEG five times).

## made from scratch (no third-party material)

- `img/hiranya.png` (from sketch A): the word set in Arimo, stretched about four times taller, then
  copied four generations (blur, threshold, slight rotation each time), toner dropouts clumped where the
  drum was tired, a few scanlines dragged to the right where the page slipped.
- `img/t/*.png`, the big time: sketch A's "17:00" was one image. Here every digit and the colon go
  through the same copier (Arimo Regular, the same 3.4x stretch, the same drag and dropout settings;
  seed 23 instead of 29 so the slipped scanlines land mid-glyph as they did in A). All glyphs are set on
  one line and copied together, so the slip runs at the same height through every glyph, the way one
  copied line of text would. There are two copies of each glyph (`0a`, `0b`, ...) so a repeated digit
  is never a clone. The line is then cut into cells, and `script.js` sets whatever time comes next from
  them. The fog that eats their tops is a mask cut from the fog photo (see above): the tops thin out
  grain by grain, never all the way, so a 7 keeps its bar.
- `img/kin-white.png`: sketch C's 金, rendered from the Dela Gothic One font file (OFL, google/fonts
  repository) with ImageMagick, thinned, stretched about 2.4x, pushed through three copier generations,
  with two dragged bands, sun scratches and a drifting foot. Same alpha, every grain kept; the ink is
  flipped from black to white so it can stand in the night.
- hand-plotted SVG in `index.html`, generated and then wobbled: from A, the gold line through the
  word (gold from mon 00:00 to wed 16:23, the three releases as steps), the impact strokes (three for
  high, two for medium, one drawn per row), the "you are here" line, the playbook bracket and the
  underline under "a hot number is not a promise."; from C, the red pencil through tuesday's textbook
  line (one heavy pass that tapers and a lighter return, #a3261c, the only colour on the page; inlined
  in `style.css` so it repeats on every line when the rule wraps) and the three tally scratches in the
  dark, the third crossed out. New in D: the two small triangles for gold's move (Cormorant has no
  ▲/▼, so they are drawn).

## type

Cormorant Garamond (Christian Thalmann, SIL Open Font License 1.1), roman only, weights 500, 600 and
700, loaded from Google Fonts. No italic files are loaded, and `font-synthesis: none` stops the browser
from faking one. Data cells, times and countdowns use `tabular-nums lining-nums`. Arimo (wordmark, big
time) and Dela Gothic One (金) are not loaded as web fonts; they exist only inside the images above.

## data

The JSON block at the end of `index.html` is `../data.json`, verbatim: a sample week. Event names and
textbook rules are real; numbers and gold reactions are made up for the sketch. The page's clock starts
at the sample "now" (wed 21 oct, 16:23 utc+3) and the big time follows the data. For testing:
`?next=16:30` moves the release marked "next" to 16:30 that day, `?t=5` starts five seconds before the
next release (watch it move on to thursday 15:30), `?now=23:10` starts the clock at that time.
