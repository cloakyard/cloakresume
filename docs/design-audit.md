# CloakResume design audit

**Audit date:** 22 July 2026

**Design contract:** [CloakResume Design System 2.0](../DESIGN.md)

**Runtime tokens:** [tokens.css](../tokens.css)

**Portable tokens:** [tokens.json](../tokens.json)

## Result

All 71 TSX files in `src/` were examined. No application route, common component,
editor section, review pane, résumé output, or TSX support module was omitted.

The active product chrome now follows the CloakPDF-family language with CloakResume
Emerald `#047857`: Archivo and JetBrains Mono, cool paper, slate ink, one-pixel rules,
6–8px geometry, solid overlays, restrained motion, and one 88rem content frame. A
user-selected résumé colour is restricted to the rendered résumé and its document
controls; it does not replace the application brand.

The 15 résumé templates are deliberately exempt from product-chrome styling. They are
user outputs, so their typography, colour, layout, and print character remain
template-specific. The exemption is a scope boundary, not an audit omission: every
template and its pagination helpers was reviewed for complete data coverage,
selectable text, semantic reading order, pagination, A4/Letter fidelity, and preview
containment.

## Standards used

1. [DESIGN.md](../DESIGN.md) for family identity, geometry, component behavior,
   responsive rules, accessibility, and the output-template boundary.
