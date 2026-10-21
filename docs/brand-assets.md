# Brand and install assets

CloakResume’s previews follow [Cloakyard Air](../DESIGN.md). PWA and README images
capture actual production landing/editor states. The 1200×630 social card uses
[artwork/og.html](../artwork/og.html), pinned local Air CSS, the canonical mark and
the real light editor capture. It shares the family’s quiet typography, neutral
surfaces and product-proof composition; it does not invent application controls.

## Sources and consumers

| Asset                                         |     Size | Consumer                                   |
| --------------------------------------------- | -------: | ------------------------------------------ |
| `public/cloakresume-mark.svg`                 |    64×64 | Header and SVG favicon                     |
| `public/icons/cloakresume-app-icon.svg`       |    64×64 | Full-bleed launcher source                 |
| `public/icons/og-image.png`                   | 1200×630 | Open Graph and X/Twitter metadata          |
| `public/screenshots/landing-narrow-light.png` | 860×1864 | Narrow PWA screenshot, light               |
| `public/screenshots/landing-narrow-dark.png`  | 860×1864 | Narrow PWA screenshot, dark                |
| `public/screenshots/editor-wide-light.png`    | 1440×900 | Wide PWA, README fallback and social proof |
| `public/screenshots/editor-wide-dark.png`     | 1440×900 | Wide PWA and dark README picture source    |
| `public/icons/pwa-64x64.png`                  |    64×64 | Small PWA launcher                         |
| `public/icons/pwa-192x192.png`                |  192×192 | Standard PWA launcher                      |
| `public/icons/pwa-512x512.png`                |  512×512 | High-resolution PWA launcher               |
| `public/icons/maskable-icon-512x512.png`      |  512×512 | Maskable launcher                          |
| `public/icons/apple-touch-icon.png`           |  180×180 | iOS launcher                               |
| `public/icons/safari-pinned-tab.svg`          |      SVG | Monochrome Safari pinned tab               |

The unchanged mark uses the family’s 64×64 circular construction, diameter-42
glyph keyline and 3px white stroke. The full-bleed launcher keeps the complete
glyph inside the central 80% maskable safe circle. Launcher PNGs remain RGB;
`favicon.svg` and `logo.svg` remain compatibility copies for older saved links.
These asset compatibility names do not define current application styling.

## Reproduce the captures

```bash
vp run build
vp run generate-screenshots
vp run generate-og
vp run build
```

The final build copies the new files into `dist`. Screenshots start an owned
production preview at port 4180 and close it afterwards. To use an existing
production preview, set `SCREENSHOT_URL=http://127.0.0.1:4180/`. A dev server is
rejected. Set `CHROME_PATH` to a Chrome/Chromium executable outside the standard
macOS installation. `PREVIEW_OUTPUT_DIR` writes generated files to another public
asset root for comparisons; the social card always reads its canonical screenshot.
The OG renderer needs no server and loads only local files. Software rasterization
keeps its scaled editor image reproducible across available GPU backends.

Each screenshot uses a fresh browser context, reduced motion and system light or
dark appearance. Phone landing: 430×932 CSS pixels at 2×, with coarse input. Desktop
editor: 1440×900 at 1×. The editor activates the actual **Load sample** action and
waits for visible Air fields, the ready paginated template, decoded images and
local fonts. A capture-only random seed and fixed 21 October 2026 date keep the
built-in synthetic sample reproducible. Registration is disabled only in these
isolated capture contexts so an offline-ready notice cannot obscure the UI.
No personal profile, saved user draft, markup replacement or hidden controls are
used. Browser/resource failures stop generation.

The PWA manifest describes all four screenshots by content and appearance; it
cannot select images by theme. README’s picture element selects the dark editor
image when requested, with a light fallback. Install theme/background use Air’s
light page `#fafbfc`; HTML declares `#fafbfc` / `#101216` system-theme chrome.
The product’s emerald logo and user-selected document colours are unchanged.
Social and store images stay outside the offline application-shell precache.

## Verification

Inspect all five generated images at native and card scale. Check text, mark,
real controls, document rendering and image edges. Confirm dimensions and labels
in the built manifest, canonical social URL/alt text, correct README theme source,
image decode success and absence from the precache. Repeat generation into a
scratch directory and compare pixel hashes. Inspect actual production landing and
editor in desktop/laptop/tablet/phone light/dark states; generated assets alone
do not certify the full application or physical devices.

Run the required checks and complete production browser/template suite before a
bounded commit. Current proof is recorded in
[the preview asset evidence](air/evidence/preview-assets-2026-10-21.json).

To regenerate unchanged launcher assets, use `vp run generate-icons`. The July
2026 launcher inspection confirmed full-glyph clearance under circle,
rounded-square, squircle and teardrop masks; it is historical icon evidence, not
acceptance of the retired Workbench screenshots. Old `iPhone.png` / `iPad.png`
captures and their generation assumptions are retired.
