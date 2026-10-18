# credits, sketch C (whiteout)

All three photographs come from Wikimedia Commons. The originals sit in `img/src/` as downloaded
(Commons thumbnails: 1920px for the skiers, 1280px for the other two). Everything in `img/` that
comes from a photograph is our own processing of it with ImageMagick and numpy: grayscale or a single
colour channel, levels and sigmoidal contrast, several photocopy generations (blur, Gaussian noise,
levels), an ordered halftone dither (`h4x4a` / `h6x6a`), and a two-tone cold palette mapping. Those
processed versions are derivative works and carry the same licence as their source.

## photographs

| processed file | source file in `img/src/` | Commons page | author | licence |
|---|---|---|---|---|
| `img/whiteout-kin.png` (hero) | `skiers-halo.jpg` | https://commons.wikimedia.org/wiki/File:Skiers_on_road_through_Hoodoos_above_Mammoth_Terraces_and_22_degree_halo_with_sundog_and_supralateral_arc;_NPSDiane_Renkin_(b7e81ca4-20f9-4271-b307-b700f4b0522e).jpg | NPS / Diane Renkin (via NPGallery) | Public domain (work of the US National Park Service) |
| `img/low-sun.png` (end) | `sundogs-finger-mountain.jpg` | https://commons.wikimedia.org/wiki/File:Sun_Dogs_(53451941131).jpg | BLM Alaska | Public domain (work of the US Bureau of Land Management) |
| `img/frost-wire.png` (tally band) | `hoarfrost-fence.jpg` | https://commons.wikimedia.org/wiki/File:Hoar_frost_on_a_wire_fence_in_Brastad.jpg | W.carter | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |

Because its source is CC BY-SA 4.0, `img/frost-wire.png` is shared under CC BY-SA 4.0 with the credit
above. The other two processed images are free of restrictions. The page footer points here.

How the hero was made: the photo was pushed pale (shadows lifted to about 30% grey, glare added
toward the sun side), the 22-degree arc and the sundog were found in the Lab b channel (the only
yellow in the sky) and burned back in as untouched white, and the glyph 金 was composited into the
sky between the trees before dithering, so the trees stand in front of it, its top is cut by the
frame, its foot dissolves into the snow, and horizontal drifts of noise erode it like blowing snow.
The two skiers were protected from the lift so they survive the halftone.

## made from scratch (no third-party material)

- `img/hiranya-mark.png`: the word hiranya plotted by hand as one continuous cursive stroke (my own
  point skeleton, Catmull-Rom smoothed, with drift, tremor and pen pressure), rasterised with Pillow,
  then three thinning photocopy generations (blur, multiplicative noise, low threshold) and a light
  `-spread`. Rotated to read bottom to top.
- `img/drop.png`: procedural dried drop (numpy + Pillow): irregular rim, darker coffee-ring edge,
  three satellite specks. The only colour on the page, used once, on the row where the book lied.
- the fence under the hero (inline SVG in `index.html`): hand-plotted in Python, two sagging strands
  with tremor and pen lifts, a leaning split post, a strand that snapped and curls. No library shapes.
- the strike through the JOLTS rule (inline SVG): two hand-placed wobbly bezier strokes.
- the dithered fade that sinks the big "2/3" into the frost band: a 400x300 gradient pushed through
  `-ordered-dither h4x4a`, inlined in `style.css` as a data URI.

## type

All via Google Fonts (SIL Open Font License): Cousine (times, numbers, codes), Courier Prime (the
voice, the textbook rules), Tinos (event names, day numerals, the big 2/3), Libre Barcode 128 Text (a
real Code 128-B encoding of XAU-ISMS-2610: start B, data, check character "O" (value 47), stop).
金 was rendered from the Dela Gothic One font file (OFL, google/fonts repository) and baked into the
hero image, stretched about 6x vertically.

## data

`../data.json`: a sample week. Event names and textbook rules are real; numbers and reactions are
made up for the sketch.
