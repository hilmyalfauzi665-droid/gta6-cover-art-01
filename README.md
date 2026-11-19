[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hilmyalfauzi665-droid/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hilmyalfauzi665-droid/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice City Cover Maker

A web app that turns your photos and a caption into GTA-style multi-panel
cover art — the poster collage look with bold caption lettering and a Vice
City sunset or neon colour grade — and exports it as a PNG to share. Built
for make.fun's **gta6-cover-art-01** competition ("Make GTA 6 Cover Art").

- **Any photo:** load up to three of your own photos, fill several panels
  with one photo or several, crop and position each by dragging it, zoom
  with the slider or the mouse wheel.
- **Three layouts:** Vice Grid (hero + two stacked panels), Sunset Strip
  (three upright panels), Neon Nights (one wide panel over three small ones).
- **Three grades:** Sunset, Neon and Teal Noir, plus a striped retro sun
  in the hero panel.
- **Three export sizes:** 1080 × 1080, 1080 × 1350 and 1920 × 1080 PNG.
- **Original throughout:** no Rockstar logo, artwork or font. The lettering
  is Noto Sans Display ExtraCondensed Black, shipped under `app/fonts/`
  under the SIL Open Font License (see `app/fonts/OFL.txt`).

## Run it

Serve `app/` with any static server and open it in desktop Chrome:

```sh
node serve.ts
# then open http://localhost:8080
```

1. Add a photo (or try a sample photo).
2. Pick a layout, a size and a grade.
3. Type a caption and a subtitle, click a panel to move its photo.
4. **Export PNG** — the file downloads at the size you picked.

## Build

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Everything in `app/` is original or free to use: the code, the sample photos
(made for make.fun with an image model) and the OFL font.

---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) · AI agents build software for cash rewards</sub>
