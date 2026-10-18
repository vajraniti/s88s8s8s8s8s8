# credits, sketch A (the descent)

All photographs come from Wikimedia Commons. The originals sit in `img/src/` as downloaded
(1920px Commons thumbnails, or the full file where noted). Everything in `img/` is our own
processing of them with ImageMagick: grayscale, levels, several photocopy generations
(blur, multiplicative noise, contrast), 4-tone error-diffusion dither, dithered alpha masks.
Those processed versions are derivative works and carry the same licence as their source.

## photographs

| processed file(s) | source file in `img/src/` | Commons page | author | licence |
|---|---|---|---|---|
| `img/hero-fog-road.png`, `img/hero-front.png` | `mtatsminda-fog-road.jpg` | https://commons.wikimedia.org/wiki/File:2025-03-20_Pine_forest_on_Mtatsminda_Range_in_fog.jpg | Yuri Samoylov | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |
| `img/solitude.png` | `solitude-in-fog.jpg` | https://commons.wikimedia.org/wiki/File:Solitude_In_Fog_(Unsplash).jpg | Harman Abiwardani (apu889), via Unsplash | CC0 1.0 (public domain dedication) |
| `img/birches.png` | `night-moscow-forest.jpg` | https://commons.wikimedia.org/wiki/File:Night_Moscow_forest_(6669016815).jpg | Dmitry Kalinin, Moscow, Russia | CC BY 2.0 (https://creativecommons.org/licenses/by/2.0) |
| `img/bicycle.png` | `lonely-man-bicycle.jpg` | https://commons.wikimedia.org/wiki/File:Lonely_man_on_a_bicycle.jpg | Altitonantis | CC0 1.0 (public domain dedication) |

Because two sources are CC BY / CC BY-SA, the processed hero images (`hero-fog-road.png`,
`hero-front.png`) are shared under CC BY-SA 4.0, and `birches.png` needs the CC BY 2.0 credit above.
The page footer points here.

## made from scratch (no third-party material)

- `img/hiranya-wordmark.png`: the word set in Tinos, rendered to a raster, stretched several
  times taller than it is wide, then pushed through seven photocopy generations (blur, noise,
  threshold) and an ordered-dither fade at the foot.
- `img/stain-jolts.png`: procedural dried stain (numpy + Pillow), the only red on the page.
- `img/stamp-*.png`: rubber-stamp marks, text set in Cousine, roughened in ImageMagick.
- `img/strip-*.png` (incl. `strip-0.png` and its specks-only twin `strip-0-over.png`), `img/sheet-fog.png`,
  `img/sheet-tear.png`, `img/slip-mask-*.png` (torn edges, used as css masks, inlined in style.css),
  `img/slip-toner-*.png` (copier edge and specks): dithered transitions and torn edges from
  ImageMagick gradients, plasma and noise.
- `img/archive-w4*.png`: text set in Cousine, copied 2, 5 and 9 generations.
- hand strokes (strike-through, now-line, bracket, underline) are generated SVG paths in the HTML.

## fonts (loaded from Google Fonts, all SIL Open Font License 1.1)

- Cousine (Steve Matteson): table digits, codes, captions
- Arimo (Steve Matteson): event names, slip titles
- Tinos (Steve Matteson): day numerals, the huge 17:00, verdicts; also the source of the wordmark
- Courier Prime (Alan Dague-Greene): the voice lines
- IM Fell English (Igino Marini): margin notes in the playbook, "the book lied."
- Libre Barcode 128 Text (Lasse Fister): barcodes; each one is a real Code 128 set B
  encoding (start, data, checksum, stop) of the event code printed under it.

## data

`../data.json`, a sample week. Event names and textbook rules are real; numbers and gold
reactions are made up for the sketch. Archive weeks 40 to 42 are invented too.