2. [tokens.css](../tokens.css) for every normative runtime value.
3. The sibling [CloakPDF](https://github.com/cloakyard/cloakpdf) implementation for
   shared visual DNA, not for CloakPDF's blue accent or PDF-specific interaction.
4. [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
   for semantics, control naming, focus visibility, touch targets, reduced motion,
   forms, dialogs, popovers, images, and content overflow.
5. React performance guidance for route-level loading, render cost, stable effects,
   and avoiding unnecessary work in the landing and template gallery.

## App-wide resolution matrix

| Area                | Audit finding                                                                                                   | Required resolution                                                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand ownership     | The saved résumé palette could leak into application chrome.                                                    | Product chrome is fixed to Emerald `#047857`; the selected palette is output-only.                                                                                                                               |
| Responsive editor   | The phone layout previously swapped the editor and preview.                                                     | The open editing mode preserves the specified 50:50 editor/canvas split; preview mode remains available.                                                                                                         |
| Overlay shell       | Dialogs and sheets implemented focus, escape, scroll, and geometry inconsistently.                              | One modal contract owns initial focus, containment, return, Escape, body lock, semantic naming, token z-index, 36rem/68.75rem widths, and 92dvh mobile sheets.                                                   |
| Forms               | Several fields had no stable name, autocomplete intent, label association, or hint relationship.                | Shared fields expose names, explicit labels, `aria-describedby`, autocomplete intent, and reserved validation space.                                                                                             |
| Pointer parity      | The colour wheel could be operated only with a pointer.                                                         | The colour control exposes slider semantics, keyboard adjustment, and a visible focus state.                                                                                                                     |
| Interactive nesting | Live previews and logo controls could place controls inside controls.                                           | Card actions, links, and clear controls are sibling interactions with separate accessible names.                                                                                                                 |
| Touch and focus     | Several compact actions fell below practical target sizes or used generic focus shadows.                        | Common actions use at least a 40px visual area, 44px where touch-dominant, and tokenized `:focus-visible` treatment.                                                                                             |
| Geometry            | Headers, panels, popovers, and sheets carried local width and edge values.                                      | Shared 72/64px headers, 72px rail, responsive 328/384px panel, exact 40px desktop toolbar controls, exact 44px mobile segments, 40px mark, 16px popover edge, and common overlay widths are authoritative.       |
| Surface language    | Legacy glass, blur, Grainient, raw shadow, and decorative-gradient chrome remained in retired or fallback code. | Active chrome is flat and solid. Unreachable visual experiments, unused selectors, and stale compatibility aliases were removed. Functional colour controls and template-output artwork remain valid exceptions. |
| Motion              | Broad transitions and animated dimensions could destabilize UI.                                                 | Transitions name properties, use shared timing/easing, preserve fixed editor/dialog geometry, and respect reduced motion.                                                                                        |
| ATS review          | Tabs, progress, headings, dates, and busy states needed stronger semantics.                                     | Named tab semantics, keyboard movement, real progress semantics, locale-aware dates, stable geometry, and local-processing status are required.                                                                  |
| Loading cost        | Template and review work could be pulled into the initial route or repeated unnecessarily.                      | ATS review, PDF export, Harper, and all 15 résumé templates use explicit lazy boundaries; landing does not fetch template implementations, and gallery work begins only on visible user intent.                  |
| Metadata and PWA    | Social art, manifest labels, orientation, and precache scope described an older visual system.                  | A live 1200×630 landing capture, regenerated PWA screenshots, content-based labels, `orientation: any`, and a bounded app-shell cache are canonical.                                                             |
| Documentation       | README, security claims, template guidance, and archived design notes contradicted the application.             | Current product copy, TypeScript 7/Vite+ workflow, accurate local-first boundary, one canonical design contract, and real repository links replace stale text.                                                   |

## Complete TSX inventory

Status key:

- **Aligned** — active product chrome governed by the shared family system.
- **Support** — non-visual or rendering support audited against the same semantics and
  performance contract.
- **Output** — résumé-document rendering audited under the explicit output exemption.

|   # | File                                              | Status  | Audit scope                                                                                                                           |
| --: | ------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | `src/App.tsx`                                     | Aligned | Root workflow, fixed brand boundary, persistence, route-level review, and overlay composition.                                        |
|   2 | `src/components/AtsReviewModal.tsx`               | Aligned | Wide modal shell, focus lifecycle, tabs, headings, progress, locale-aware metadata, and busy/error states.                            |
|   3 | `src/components/BottomSheet.tsx`                  | Aligned | Shared 92dvh sheet geometry, title order, focus containment, escape, scroll lock, and safe area.                                      |
|   4 | `src/components/BrandLogo.tsx`                    | Aligned | Canonical 40px mark, 0.6rem lockup gap, exact CloakPDF Archivo 800 metrics, accessible home label, and no independent distortion.     |
|   5 | `src/components/CloakWorkbenchLanding.tsx`        | Aligned | N1b header, 88rem frame, real start/load instrument, ledgers, local receipt, and Ft5 footer.                                          |
|   6 | `src/components/ColorPickerContent.tsx`           | Aligned | Emerald-aware document control, keyboard/pointer parity, slider semantics, focus, and input naming.                                   |
|   7 | `src/components/ConfirmDialog.tsx`                | Aligned | Standard dialog width, destructive-action hierarchy, focus lifecycle, and stable action order.                                        |
|   8 | `src/components/DragList.tsx`                     | Aligned | Reorder handles, practical targets, keyboard names, drag state, and destructive-action affordance.                                    |
|   9 | `src/components/Editor.tsx`                       | Aligned | Section composition, reading order, empty state, and shared form/control use.                                                         |
|  10 | `src/components/ErrorBoundary.tsx`                | Aligned | Product-family failure surface, named dialog/region behavior, recovery action, and bounded width.                                     |
|  11 | `src/components/FormatScope.tsx`                  | Aligned | Inline formatting actions, pressed state, icon labels, focus, and target size.                                                        |
|  12 | `src/components/GithubIcon.tsx`                   | Support | Decorative/labelled icon behavior, inherited colour, and stable vector geometry.                                                      |
|  13 | `src/components/Layout.tsx`                       | Aligned | 64px editor header, 72px rail, token-driven 328/384px panel, 50:50 mobile proof/workspace split, inline picker, and one editor h1.    |
|  14 | `src/components/LogoPicker.tsx`                   | Aligned | Popover safe edge, search naming, logo choice semantics, separated clear action, and focus return.                                    |
|  15 | `src/components/MonthYearField.tsx`               | Aligned | Associated label, named date controls, keyboard navigation, visual-viewport-safe placement, focus return, and locale-neutral storage. |
|  16 | `src/components/OrientationLock.tsx`              | Aligned | System-overlay layer, clear rotation instruction, reduced motion, and no interference with document output.                           |
|  17 | `src/components/PaginatedCanvas.tsx`              | Output  | Measurement, deterministic A4/Letter pages, continuation behavior, no clipping, and print fidelity.                                   |
|  18 | `src/components/PaperSizeToggle.tsx`              | Aligned | Named A4/Letter selection, pressed state, exact 40px toolbar box, and touch-size overflow variant.                                    |
|  19 | `src/components/Preview.tsx`                      | Aligned | Persistent paper stage, zoom controls, names/targets, output isolation, and responsive overflow.                                      |
|  20 | `src/components/PrivacyPolicyModal.tsx`           | Aligned | Standard reading width, accurate privacy copy, heading order, focus lifecycle, and overscroll containment.                            |
|  21 | `src/components/ReloadPrompt.tsx`                 | Aligned | Toast live-region semantics, update/offline states, token layer, and safe action placement.                                           |
|  22 | `src/components/RichTextArea.tsx`                 | Aligned | Explicit control name, formatting semantics, reserved issue space, and bounded measurement work.                                      |
|  23 | `src/components/SectionPanel.tsx`                 | Aligned | Responsive 328/384px desktop editor, 50% phone pane, close-to-picker action, title hierarchy, internal scroll, and safe area.         |
|  24 | `src/components/SectionRail.tsx`                  | Aligned | 72px rail and inline mobile picker, icon labels, selected state beyond colour, keyboard focus, and scroll containment.                |
|  25 | `src/components/TemplateModal.tsx`                | Aligned | Allowed wide-gallery shell, search/filter semantics, bounded previews, and non-nested selection controls.                             |
|  26 | `src/components/TemplatePreview.tsx`              | Support | Preview containment, inert/non-interactive document rendering, scale calculation, and output isolation.                               |
|  27 | `src/components/ToolbarActions.tsx`               | Aligned | Primary/secondary action hierarchy, icon names, target size, overflow behavior, and fixed brand chrome.                               |
|  28 | `src/components/ToolbarCenter.tsx`                | Aligned | Named colour popover, placement, 16px safe edge, focus return, and document-colour boundary.                                          |
|  29 | `src/components/ToolbarOverflow.tsx`              | Aligned | Correct dialog/popover semantics, separated nested panels, solid surface, and predictable dismissal.                                  |
|  30 | `src/components/ViewSegment.tsx`                  | Aligned | Edit/preview semantics, selected state, exact 44px outer box and 44px targets, and stable header geometry.                            |
|  31 | `src/components/ats/AtsCard.tsx`                  | Aligned | Shared review surface, heading level, metadata hierarchy, flat rules, and responsive content.                                         |
|  32 | `src/components/ats/AtsInsightsPane.tsx`          | Aligned | Issue/win hierarchy, status labels beyond colour, empty state, and readable long content.                                             |
|  33 | `src/components/ats/AtsKeywordsPane.tsx`          | Aligned | Keyword groups, coverage progress semantics, wrapping, and no animated width layout shift.                                            |
|  34 | `src/components/ats/AtsOverviewPane.tsx`          | Aligned | Score hierarchy, semantic progress, explanatory copy, and stable responsive layout.                                                   |
|  35 | `src/components/ats/AtsParsePreview.tsx`          | Aligned | Named reading preview, selectable text, preserved whitespace, and bounded overflow.                                                   |
|  36 | `src/components/ats/AtsScoreRing.tsx`             | Aligned | Text alternative, score/value semantics, fixed geometry, and non-colour status communication.                                         |
|  37 | `src/components/editor/AwardsSection.tsx`         | Aligned | Shared fields/cards, reorder/delete actions, labels, hints, and long-content behavior.                                                |
|  38 | `src/components/editor/CertificationsSection.tsx` | Aligned | Shared fields/cards, URL/year naming, reorder/delete actions, and validation stability.                                               |
|  39 | `src/components/editor/ContactSection.tsx`        | Aligned | Contact labels, autocomplete intent, add/remove behavior, URL naming, and issue associations.                                         |
|  40 | `src/components/editor/CustomSection.tsx`         | Aligned | User-defined headings/bullets, rich-text names, add/remove actions, and content wrapping.                                             |
|  41 | `src/components/editor/EducationSection.tsx`      | Aligned | School/degree/date associations, repeated-field names, delete action, and mobile layout.                                              |
|  42 | `src/components/editor/ExperienceSection.tsx`     | Aligned | Employer/role/date labels, rich-text bullets, add/remove/reorder targets, and error associations.                                     |
|  43 | `src/components/editor/InterestsSection.tsx`      | Aligned | Token entry, labels, keyboard add/remove, wrapping, and empty state.                                                                  |
|  44 | `src/components/editor/JdSection.tsx`             | Aligned | Job-description name, local-processing disclosure, long-text behavior, and review action.                                             |
|  45 | `src/components/editor/LanguagesSection.tsx`      | Aligned | Language/proficiency labels, repeated fields, add/remove behavior, and validation stability.                                          |
|  46 | `src/components/editor/ProfileSection.tsx`        | Aligned | Identity fields, photo/logo action targets, summary naming, autocomplete, and empty state.                                            |
|  47 | `src/components/editor/ProjectsSection.tsx`       | Aligned | Project metadata, rich-text description/bullets, URL labels, add/remove/reorder, and wrapping.                                        |
|  48 | `src/components/editor/SkillsSection.tsx`         | Aligned | Group labels, icon selection, skill tokens, keyboard operation, and long-list wrapping.                                               |
|  49 | `src/components/editor/StatsSection.tsx`          | Aligned | Label/value pairing, repeated-field names, reorder/delete actions, and concise preview behavior.                                      |
|  50 | `src/components/editor/shared.tsx`                | Aligned | Shared editor cards, delete/add controls, labels, targets, rule/radius tokens, and focus states.                                      |
|  51 | `src/components/fields.tsx`                       | Aligned | Canonical text/textarea/select labels, names, autocomplete, hints, issue descriptions, and focus.                                     |
|  52 | `src/main.tsx`                                    | Support | Strict root, family stylesheet order, failure boundary, and service-worker ownership.                                                 |
|  53 | `src/templates/Academic.tsx`                      | Output  | Complete data coverage, scholarly hierarchy, semantics, page flow, and print output.                                                  |
|  54 | `src/templates/AtsPlain.tsx`                      | Output  | Single-column ATS order, canonical headings, selectable text, and monochrome fidelity.                                                |
|  55 | `src/templates/AtsProfessional.tsx`               | Output  | ATS-safe hierarchy, restrained accent, complete sections, and deterministic pagination.                                               |
|  56 | `src/templates/Aurora.tsx`                        | Output  | Creative document styling exemption, contrast, complete sections, and page containment.                                               |
|  57 | `src/templates/Bauhaus.tsx`                       | Output  | Geometric output exemption, readable order, complete sections, and print-safe composition.                                            |
|  58 | `src/templates/ClassicSidebar.tsx`                | Output  | Main/sidebar ownership, sidebar pagination, complete sections, and continuation context.                                              |
|  59 | `src/templates/CompactTimeline.tsx`               | Output  | Dense hierarchy, timeline continuity, bullet splitting, and one-/multi-page behavior.                                                 |
|  60 | `src/templates/ExecutiveSerif.tsx`                | Output  | Serif hierarchy, complete sections, safe contrast, and pagination boundaries.                                                         |
|  61 | `src/templates/GradientHeader.tsx`                | Output  | Document-only gradient exception, text contrast, complete sections, and print output.                                                 |
|  62 | `src/templates/Horizon.tsx`                       | Output  | Timeline/sidebar structure, section coverage, continuation behavior, and page flow.                                                   |
|  63 | `src/templates/Minimalist.tsx`                    | Output  | Typographic hierarchy, visible headings, complete sections, and restrained pagination.                                                |
|  64 | `src/templates/ModernMinimal.tsx`                 | Output  | Grid reading order, complete sections, bullet atoms, and A4/Letter behavior.                                                          |
|  65 | `src/templates/Monograph.tsx`                     | Output  | Editorial/sidebar hierarchy, complete sections, sidebar atoms, and continuation behavior.                                             |
|  66 | `src/templates/Prism.tsx`                         | Output  | Accent sidebar contrast, complete sections, sidebar pagination, and output fidelity.                                                  |
|  67 | `src/templates/Typographic.tsx`                   | Output  | Numbered hierarchy, semantic equivalents, complete sections, and page flow.                                                           |
|  68 | `src/templates/paginationAtoms.tsx`               | Output  | Shared head/bullet atoms, keep-with-next, stable keys, and safe split boundaries.                                                     |
|  69 | `src/templates/shared.tsx`                        | Output  | Shared contact/date/location rendering, safe links, semantics, and consistent text output.                                            |
|  70 | `src/utils/fieldIssues.tsx`                       | Support | Issue context, focus/highlight target, accessible descriptions, and stable hint layout.                                               |
|  71 | `src/utils/richText.tsx`                          | Output  | Sanitized selectable rich text, safe links, semantic formatting, and PDF text extraction.                                             |

## Non-TSX surfaces

The audit also covers the surfaces that users, crawlers, installers, and contributors see:

| Surface           | Standard                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`      | Current workbench title/description, canonical URL, accurate local-first copy, zoom-preserving viewport, CSP boundary, 1200×630 OG metadata and alt text, Twitter alt text, SVG/ICO/mask icons, and truthful structured data.   |
| `public/404.html` | Same 88rem frame, 40px mark, Emerald identity, local Archivo/JetBrains Mono, solid surfaces, responsive layout, and noindex metadata.                                                                                           |
| PWA manifest      | `orientation: any`, content-based screenshot labels, correct dimensions, family colours, and no cold-cache offline overclaim.                                                                                                   |
| Workbox           | App-shell precache excludes social/store screenshots; Harper's hashed WASM is cached on first use instead of forced into every cold install.                                                                                    |
| `README.md`       | Real tablet screenshot, `cloakyard` repository, TypeScript 7, Vite+ commands, current file map, design references, and accurate privacy/offline language.                                                                       |
| `SECURITY.md`     | Honest private-contact guidance, CSP and local-storage boundary, current audit commands, and no fictional automation or response SLA.                                                                                           |
| `CONTRIBUTING.md` | Vite+ setup/check/build workflow plus explicit chrome, template, responsive, accessibility, and asset gates.                                                                                                                    |
| Template guidance | Complete-section and pagination rules agree; unsupported recruiting/ATS statistics have been removed.                                                                                                                           |
| Design exports    | The retired blue/glass archive and unconsumed compatibility aliases are removed; `tokens.json` mirrors the light tokens, dark overrides, geometry, motion, shadow, and z-index contract in `tokens.css`.                        |
| Social/PWA art    | Real product states are the only source: Open Graph and phone show the entry workbench; tablet/README show the loaded editor and document proof. Dimensions and consumers are documented in [brand-assets.md](brand-assets.md). |

## Lean-code audit — 22 July 2026

The application graph, exports, CSS bridges, public assets, scripts, direct dependencies,
and documentation references were audited after the redesign.

- Entrypoint reachability and Knip 6.27.0 agreed on the same five unreachable source
  files. The retired Grainient component/style/constants, template thumbnail renderer,
  and WebGL-era dark-scheme hook were deleted.
- The landing now imports `CloakWorkbenchLanding` directly; the one-line onboarding
  compatibility module was deleted. The unused standalone social-card HTML source was
  removed because both asset generators capture real application states.
- A stale multicolour Cloakyard SVG, dead editor accordion component, unused rich-text
  wrapper, unused CSS selectors, unused named exports, and unconsumed compatibility
  aliases were removed. Helpers still used internally are private rather than exported.
- Every direct production and development dependency has an active source, build,
  generator, PWA, or test consumer. `taskkill` is a Windows system command used by the
  capture scripts, not an unlisted package dependency.
- The post-cleanup graph reaches 91 of 91 runtime source files (the ambient
  `vite-env.d.ts` declaration is excluded). Knip reports zero unused files, exports,
  dependencies, development dependencies, or unlisted packages. All 33 remaining
  compatibility aliases have a source consumer, and every defined product CSS class
  has a static application reference.
- The 15 template implementations use statically analyzable lazy imports. The editor
  and gallery share React's cached module promises, stable paper-sized fallbacks avoid
  layout shifts, and PDF/PWA capture waits for a committed template rather than a
  loading shell. This reduced the initial application chunk from 659.34 to 455.50 kB
  minified (30.9%) and from 164.48 to 141.02 kB gzip (14.3%); only the intentionally
  user-triggered PDF export chunk remains above Vite's 500 kB advisory threshold.
- README, design-system guidance, component inventory, asset workflow, contributor,
  security, and template documents were checked for stale paths, commands, claims, and
  counts. All local Markdown links resolve.

## Completed visual and document verification

The final 22 July 2026 build was exercised through the real application after the
typography, mobile-workspace, and natural-wrapping corrections. This is a recorded
result, not a list of intended checks.

| Area                          | Recorded evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing and responsive shell  | The landing passed at 320, 375, 414, 768, 1280, and 1440px without horizontal overflow. Its header remained 72px and its mark 40px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Editor geometry               | At 320, 375, 414, and 768px, the 64px header left a content area divided exactly 50:50 between the proof and one lower-pane task. An open section showed only its form and a 44×44px close action; closing it showed only the inline 13-section picker, whose rows were at least 69px high. Selecting a row restored exactly one editor, while preview-only mode used the full body and returned to the prior lower-pane state. At 1279px the compact token measured a 328px panel and 879px proof stage. At 1280px the widescreen token measured a 64px header, 72px rail, 384px panel, and 824px proof stage; at 1440px the panel remained 384px and the proof stage grew to 984px. Every visible desktop top-toolbar control, including the A4/Letter fieldset, measured exactly 40px high with zero horizontal overflow. |
| Overlays and popovers         | The template gallery measured 1100×852px with a 24px desktop edge and became a contained 375×747px mobile sheet. All 15 document previews stayed contained and non-interactive. The privacy dialog measured 576×852px with a 24px edge and the confirm dialog 576×202.5px. At 320px the 288px month/year popover retained exactly 16px on both horizontal edges; at 1280px it stayed below its trigger with 46px of visible space, then flipped above on a 520px-high viewport resize. Its implementation follows `visualViewport` offsets and resize/scroll events for software-keyboard shifts. Colour, logo, toolbar, privacy, confirm, and mobile-sheet states remained edge-safe.                                                                                                                                       |
| Keyboard and review UI        | The editor exposes one screen-reader-only h1 and one responsive `#editor-content` target. Activating **Skip to résumé editor** from mobile preview mode restored the split view and focused that target. The month/year dialog moved focus inside, closed on Escape, and returned focus to its trigger. Mobile ATS tabs supported keyboard movement; Escape closed the dialog and restored focus. Both the 80 ATS score and 96 writing score states rendered with stable semantics.                                                                                                                                                                                                                                                                                                                                          |
| Contrast, focus, and stacking | Muted text measured 5.74:1 light and 4.82:1 dark against Surface; semantic success/warning/danger text measured at least 4.91:1 light and 5.47:1 dark. The 1280×400 colour dialog retained a 16.5px viewport edge, moved focus inside, and restored it on Escape. At 320px the Options sheet measured 320×662.4px, stayed inside the viewport, exposed no visible control below 40px in either dimension, and returned focus to **More options** on close.                                                                                                                                                                                                                                                                                                                                                                   |
| Templates and text flow       | All 15 live template previews were checked for size, scale, containment, and generated page counts (four to eight for the loaded sample). `.resume-root` and every template root use natural whole-word wrapping: `overflow-wrap: normal`, `word-break: normal`, and `hyphens: manual`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Themes and resilience         | Light and dark landing/editor states, 200%-equivalent text scaling, long content, software-keyboard conditions, the 404 page, and narrow-to-wide widths showed no horizontal overflow. The checked app and 404 states produced zero browser warnings or errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| JSON save→load                | A 24,166-byte `.cloakresume.json` download was inspected for `kind`, `savedAt`, `resume`, `templateId`, `primary`, `paperSize`, and `jobDescription`; loading it restored the saved state exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| PDF export                    | The final post-upgrade real-UI export was 4,178,135 bytes: five A4 pages at 595.28×841.89pt, created by jsPDF 4.2.1 as an unencrypted PDF 1.3 file. `pdftotext` found 333 lines, 1,455 words, and 17,372 bytes; `pypdf` extracted 15,773 characters and seven working contact URI annotations. All five Poppler-rendered pages were inspected at original detail and showed clean layout with natural whole-word wrapping and no mid-word splits.                                                                                                                                                                                                                                                                                                                                                                            |
| Generated brand assets        | The live captures were inspected at native resolution: Open Graph 1200×630, phone 1290×2796, and tablet 2732×2048. Two consecutive generation runs produced identical SHA-256 hashes for all three files. Their source states, consumers, manifest labels, and reproduction commands are recorded in [brand-assets.md](brand-assets.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Release regression matrix

Every release that changes chrome must exercise the real application, not an isolated
mockup.

| View                                                  |   320    |   375    |   414    |   768    |   1280   |   1440   |
| ----------------------------------------------------- | :------: | :------: | :------: | :------: | :------: | :------: |
| Landing declaration and start/load instrument         | Required | Required | Required | Required | Required | Required |
| Editor header, rail/pill, panel, and canvas           | Required | Required | Required | Required | Required | Required |
| 50:50 editing mode and preview mode                   | Required | Required | Required | Required |    —     |    —     |
| Standard dialog and mobile sheet                      | Required | Required | Required | Required | Required | Required |
| Template gallery and every live output preview        | Required | Required | Required | Required | Required | Required |
| ATS/writing review: loading, success, empty, error    | Required | Required | Required | Required | Required | Required |
| Colour/date/logo/toolbar popovers                     | Required | Required | Required | Required | Required | Required |
| Privacy, confirm, reload, orientation, and failure UI | Required | Required | Required | Required | Required | Required |
| 404 page                                              | Required | Required | Required | Required | Required | Required |

Also verify light/dark system schemes, keyboard-only operation, reduced motion,
200% text zoom, long content, software-keyboard safe areas, scroll containment,
horizontal overflow, console errors, A4/Letter pagination, JSON load/save, and PDF
export. Inspect `public/icons/og-image.png`, `public/screenshots/iPhone.png`, and
`public/screenshots/iPad.png` at native resolution after regeneration.

## Validation gate

```bash
vp install
vp check
vp test
vp build
vp outdated
vp pm audit
vp exec tsc --version
```

A redesign is complete only when these checks are green (or a tool reports a
documented upstream advisory), the visual matrix has been inspected, the generated
manifest names the current screenshots, and no active component introduces a second
brand, width system, logo size, overlay contract, or product-chrome visual language.
