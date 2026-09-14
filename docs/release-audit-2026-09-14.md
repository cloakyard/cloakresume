# Editor, stats templates, and pagination verification

Verified on 14 September 2026 using local Chrome and the real application. This change includes the four-column stats fix from PR #32.

The subsequent [template container audit](template-container-audit-2026-09-14.md) records the Bauhaus preview reproduction, additional wrapping/stat-pair corrections, and the latest 217-test suite and 170-scenario production matrix.

## Delivered behavior

- The desktop editor remains 328px wide below 1280px. At larger widths it grows from 384px to 736px, giving spare preview space to text entry while keeping a full-size A4/Letter preview where space permits. At 1920px, the text field grows from approximately 343px to 695px.
- **Classic Impact** retains a tinted Classic Sidebar-style facts column and places stats below the professional summary. **Ledger** uses a serif masthead, ruled sections, and a full-width stats grid below the summary. Both cap rows at four stats and keep incomplete rows aligned.
- All 17 templates use measured pagination. Oversized paragraphs, bullets, and grids split at rendered line boundaries, preserving formatting, links, and column positions. Project headings stay with their content; short factual records and stat value/label pairs stay together. Continuation labels identify the continued section and reserve page space. Every page keeps the selected paper dimensions; cropping is not used to conceal overflow.
- The feature audit corrected draft recovery, import normalization, stable long-text editing, current-job dates, photo loading, writing-review lifecycle, ATS text coverage, nested dialogs, and narrow-screen controls. Closing dialogs preserve focus when the user has already started editing another field. Details and behavior coverage are in [the feature audit](feature-audit-2026-09-14.md).

## Visual and interaction coverage

| Area                  | Executed checks                                                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wide editor           | Measured and inspected at 1024, 1280, 1440, 1600, 1920, and 2560px. The rail, editor, and proof remain contained.                                                                                                                                  |
| Every editor section  | All 13 sections at 320, 768, and 1920px; start and end of each scrolling form inspected. Checked field naming, document/panel overflow, and visible control bounds.                                                                                |
| Landing and theme     | Light/dark landing at 320, 375, 414, 768, 1280, and 1920px, plus light/dark editor states.                                                                                                                                                         |
| Document controls     | Selected both new templates, changed A4 to Letter and accent colour, used zoom in/out/reset/fit, and checked persisted settings at 320, 375, 414, 768, 1280, 1440, and 1920px.                                                                     |
| Overlays              | Gallery, colour, logo, dates, ATS Overview/Keywords/Insights/Parse, mobile Options/section picker/full preview, and desktop privacy dialog. Checked viewport containment, dismissal, and rendered content.                                         |
| Templates             | All 17 with normal and oversized content on A4 and Letter: 68 scenarios. Measured page and column text bounds and counted sentinel text to detect loss or duplication. Inspected all normal first pages, stress continuations, and exported pages. |
| New stats layouts     | Counts 0, 1, 3, 4, 5, 8, 9, and 17; long values/labels on both paper sizes; summary → stats ordering and all required sections.                                                                                                                    |
| Pagination edge cases | Mixed inline formatting and links, uneven grids, long list items, heading chains, fractional heights, preview zoom, long metadata, and oversized content.                                                                                          |
| Files and analysis    | Real JSON downloads and reload/import, photos, storage/download failures, local writing engine with retry and concurrent edits, all list CRUD/reorder flows, and mobile review navigation.                                                         |

## Validation

- `vp check`: all 133 files formatted; no warnings, lint errors, or type errors in 108 checked files.
- `vp test`: **183 tests passed across seven files**, including 43 editor browser regressions, 23 pagination browser regressions, and 24 new-template tests.
- `CLOAKRESUME_BROWSER_BUILD=production vp test run tests/editor-browser.spec.ts`: **43 production-browser regressions passed** against the final build.
- `vp run build`: TypeScript and the production/PWA build passed. The existing large PDF bundle advisory remains.
- Final template matrices: **136 scenarios and 1,528 rendered pages**, covering every template on A4 and Letter with normal documents, oversized prose, 50 multiline stats, dense sidebar records, and long unbroken text. No glyph-bound violations, lost/duplicated checked content, split stat pairs, export-guard failures, or runtime errors.

- Actual PDF downloads: **19 exports and 112 pages** (all 17 templates on A4, plus both new templates on Letter). Every page count and paper dimension matched the preview. All 6,469 literal field/item checks, 133 contact entries, and 90 stat value/label spacing checks passed; the PDFs contain 140 link annotations. No runtime or export errors occurred.
- PDF visual review covered all 112 pages. After the final heading/record pagination corrections, all 19 changed pages were inspected again; the other 93 pages were pixel-identical to the reviewed baseline. No cutoff, missing content, or trailing project subheadings were observed in these documents.

The closing-dialog focus regression reproduced the failure before the fix. After the fix, it passed alongside the mobile ATS-to-JD and nested-dialog tests in development and in three repeated production runs, then passed in both final full suites.

## Scope of the evidence

Quick stats remain a feature of the eight supporting templates; the editor describes that distinction. The other nine templates retain their existing section choices. The two new designs always include nonempty stats beneath the summary.

The audit uses Chrome, not a cross-browser certification. ATS review is a local approximation; no third-party ATS service was used. Existing single-draft storage does not resolve simultaneous edits from different tabs. These checks provide regression coverage for the tested cases, not a guarantee for every possible document or browser.
