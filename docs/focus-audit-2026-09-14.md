# Editor focus and visual consistency audit — 14 September 2026

## Fixes

- Contact values now use the shared input styling, with enough inset space for the complete focus outline. Compact contact-type selectors and responsive inline/stacked rows remain in place.
- Text fields, textareas, selectors, picker triggers, and keyboard-focused actions use a consistent two-pixel emerald outline. Removed competing shadows and kept the outline colour stable during colour transitions.
- Validation and writing-warning borders retain their status colour during hover and focus. Validation errors take precedence when both states apply.
- Rich-text groups and logo fields now highlight their labels consistently with other fields.
- Logo and year grids reserve space for focus outlines at their scroll boundaries. Template cards clip their preview content without clipping the selection button's outline.
- Contact and logo-search text entry uses the shared mobile input sizing. Spellchecking remains enabled for locations and disabled for contact addresses and links.

## Verification

Verified in local Chrome against the production build, using isolated sample drafts and light/dark system appearance.

| Coverage                                                                                                        | Result                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| All 13 editor sections at 320, 375, 414, 768, 1024, 1280, 1920, and 2560 px, in both appearances                | 208 section cases; 2,694 focused-control checks; no clipped controls or extra focus shadows |
| All 17 templates × A4/Letter × light/dark × 320/768/1280/1920 px                                                | 272 layout cases; no overlapping controls or missing contacts                               |
| Live contact edits in every template and paper size                                                             | 34 preview/persistence checks passed                                                        |
| Rich text, logo/date pickers, proficiency selector, keyboard return focus, and ten list-section empty states    | 84 state checks passed                                                                      |
| First, last, and edge controls in logo/year grids and template selection at 320/375/1920 px in both appearances | 48 checks passed after fixing clipped grid and card outlines                                |
| Repeated checkbox and date-clear focus checks                                                                   | 40 checks passed                                                                            |

Four additional checks used the real writing scan to verify that warning borders remain visible while editing, at 375 and 1920 px in both appearances.

Reviewed section screenshots, representative control crops, every distinct contact-row rendering from the template matrix, all 17 template previews in A4/dark and Letter/light, and popup/empty-state screenshots. No remaining visual inconsistencies were found in this coverage.

All 226 tests across eight test files pass on the final production build. Six browser regression cases protect complete Contact outlines, consistent ring styling, visible validation, and scrolling picker edges. Run `CLOAKRESUME_BROWSER_BUILD=production vp test` after `vp run build`; `vp check` also passes.

This audit covers editor chrome and template previews. The earlier PDF and pagination audits remain documented separately.
