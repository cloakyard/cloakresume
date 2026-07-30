# Brand and install assets

CloakResume derives its social and install artwork from real product states. The Open Graph and
phone captures show the résumé entry workbench; the tablet capture loads the sample résumé and
shows the complete editor/document-proof workbench. This keeps every preview aligned with the
88rem frame, 40px mark, Archivo and JetBrains Mono typography, Emerald `#047857` accent, and
CloakPDF-family geometry defined in [`../DESIGN.md`](../DESIGN.md).

The canonical vector is `public/cloakresume-mark.svg`. It follows the Cloakyard family’s 64×64
circular construction, diameter-42 glyph keyline, 3px white stroke, highlight position, and inner
rim. Its emerald field and profile-led shield remain specific to CloakResume. The dedicated
`public/icons/cloakresume-app-icon.svg` uses the same glyph on a full-bleed field so OS launcher
masks never expose transparent corners. Its complete shield and résumé glyph stay inside the W3C
maskable safe-zone circle (40% radius), and launcher PNGs remain full-colour RGB so gradients and
translucent rules do not acquire indexed-palette stippling. `favicon.svg` and `logo.svg` remain
compatibility copies for older saved links; new product references use the canonical filename.

## Canonical assets

| Asset                                    |      Size | Consumer                                |
| ---------------------------------------- | --------: | --------------------------------------- |
| `public/cloakresume-mark.svg`            |     64×64 | Header and SVG favicon                  |
| `public/icons/cloakresume-app-icon.svg`  |     64×64 | Full-bleed launcher-generation source   |
| `public/icons/og-image.png`              |  1200×630 | Open Graph and X/Twitter metadata       |
| `public/screenshots/iPhone.png`          | 1290×2796 | Narrow entry-workbench screenshot       |
| `public/screenshots/iPad.png`            | 2732×2048 | Wide editor/proof screenshot and README |
| `public/icons/apple-touch-icon.png`      |   180×180 | iOS launcher                            |
| `public/icons/pwa-192x192.png`           |   192×192 | Standard PWA launcher                   |
| `public/icons/pwa-512x512.png`           |   512×512 | High-resolution PWA launcher            |
| `public/icons/maskable-icon-512x512.png` |   512×512 | Maskable PWA launcher                   |
| `public/icons/safari-pinned-tab.svg`     |       SVG | Monochrome Safari pinned tab            |

## Capture states

| Asset      | Browser viewport | Pixel ratio | Product state                                      |
| ---------- | ---------------- | ----------: | -------------------------------------------------- |
| Open Graph | 1200×630         |           1 | Landing declaration and top of the start workbench |
| Phone PWA  | 430×932          |           3 | Landing and entry workbench                        |
| Tablet PWA | 1366×1024        |           2 | Loaded sample, editor, and live document proof     |

The phone and tablet viewport/pixel-ratio pairs produce the 1290×2796 and 2732×2048
manifest images respectively. The tablet script activates **Load sample** and waits
for both the editor field and `.resume-root` before capture, so it cannot silently
fall back to the landing state. Its capture-only random seed makes the generated
sample reproducible without changing the varied sample data real users receive.

## Regenerate

```bash
vp run generate-icons
vp run generate-og
vp run generate-screenshots
```

Each command starts a temporary Vite+ server, opens the real app in headless Chrome with light mode
and reduced motion, waits for local fonts, and captures the exact viewport. Set `CHROME_PATH` when
Chrome or Chromium is not installed in the standard macOS location.

An already-running build can be captured without starting another server:

```bash
OG_URL=http://127.0.0.1:5173 vp run generate-og
SCREENSHOT_URL=http://127.0.0.1:5173 vp run generate-screenshots
```

## Verification

After regeneration:

1. Confirm the dimensions in the table above. Open Graph metadata in [`../index.html`](../index.html)
   must remain 1200×630 and use an accurate alt description.
2. Inspect every image at native resolution and at its likely card/store scale. The
   generated product state intentionally uses the light colour scheme.
3. Confirm the header mark is 40px in CSS pixels. Confirm the entry workbench uses the responsive
   frame gutter and the tablet editor preserves its rail, panel, and proof-stage geometry.
4. Confirm no browser chrome, animation frame, cursor, focus ring, or unintended local draft appears.
5. Confirm [`../vite.config.ts`](../vite.config.ts) labels the screenshots by content, uses `orientation:
"any"`, and excludes social/store captures from the application-shell precache.
6. Run `vp build`, install the generated PWA locally, and inspect the install surface.
7. For Android, mask `maskable-icon-512x512.png` to the central 80% circle and confirm the entire
   shield and résumé page remain visible. Also inspect circle, rounded-square, squircle, and
   teardrop launcher masks at 64px and native resolution.

The assets are intentionally live product captures rather than separate illustrations. A second
visual system would drift from CloakPDF and from the application over time.

## Recorded inspection — 29 July 2026

The regenerated files were decoded and confirmed at 1200×630, 1290×2796, and
2732×2048. Native-resolution inspection confirmed the refined 40px circular mark,
clear separation between the résumé text block and shield, Emerald identity,
Archivo/JetBrains Mono typography, responsive gutters, and clean edges without browser
chrome, a cursor, a focus ring, or an unintended saved draft. The 64px, 192px, 512px,
maskable, Apple touch, and ICO launcher outputs were also regenerated from the
full-bleed app-icon companion and checked for safe glyph clearance. The Open Graph
image shows the landing declaration/start workflow; the phone image shows the entry
workbench; the tablet image shows the loaded editor and document proof. `index.html`
points both social-card formats at the 1200×630 asset with matching alt text, while the
PWA manifest declares the phone and tablet files with their exact dimensions, form
factors, and content-based labels.

## Recorded Android inspection — 30 July 2026

The dedicated 512px maskable asset was cropped to the specification’s minimum safe
circle and previewed under circle, rounded-square, squircle, and teardrop launcher
masks. The complete shield, profile dot, and four résumé rules remain visible with
clear breathing room. The generic and maskable manifest entries use opaque,
full-bleed colour fields, and all generated launcher PNGs use true-colour RGB rather
than an indexed palette, eliminating dithering in the translucent résumé details.
