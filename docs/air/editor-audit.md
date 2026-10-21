# Existing Resume editor — Air migration inputs

2026-10-11. Baseline inspection of the current app, before importing Air into its
runtime. Fixture: the existing built-in synthetic Rohan Okafor sample, Classic
Sidebar, A4, multiple pages. No résumé content was changed and no export was run.

## Current migration checkpoint — 2026-10-21

Entry/recovery, editor shell, writing/repeated-entry controls, contact/selects,
dates, logo/photo, colour, writing hints, every content section, template library,
résumé review and Options/export are implemented and software-validated.
Use `surfaces.json`, `validation.md` and the dated evidence for exact coverage.
The unchecked baseline below records the original inspection, not current status.

Current piece: `evidence/options-export-2026-10-21.json`; cleanup is tracked in
`code-cleanup.md`. Native Safari and Firefox actual 200% checks complement the
responsive/theme matrix. Physical touch/software keyboard, OS IME and spoken
assistive gates remain open. Next: PWA safety/static recovery and actual assets.

## Baseline coverage and evidence

- All 13 populated default sections at 1440×900 and 1280×800 with a fine pointer,
  and 768×1024 and 390×844 with touch emulation, each in light and dark: 104 cases.
  Measurements: `editor-layout-audit.json`. No measured page/panel horizontal
  overflow. This does not prove every descendant, scrolled state or output fits.
- Full accessible panel snapshots and field/button geometry at desktop/light and
  phone/dark: `editor-panel-audit.json` and `editor-mobile-audit.json`.
- Conditional month/year picker, options, primary colour, template library,
  logo picker, inline writing hints and all four review tabs:
  `editor-conditional-audit.json`. Most overlay checks are phone/dark; the date
  picker also has a tablet/dark measurement. Other overlay/theme combinations remain.
- Visual inspection: `evidence/baseline-experience-desktop-light.jpg` and
  `evidence/baseline-date-phone-dark.jpg`. These are baseline images, not Air approval.
- Reduced motion was enabled for stable geometry inspection. Real motion quality,
  software keyboards, hybrid devices, assistive technology and browser zoom remain
  separate checks. A timed-out measurement batch was discarded and re-run in saved
  batches; the evidence file contains the completed 104 cases.

## Section preservation requirements

| Section           | Preserve when replacing its chrome                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile           | Name; multiline headline and four-rendered-line constraint; local JPG/PNG photo validation; searchable optional logo; rich summary and writing hints.           |
| Contact           | All nine kinds, type-specific values/validation, reorder/remove and add. Keep full values and correct input/autofill semantics.                                 |
| Experience        | Role/company/location, partial start/end dates, Current job and previous-end-date restoration, nested rich bullets and independent role/bullet reorder/removal. |
| Skills            | Group name, optional logo, comma-separated skill values, group add/reorder/remove.                                                                              |
| Projects          | Name, rich description, nested role bullets, comma-separated stack, project and bullet controls.                                                                |
| Education         | Degree, school, location, detail/CGPA and partial dates; entry controls.                                                                                        |
| Certifications    | Name, issuer, year, optional verification link and entry controls.                                                                                              |
| Awards            | Title, year, optional detail and entry controls.                                                                                                                |
| Languages         | Name and proficiency, including imported/custom values; entry controls.                                                                                         |
| Interests & Tools | Separate optional display headings and comma-separated interests/tools.                                                                                         |
| Quick stats       | Value/label pairs, miscellaneous key/value entries and their separate add/reorder/remove controls; template support remains explicit.                           |
| Custom            | User heading, nested rich bullets, section and bullet controls; no restriction to predefined résumé sections.                                                   |
| Target JD         | Local target-role text, privacy explanation and keyword analysis entry; empty guidance and populated keyword results.                                           |

## Findings to fix during migration

- `src/components/DragList.tsx:112`, `FormatScope.tsx:219`,
  `MonthYearField.tsx:274`, `LogoPicker.tsx:126` and `editor/shared.tsx:140` —
  medium-width utilities reduce controls to 40px even with touch enabled. In the
  768px sweep, 12 of 13 sections have buttons below Air's 44px minimum; Interests
  & Tools has no failing measured button. Month/year choices also measure 40px
  high on tablet. Derive target size from input capability, not the `md` breakpoint.
