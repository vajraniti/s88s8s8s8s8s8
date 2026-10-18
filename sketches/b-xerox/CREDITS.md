# credits

All photographs are from Wikimedia Commons. Originals are in `img/src/` (each with a `.meta.json` recording what the Commons API returned). The processed versions in `img/` were made with ImageMagick: grayscale, levels, halftone or threshold, and several blur, noise and threshold passes to imitate photocopy generations.

| processed file | original | Commons page | author | license |
|---|---|---|---|---|
| `img/crowd-1929.png` | `img/src/crowd-nyse-1929.jpg` | https://commons.wikimedia.org/wiki/File:Crowds_gathering_outside_New_York_Stock_Exchange_(3).jpg | Associated Press, 24 Oct 1929 | Public domain |
| `img/bus-window.png` | `img/src/corridor.jpg` (a bus window, despite the filename) | https://commons.wikimedia.org/wiki/File:The_Next_Stop_is_Pravda_Street_-_Flickr_-_Mikhail_Bearr.jpg | Mikhail Matvienko (Flickr: Mikhail Bearr) | CC BY-SA 2.0, https://creativecommons.org/licenses/by-sa/2.0 |
| `img/pans.png` | `img/src/pan-window.jpg` | https://commons.wikimedia.org/wiki/File:The_World_Gold_Panning_Championships_1977_in_Tankavaara_Finnish_Lapland_(JOKAIH3B2-8).tif | Anja Halla (Finnish Heritage Agency, via finna.fi) | CC BY 4.0, https://creativecommons.org/licenses/by/4.0 |
| `img/tunnel.png` | `img/src/tunnel.jpg` | https://commons.wikimedia.org/wiki/File:159-366_-_Freiheit_-_Freedom_-_Flickr_-_Boris_Thaser.jpg | Boris Thaser | CC BY 2.0, https://creativecommons.org/licenses/by/2.0 |
| `img/raven.png` | `img/src/raven.jpg` | https://commons.wikimedia.org/wiki/File:A_scary_outlook_-_Flickr_-_Marco_vdH.jpg | Marco van der Haar | CC BY 2.0, https://creativecommons.org/licenses/by/2.0 |

The CC BY-SA 2.0 bus photo stays under CC BY-SA 2.0 in its processed form (`img/bus-window.png`).

## made for this sketch, no outside source

- `img/hiranya.png`: "hiranya" set in Anton, then three photocopy generations (paste-up seam, copier glass dirt, worn drum, one dragged smear dithered to dots).
- `img/hiranya-late.png`: the same wordmark copied six more times.
- `img/1700.png`: "17:00" in Anton, three photocopy generations.
- `img/stamp-*.png`: rubber stamps set in Cousine Bold, with ink dropouts.
- `img/red-print.png`: a generated whorl thumbprint in dried red. This is the only red on the page.

## fonts

Loaded from Google Fonts: Courier Prime, Cousine, IM Fell English, Tinos, Anton and Libre Barcode 128 Text. All are SIL Open Font License. Anton also renders the wordmark rasters.

The barcode text is `ÌXAU-ISMS-2610OÎ`: Code 128 start B, the data, checksum value 47 (`O`) and stop. It was rendered and decoded back to `XAU-ISMS-2610` with a valid checksum.

## numbers

All figures come from `sketches/data.json` and are sample values for this sketch.
