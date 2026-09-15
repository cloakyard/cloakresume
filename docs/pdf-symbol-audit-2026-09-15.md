# PDF symbol spacing audit

Verified in Chrome on macOS on 15 September 2026.

## Root cause and correction

The PDF rasterizer measured text using browser font features, then painted it with a Canvas font shorthand that discarded numeric variants and explicit OpenType features. For Classic Impact's `25+`, the browser gave `25` a width of 30.828 CSS pixels, while Canvas painted it at 32.098 pixels. The plus sign was positioned using the narrower measurement, creating the reported overlap. `120%` also showed incorrect spacing.

The shared exporter now creates temporary font faces carrying the same numeric variants and feature settings as the preview. These faces reuse the bundled font sources, weights, styles, and Unicode ranges and finish loading before rasterization. Only the export clone uses them; the live document and its pagination remain unchanged.

The previous page/container boundary checks did not detect differences in glyph spacing inside a text run. The new browser regressions exercise the actual Export PDF action and compare Canvas glyph and digit-run advances with independent browser measurements. They cover all eight templates that display Quick Stats and check `25+`, `120%`, `6×`, `−10%`, `$25k`, `€5k`, `±3`, and `1/2`. Temporarily removing the fix made the Classic Impact test fail on the original 1.2695px width mismatch.

## Export and visual verification

- Exported **all 17 templates on A4 and Letter: 34 PDFs, 65 pages** from the production build through the app's Export PDF action.
- Rendered and visually inspected **every page** with Poppler, including all continuation pages. No overlapping symbols, clipped text, or missing visible sections were found.
- Verified the supplied `25+`, `120%`, and `6×` examples in stats, alongside negative numbers, currency signs, and plus/minus signs. All templates also included these symbols in the summary, including the nine layouts that do not display Quick Stats.
- Reviewed mixed bold, italic, underline, and code formatting, manual title breaks, and the Professional language proficiency in the same exported documents.
- Every PDF page count matched its preview. No browser or export errors occurred.

## Final validation

- **288 tests passed across eight files**, with no skipped tests, against the production build. This includes all eight PDF symbol regressions and the 170-scenario template/content/paper-size matrix.
- `vp check` passed formatting, lint, and type checks. `vp run build` passed with the existing chunk-size advisory.
- `vp pm audit` reported no known vulnerabilities.
- The export manifest accounts for all 128 stats across the eight supporting templates and two paper sizes.

## Reproduction

```sh
vp install
vp check
vp pm audit
vp run build
CLOAKRESUME_BROWSER_BUILD=production vp test
```

The browser suites require Chrome/Chromium; set `CHROME_PATH` for a nonstandard installation. Local PDF renders, preview screenshots, the export manifest, and test logs for this review are under `/tmp/cloak-pdf-symbols`. These results cover the tested Chrome exports and fixtures, not every possible browser or font.
