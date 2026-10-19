# credits, sketch A (the descent)

All photographs come from Wikimedia Commons. The originals sit in `img/src/` as downloaded
(1920px Commons thumbnails). Everything in `img/` is our own processing of them with numpy,
Pillow and ImageMagick: grayscale, levels, a one-axis drag of the ground (each row of the photo
stretched sideways by its own amount, so the defect has a direction), 6-tone error-diffusion
dither, photocopy generations. The processed versions are derivative works and carry the
licence of their source.

## photographs and scans

| processed file(s) | source file in `img/src/` | Commons page | author | licence |
|---|---|---|---|---|
| `img/hero.png`, `img/hero-front.png`; also the fog that eats the top of `img/seventeen.png` | `mtatsminda-fog-road.jpg` | https://commons.wikimedia.org/wiki/File:2025-03-20_Pine_forest_on_Mtatsminda_Range_in_fog.jpg | Yuri Samoylov | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |
| `img/street.png` | `erste-schritte-night-street.jpg` | https://commons.wikimedia.org/wiki/File:001-366_-_Erste_Schritte_-_First_steps_-_Flickr_-_Boris_Thaser.jpg | Boris Thaser (Augsburg, Germany), via Flickr | CC BY 2.0 (https://creativecommons.org/licenses/by/2.0) |
| `img/paper.jpg`; the fibre map inside `img/stain-jolts.png` | `vintage-paper-texture.jpg` | https://commons.wikimedia.org/wiki/File:Vintage_Paper_Texture_(9789792113).jpg | James Puckett (Boulder, USA), via Flickr | CC BY 2.0 (https://creativecommons.org/licenses/by/2.0) |

Because the hero source is CC BY-SA 4.0, `hero.png`, `hero-front.png` and `seventeen.png` are
shared under CC BY-SA 4.0. `street.png`, `paper.jpg` and `stain-jolts.png` need the CC BY 2.0
credits above. The colophon at the bottom of the page names all three authors and points here.

## made from scratch (no third-party material)

- `img/hiranya.png`: the word set in Arimo, stretched about four times taller, then copied four
  generations (blur, threshold, slight rotation each time), with toner dropouts clumped where the
  drum was tired and a few scanlines dragged to the right where the page slipped.
- `img/seventeen.png`: "17:00" through the same copier, light toner; its top dissolves along the
  fog photo above.
- `img/stamp-*.png`: rubber date stamps, text in Cousine, inked unevenly.
- `img/slip-lid.png`: the black band a copier leaves when the lid is up.
- `img/archive-w4*.png`: older weeks set in Cousine and copied 2, 5 and 9 generations
  (counters fill in, crop and skew drift, dropouts, a lid band, three different edges).
- hand-plotted SVG paths in the page (generated, then wobbled): the gold line through the word
  (gold from mon 00:00 to wed 16:23, with the three releases as steps), the strike through the
  JOLTS rule, the "you are here" line, the playbook bracket and underline, the impact tallies,
  and the torn edges of the sheet and the slip (CSS clip-path polygons).

## fonts (loaded from Google Fonts, all SIL Open Font License 1.1)

- Cousine (Steve Matteson): table digits, codes, the voice lines, captions
- Arimo (Steve Matteson): event names, the week heading; also the source of the wordmark and 17:00
- IM Fell English (Igino Marini): playbook margin notes, "the book lied.", small italics
- Libre Barcode 128 Text (Lasse Fister): barcodes; each is a real Code 128 set B encoding
  (start, data, checksum, stop) of the event code printed under it

## data

`../data.json`, a sample week. Event names and textbook rules are real; numbers and gold
reactions are made up for the sketch. Archive weeks 40 to 42 are invented too.
