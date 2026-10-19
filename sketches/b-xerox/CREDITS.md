# credits

Four photographs, all from Wikimedia Commons. Originals are in `img/src/`, each with a `.meta.json` recording what the Commons API returned. The processed versions in `img/` were made with ImageMagick (grayscale, crop, levels, 45-degree halftone with `-ordered-dither`, threshold, and several blur + noise + threshold passes to imitate photocopy generations) and composed with a small Python/PIL script (scissor cuts, paste-up edges).

| processed file | original | Commons page | author | license |
|---|---|---|---|---|
| `img/hero.png` (the boy under the letters, cropped from the crowd and enlarged about 3x) | `img/src/crowd-nyse-1929.jpg` | https://commons.wikimedia.org/wiki/File:Crowds_gathering_outside_New_York_Stock_Exchange_(3).jpg | Associated Press, 24 Oct 1929 | Public domain |
| `img/late.png` (the same cover, copied eight more times) | `img/src/crowd-nyse-1929.jpg` | same as above | Associated Press, 24 Oct 1929 | Public domain |
| `img/bus.png` | `img/src/corridor.jpg` (a bus window, despite the filename) | https://commons.wikimedia.org/wiki/File:The_Next_Stop_is_Pravda_Street_-_Flickr_-_Mikhail_Bearr.jpg | Mikhail Matvienko (Flickr: Mikhail Bearr) | CC BY-SA 2.0, https://creativecommons.org/licenses/by-sa/2.0 |
| `img/pans.png` | `img/src/pan-window.jpg` | https://commons.wikimedia.org/wiki/File:The_World_Gold_Panning_Championships_1977_in_Tankavaara_Finnish_Lapland_(JOKAIH3B2-8).tif | Anja Halla (Finnish Heritage Agency, via finna.fi) | CC BY 4.0, https://creativecommons.org/licenses/by/4.0 |
| `img/tunnel.png` | `img/src/tunnel.jpg` | https://commons.wikimedia.org/wiki/File:159-366_-_Freiheit_-_Freedom_-_Flickr_-_Boris_Thaser.jpg | Boris Thaser | CC BY 2.0, https://creativecommons.org/licenses/by/2.0 |

Changes made to the photographs: cropped, converted to grayscale, levels changed, halftoned or thresholded, photocopy noise added. In `tunnel.png` a small round lamp on the door was painted out. In `bus.png` the man's face was dodged (lightened) before thresholding. The CC BY-SA 2.0 bus photo stays under CC BY-SA 2.0 in its processed form (`img/bus.png`).

## made for this sketch, no outside source

- `img/hero.png`: "hiranya", each letter rendered in Anton, cut out on its own scissor polygon, rotated, damaged one by one (worn toner, filled counters, edge dropouts, starvation streaks), pasted over the 1929 boy, then put through three photocopy generations with a drum ghost and the black edge of an open copier lid.
- `img/late.png`: the cover's word, copied eight more times (blur, noise, threshold, two vertical drags).
- `img/1700.png`: "17:00" typed in Courier Prime Bold with a ribbon weave, then enlarged in two copier steps until the weave shows.
- `img/ghost1700.png`: a dotted drum ghost of `1700.png`.
- `img/slip.png`: a typed slip (Courier Prime) with a Code 128 barcode (Libre Barcode 128 Text), photocopied twice, with a staple.
- `img/stamp-mon.png`, `img/stamp-tue.png`, `img/stamp-wed.png`: one rubber stamp in Courier Prime Bold, pressed three times with different pressure, angle and a missed corner.
- `img/band.png`, `img/streak.png`: the open-lid glass edge on the left and one drum streak, both for the full page height.
- The red: an inline SVG biro line in `index.html` (two strokes under "the book lied."). It is the only red on the page.

## fonts

Loaded from Google Fonts: Courier Prime and Tinos. Rendered into the images only: Anton (the wordmark), Courier Prime Bold (slip, 17:00, stamps) and Libre Barcode 128 Text (the barcode). All SIL Open Font License.

The barcode text is `ÌXAU-ISMS-2610OÎ`: Code 128 start B, the data, checksum value 47 (`O`) and stop. It encodes `XAU-ISMS-2610`, the id of the next release in `sketches/data.json`.

## numbers

All figures come from `sketches/data.json` and are sample values for this sketch.