- `src/components/editor/ContactSection.tsx:108` — contact-kind selectors use
  10px uppercase monospace on desktop/laptop. They must use the same readable
  sans typography as other Air fields. At 768px both kinds and value inputs are
  40px high despite touch emulation; at 390px they are 44px and 16px text.
- `src/components/AtsReviewModal.tsx:333` and
  `src/components/ats/AtsKeywordsPane.tsx:55` — Re-scan and Open JD editor measure
  40px high on the 390px phone. Review overlays need the same touch checks as fields.
- `src/components/editor/ExperienceSection.tsx:169` — nested bullet action columns
  consume writing width. Preserve their operations while placing actions in a
  separate row where a narrow panel would squeeze prose. Long role/company values
  also need deliberate field layout, not smaller text.
- `src/components/LogoPicker.tsx:186` — unconditional search autofocus can open a
  software keyboard as soon as a touch picker opens. Verify on a real phone and
  use an intentional initial-focus policy that preserves dismissal and content.
- The current interface retains tinted selected controls, nested sub-cards,
  uppercase mono labels and multiple field-edge treatments. These are migration
  targets; document template colours and typography are intentional output data.

The 16px Current job checkbox is not a 16px touch-target defect: its containing
label measured 44px high on the phone. Measure effective targets before flagging.

## Conditional behaviour observed

- Start month picker: 288px wide, phone month targets 60×44px, year targets about
  59.5×44px. Year list opens; Escape dismisses and returns focus to the date trigger.
  Tablet month targets are 60×40px, confirming the breakpoint defect above.
- Options and primary-colour sheets fit the phone width with reachable close
  buttons. Colour presets, keyboard-described hue/saturation, lightness and hex
  entry are present. No colour was changed; invalid hex and pointer cancellation
  remain feature checks.
- All 17 template choices are present. Searching for a nonexistent template
  produces a readable no-results status; clearing restores the list. Template
  selection/output fidelity is not certified by this library inspection.
- Logo picker exposes 80 of 112 icons before search. A no-match search gives a
  readable empty state; Escape restores focus to the logo trigger. No logo changed.
- Local writing-engine loading/progress and the completed review were observed.
  Overview, Keywords (missing JD), Insights (31 writing findings) and Parse all
  fit the phone dialog horizontally. Engine/output correctness was not re-derived.
- Inline summary hint opens a viewport-contained popover with an explicit 44px
  replacement action. Dismissal leaves text unchanged; no suggestion was applied.

## Remaining audit and feature gates

- [ ] Empty sections, add/reorder/delete/confirm/cancel, custom values, validation
      errors, extreme long content, title limit and photo import/error/removal.
- [ ] Rich-text selection/shortcuts/toolbar scope, undo, paste, IME, growing-field
      scroll stability and focus across reorder/removal.
- [ ] Date selection, clear, year-only, Present, current-job restore and imported
      legacy date strings; all popup keyboard paths and short viewport placement.
- [ ] Populated JD/keyword matching, re-scan, engine failure/retry, field jumps,
      suggestion application, stale findings and nested-overlay focus restoration.
- [ ] All overlay themes/layouts; 320px and short landscape, 200% zoom, real mobile
      keyboards, touch/pointer cancellation and Safari/Firefox. The earlier
      landscape rotation-block finding remains open.
- [ ] New/load/save/browser-restore, malformed JSON, storage quota, unsaved-change
      protection, PDF export/busy/error/cancellation and imported photos.
- [ ] All 17 templates with A4/Letter, long content, pagination and actual PDF
      inspection. Preserve content, links, colours, typography and output geometry.
- [ ] Production full feature suite after migration, then legacy-design cleanup
      and a final family comparison. At this baseline, no product screen was Air-implemented or fully validated.

## Primary-colour follow-up — 2026-10-21

The baseline HSL/lightness observations above are historical. The colour picker now
uses the canonical Air HSV wheel, brightness, exact hex and independent native
ranges. The desktop portal and compact modal share one body, safe viewport
placement and focus/dismissal behavior. The phone drag handle remains available.
Current validation and remaining gates are recorded in `validation.md`; this does
not migrate the remaining overflow, review, library or PWA interiors.
