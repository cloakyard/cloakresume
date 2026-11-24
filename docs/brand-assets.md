# Brand and install assets

CloakResume’s previews follow [Cloakyard Air](../DESIGN.md). PWA and README images
capture actual production landing/editor states. The 1200×630 social card uses
[artwork/social.json](../artwork/social.json), the shared Air template, the canonical
mark and the static landing résumé. It shares the family’s typography and spacing;
see [the portable workflow](air/social-previews.md).

## Sources and consumers

| Asset                                         |     Size | Consumer                                |
| --------------------------------------------- | -------: | --------------------------------------- |
| `public/cloakresume-mark.svg`                 |    64×64 | Header and social card                  |
| `public/icons/cloakresume-app-icon.svg`       |    64×64 | Full-bleed launcher source              |
| `public/icons/og-image.png`                   | 1200×630 | Open Graph and X/Twitter metadata       |
| `public/screenshots/landing-narrow-light.png` | 860×1864 | Narrow PWA screenshot, light            |
| `public/screenshots/landing-narrow-dark.png`  | 860×1864 | Narrow PWA screenshot, dark             |
| `public/screenshots/editor-wide-light.png`    | 1440×900 | Wide PWA and README fallback            |
| `public/screenshots/editor-wide-dark.png`     | 1440×900 | Wide PWA and dark README picture source |
| `public/icons/pwa-64x64.png`                  |    64×64 | Small PWA launcher                      |
| `public/icons/pwa-192x192.png`                |  192×192 | Standard PWA launcher                   |
| `public/icons/pwa-512x512.png`                |  512×512 | High-resolution PWA launcher            |
| `public/icons/maskable-icon-512x512.png`      |  512×512 | Maskable launcher                       |
| `public/icons/apple-touch-icon.png`           |  180×180 | iOS launcher                            |
| `public/icons/safari-pinned-tab.svg`          |      SVG | Monochrome Safari pinned tab            |

The 64×64 circular mark shows a white portrait card with three equal index tabs on green enamel.
The 16×16 drawing in `public/icons/favicon.svg` serves browser tabs. The full-bleed launcher keeps the complete
glyph inside the central 80% maskable safe circle. Launcher PNGs remain RGB;
`logo.svg` is a compatibility copy of the launcher master.
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
asset root for screenshot comparisons. The OG renderer starts its own temporary
loopback server for the production landing; `AIR_SOCIAL_OUTPUT` writes a comparison
card. It rejects external requests and uses a static reduced-motion pose.

Each screenshot uses a fresh browser context, reduced motion and system light or
dark appearance. Phone landing: 430×932 CSS pixels at 2×, with coarse input. Desktop
editor: 1440×900 at 1×. The editor activates the actual **Load sample** action and
waits for visible Air fields, the ready paginated template, decoded images and
local fonts. A capture-only random seed and fixed 21 October 2026 date keep the
built-in synthetic sample reproducible. Registration is disabled only in these
isolated capture contexts so an offline-ready notice cannot obscure the UI.
Capture waits for repeated identical pixel frames after font/layout readiness so
fresh dark-theme glyphs are painted before the preview is saved.
No personal profile, saved user draft, markup replacement or hidden controls are
used. Browser/resource failures stop generation.

The PWA manifest describes all four screenshots by content and appearance; it
cannot select images by theme. README’s picture element selects the dark editor
image when requested, with a light fallback. Install theme/background use Air’s
light page `#fafbfc`; HTML declares `#fafbfc` / `#101216` system-theme chrome.
The emerald disc belongs to the app identity. Résumé exports use the document colour selected in the editor.
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
bounded commit. The November index-card update passed the production suite (375 tests), including checks for equal tab geometry and maskable launcher clearance. The [October preview capture record](air/evidence/preview-assets-2026-10-21.json) documents the original capture setup.

To regenerate the launcher assets, use `vp run generate-icons`. The July
2026 launcher inspection confirmed full-glyph clearance under circle,
rounded-square, squircle and teardrop masks; it is historical icon evidence, not
acceptance of the retired Workbench screenshots. Old `iPhone.png` / `iPad.png`
captures and their generation assumptions are retired.
