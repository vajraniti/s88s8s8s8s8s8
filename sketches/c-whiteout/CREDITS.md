# credits, sketch C (whiteout)

All three photographs come from Wikimedia Commons. The originals in `img/src/` are kept as
downloaded (Commons thumbnails: 1920px for the skiers, 1280px for the other two). Everything in
`img/` that comes from a photograph is my own processing of it with numpy, Pillow and ImageMagick.
Each image gets its own treatment, and none of them uses a dither screen:

- **hero** (`img/whiteout.jpg`): flipped left to right and cropped wide (source x 200-1920,
  y 330-1405, kept at 1720x1075) so the sky holds the photo's own halo arc and the skiers sit low,
  about a third in from the left. The arc was measured from the pixels, not drawn: a red-minus-blue
  ridge on a circle round the hidden sun (centre about 1760, 752 in the flipped source, radius about
  1205 px, steady over 186-206 degrees). That ridge is burned to white with an uneven width and
  brightness along its length. The sky inside it is held a little darker, the way it is inside a real
  halo, so the ring can show. The sundog (a vertical bright smear between the trees) is lifted. The
  trees are fogged to ghosts, more so on the left where the wordmark sits. The snow is blown to paper.
  There is glare where the hidden sun is (behind 金). The skiers are masked and protected, so they
  stay the darkest pixels in the frame. One horizontal smear pass runs across the snow line (blowing
  snow), and the bottom drifts into the page. Continuous tone.
- **frost line** (`img/frost-line.png`): cropped to the wire (source x 160-1120, y 280-580) and
  enlarged 1.5x. It is copied on local contrast (the photo minus its own blur), so flat haze and flat
  snow go to paper and only the crystal edges print. The real wire is mostly buried in ice in the
  photo, so the copier takes what is darker than the frost on its row and closes it along its straight
  path. It prints as one hard black line with a few breaks where the ice covers it, with a lit gap
  under it. The snow under the frost burns to black. Then three copier generations (blur, clumped
  noise, threshold), and the whole strip is tilted 1.2 degrees so the wire is not a ruled line. Two
  tones.
- **after sunset** (`img/after-sunset.jpg`): the red/luma mix crushed so the sky is night and the sun
  is the only white. The sun's core is blown and burned a little wider, then the image is re-saved as
  a low-quality JPEG five times so the 8x8 blocks show in the glow. Blacks are put back to true black.

These processed versions are derivative works and carry the same licence as their source.

## photographs

| processed file | source file in `img/src/` | Commons page | author | licence |
|---|---|---|---|---|
| `img/whiteout.jpg` (hero) | `skiers-halo.jpg` | https://commons.wikimedia.org/wiki/File:Skiers_on_road_through_Hoodoos_above_Mammoth_Terraces_and_22_degree_halo_with_sundog_and_supralateral_arc;_NPSDiane_Renkin_(b7e81ca4-20f9-4271-b307-b700f4b0522e).jpg | NPS / Diane Renkin (via NPGallery) | Public domain (work of the US National Park Service) |
| `img/after-sunset.jpg` (end) | `sundogs-finger-mountain.jpg` | https://commons.wikimedia.org/wiki/File:Sun_Dogs_(53451941131).jpg | BLM Alaska | Public domain (work of the US Bureau of Land Management) |
| `img/frost-line.png` (frost line) | `hoarfrost-fence.jpg` | https://commons.wikimedia.org/wiki/File:Hoar_frost_on_a_wire_fence_in_Brastad.jpg | W.carter | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0) |

Because its source is CC BY-SA 4.0, `img/frost-line.png` is shared under CC BY-SA 4.0 with the credit
above. The other two processed images are public domain. The page footer points here.

## made from scratch (no third-party material)

- `img/kin.png`: the glyph 金 rendered from the Dela Gothic One font file (OFL, google/fonts
  repository) with ImageMagick. It was thinned (morphological dilate of the white) so the 王 strokes
  open up, stretched about 2.4x vertically, and pushed through three photocopier generations. Two bands
  are dragged sideways like a dry brush or blowing snow, a few white scratches mark where the hidden
  sun burns through, and the foot breaks up into horizontal drift. It is ink only, black with alpha.
- `img/hiranya.png`: the word hiranya plotted by hand as a ballpoint stroke. I drew my own point
  skeleton, smoothed it with Catmull-Rom and added slant and tremor. Stroke width follows pressure
  (downstrokes are heavy), the ball skips on light upstrokes, ink pools where the pen rests, and there
  is a false start and a blob where the hand hesitated before "anya". Rasterised at 4x with Pillow,
  then given two blur-and-threshold bleed passes. Rotated to read bottom to top.
- the wire (inline SVG in `index.html`): hand-plotted filled outlines with tremor and pressure. It sags
  across the snow, gets caught on the stem of 金 and is pulled once around it. A second strand has
  snapped: it sags out of the photo and hangs beside the lede, and its cut end frays into one curled
  hair and a stub. The barbs are little twists, each one different. The real wire, photographed, comes
  back at the frost line.
- the red pencil through tuesday's textbook line (inline SVG): one heavy pass that tapers, plus a
  lighter return stroke, in #a3261c. This is the only colour on the page.
- the impact strokes (inline SVG, one drawn for each row: two strokes for high, one for medium) and
  the three tally scratches in the dark, the third one crossed out (inline SVG).

## type

All via Google Fonts (SIL Open Font License): DM Mono (times, numbers, event names, labels), IM Fell
English italic (the textbook rules, "the book"), and Courier Prime (the voice). Dela Gothic One is not
loaded as a web font; it was used only to cut 金 into `img/kin.png`.

## data

`../data.json`: a sample week. Event names and textbook rules are real; numbers and reactions are made
up for the sketch. The value 52.6 that prints into ISM Services when the countdown reaches zero is
made up as well (`script.js`; `?t=5` starts five seconds before 17:00 if you want to see it).
