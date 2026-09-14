# Feature reliability audit — 14 September 2026

This audit exercises editor behavior and document state in the working tree for the wider editor and new stats templates. The companion design and pagination audits cover visual layout and page boundaries.

## Corrections

- **Draft recovery:** pending edits flush before reload, page hide, or navigation away. Storage failures produce a recoverable notice and advise saving a JSON copy. Photo, logo, custom-label, and job-description-only drafts remain resumable.
- **Import boundaries:** malformed nested rows and fields are normalized, missing or duplicate IDs are repaired, removed settings fall back safely, and inherited object properties cannot be used as template IDs. Invalid JSON leaves the current document intact.
- **Text editing:** auto-growing textareas measure a hidden copy so typing does not collapse the live field or move the editor scroll position. Line breaks, blank paragraphs, spaces, multiline formatting, and underscores in identifiers survive rendering and save/load.
- **Dates and photos:** current jobs have an explicit checkbox that stores `Present` and disables the end picker. Photo loading enforces JPG/PNG and the advertised 2 MB limit, checks image decoding, cancels obsolete uploads, and preserves edits made while a photo loads.
- **Writing analysis:** results belong to the document revision that was scanned. Failed engine downloads can retry, short completed scans explain the 20-word threshold, and an edit during the first engine download is analyzed after the engine becomes ready. Custom-section prose is included.
- **ATS review:** keyword counts use the same document text as the scoring engine, including custom sections, stats, and extras. The text preview includes every document section and is labeled as a local approximation. The mobile link to the JD editor returns from full preview to editing.
- **Keyboard and narrow screens:** only the topmost modal handles Escape and Tab when a notice overlays another dialog. Closing a dialog preserves an editor field the user has already focused, so delayed focus restoration cannot interrupt typing. Contact cards at 320px keep reorder and remove controls within their card bounds, and ATS headings wrap long captions without clipping.
- **Stats and export actions:** extras can be added to an empty document without creating a dummy stat. Repeated PDF clicks are ignored while an export is running, and the toolbar communicates that state. The separate pagination work owns PDF boundary checks.

## Behavior coverage

| Feature                           | Verified behavior                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile                           | Fast typing; focus/caret/scroll retention; logo search/select/clear; valid image upload; oversized/corrupt image rejection; preserving edits during upload       |
| Contact                           | Add/edit/reorder/two-step removal; common phone formats; all action bounds and removal at 320px                                                                  |
| Experience                        | Role add/edit/reorder/delete; nested bullet dragging leaves parent roles in place; current-job toggle and saved `Present` state                                  |
| Skills                            | Add/edit/reorder/delete groups; multiline values covered by shared field and template rendering tests                                                            |
| Projects                          | Add/edit/reorder/delete; description and role text focus/caret/scroll retention on desktop and mobile                                                            |
| Education                         | Add/edit/reorder/delete; choose year/month; clear date; long detail containment                                                                                  |
| Certifications, awards, languages | Add/edit/reorder/two-step deletion for each section                                                                                                              |
| Interests and tools               | Custom headings; free comma entry; parsed lists and labels survive reload                                                                                        |
| Quick stats and extras            | Add/edit/reorder/delete stats; extras-only creation and persistence                                                                                              |
| Custom sections                   | Add/edit/reorder/delete; nested prose editing and complete analysis/text preview                                                                                 |
| Target JD                         | JD-only draft recovery; mobile ATS-to-editor jump; edits saved with document settings                                                                            |
| Save, load, New                   | Real JSON download; complete imported settings; malformed file recovery; canceled New preserves work                                                             |
| Autosave                          | Immediate reload before debounce; storage failure notice; latest draft flushed on page lifecycle events                                                          |
| Review                            | Real local writing engine; failed download retry; edits during engine download; all-section keyword counting; complete text preview; no stale report after edits |
| Dialogs                           | Nested notice dismisses alone; Tab remains in the active dialog; gallery focus returns to its opener unless the user has selected another field during the exit  |
| Text rendering                    | Multiline and inline formatting in every registered template; partial date ranges; palette text contrast                                                         |

All browser cases use an isolated Vite cache, run in isolated browser contexts and fail on uncaught runtime errors. They use real Chrome with keyboard, pointer, file, drag, and download interactions; fault injection is limited to controlled storage, file-loading, and writing-engine download failures. The browser suite can also target the production build with `CLOAKRESUME_BROWSER_BUILD=production`.

## Validation commands

Feature verification passed: **43 Chrome browser regressions** and **67 data-boundary, analysis, and rich-text/template tests**. The owned source and tests also pass formatting, lint, and type checks.

- `vp check`
- `vp test run tests/data-boundaries.spec.ts tests/rich-text.spec.tsx tests/editor-browser.spec.ts`
- `vp run build`
- `CLOAKRESUME_BROWSER_BUILD=production vp test run tests/editor-browser.spec.ts`

The final combined audit records the full-suite and production results. Chrome checks do not establish Safari/Firefox behavior or third-party ATS compatibility. Simultaneous editing in multiple tabs still shares one local draft; conflict resolution is outside this change.
