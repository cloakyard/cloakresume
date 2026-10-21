# Air validation record

## 2026-10-11 — portable contract and baseline

`vp check` and the production build pass. The initial concurrent browser suites
had intermittent timeouts: 286/288, then 287/288. Both initial failures passed on
targeted rerun. Running the entire suite with `vp test run --no-file-parallelism`
passes **288/288 in eight files** (385 seconds), without changing assertions or
timeouts. The temporary `fileParallelism: false` configuration was subsequently
removed; serial execution must be requested with the command flag. A later full
run failed a contact-focus assertion, so that earlier pass did not close the
commit gate. The editor and template files each own Chrome and Vite instances.
No runtime app source changed.

## 2026-10-11 — shared component bundle

The pinned local CSS and working `docs/air/components.html` reference are identical
across the family. They are not yet imported into product screens. Contract/bundle
hashes, palette equality and standalone-copy validation pass. All 15 required and
breakpoint-neighbour viewport sizes have no document overflow in light and dark.
The reference was visually inspected on desktop, laptop and phone, including the
390px dark sheet and 320px light controls. Evidence images are recorded in the
family repository's `docs/air/evidence/reference-*.jpg`.

Verified: field/select editing; checkbox and segment selection; slider keyboard
increment; dialog initial focus, forward/reverse focus wrap, Escape, Done and focus
return; 44px coarse-pointer controls; 16px mobile inputs; zero-duration reduced
motion. Fixed the native dialog's default max-width narrowing the phone sheet.
Contrast calculations: all tested normal text/semantic pairs >=4.5:1; required
field boundaries >=3:1 (light 3.31:1, dark 4.39:1). Source review covers disabled,
busy, hover/press and status variants. Product-specific controls, real app state
sweeps, 200% browser zoom and software-keyboard behaviour remain separate gates.

The CSS is an explicit standalone reference entry for PDF's dead-code tool because
its HTML reference imports it; it is not a dead-code ignore. Product migration will
replace this entry with the application's normal stylesheet import.

## 2026-10-11 — complete default-section and conditional-control audit

All 13 populated sections were inspected at 1440×900, 1280×800, 768×1024 and
390×844 in light/dark (104 geometry cases). The two narrow sizes used touch
emulation. No page/panel horizontal overflow was measured. Tablet buttons and
contact fields that shrink to 40px, 10px desktop contact typography, and 40px
phone review actions are recorded defects, not conformance passes.

Month/year, options, primary colour, template search, logo search, local review
loading/completion, all four review tabs and inline writing hints were inspected.
`editor-audit.md` links raw evidence, screenshots, source locations and remaining
feature/state coverage. No résumé content changed; this manual audit did not
export a document or validate every template. The portable contract now includes
structured-writing rules; product styles and runtime imports remain unchanged.

Checks: `vp check` (156 files formatted; 114 lint/type checked) and production
build pass, including PWA generation. The four contact-focus tests pass on targeted
rerun. A full serial run passed 287/288, timing out in Horizon's PDF-stat-symbol
test at 15 seconds. All eight symbol tests then passed on targeted rerun in
27.61 seconds. Targeted passes do not substitute for the full-suite gate. No
assertion or timeout was changed.

The fresh serial run without simultaneous interactive browser auditing finished
at **286/288** in 442.07 seconds. All 107 editor-browser cases passed; Modern
Minimal/Letter and Prism/Letter failed with a 30-second Puppeteer `Locator.click`
timeout at `tests/template-layouts.spec.ts:125`, entering the editor through
Resume editing. This does not establish a document-layout defect, but the complete
suite is not green. Diagnose that entry step with failure-state evidence before
another broad rerun; do not increase timeouts or skip templates to obtain a pass.
Resume's commit gate remains closed. The audit tab reported no console errors.

## 2026-10-12 — complete reference checkpoint and fresh feature gate

The refined Air reference from Cloakyard `340aee8` is now pinned locally at
contract hash prefix `dc6032235f40`, including fields/choices, custom selects,
compound controls, motion, floating surfaces and safe dialog handoffs. The local
bundle contains shader/overlay modules and licenses. Its integrity checker and
all ten isolated portability assertions pass (13 files, no dependencies/siblings).
No production entry point imports Air CSS or either reference module.

The earlier Modern Minimal/Letter and Prism/Letter entry failures were checked
first: **2/2 targeted cases passed** (the other 32 were filtered out only for that
diagnostic run). The fresh full `vp test run --no-file-parallelism` then passed
**288/288 in eight files, zero skipped**, in **386.58 seconds**. This fresh full
pass supersedes the previously failing latest-run gate. It does not establish
that the historical intermittent entry/focus/export issues have been fixed.

The template entry test now captures the failed page screenshot, rendered text,
button geometry/visibility/disabled state, focus and page errors before teardown
if its existing click fails. It then rethrows that failure. No timeout, assertion,
retry policy, template or runtime source was changed. This keeps a future
recurrence diagnosable instead of erasing it with blind reruns.

`vp check` and `vp run build` (TypeScript, production and PWA) also pass. The full
suite output is saved in `evidence/precommit-suite-2026-10-12.log`. Existing chunk
size warnings remain. Shared reference visual/interaction evidence is maintained
in Cloakyard's dated validation record; the full product Air migration, browser
parity, real zoom/touch and generated-output inspection remain future gates.
No push, deployment or production appearance change was performed.

## 2026-10-14 — Portable Air 1.0.1

Pinned the complete family contract and reference bundle to Air 1.0.1 (contract
`201f7c381b5f`). Header identity is now consistently 36×36px across landing/editor
and small screens, with at least a 44px interactive target. A shared paper-accent
keeps selection chrome readable on white document paper in both themes. Inventory
version comes from the manifest. The new token does not change this product's
runtime controls; its full application migration remains separately tracked.

Exact design integrity, isolated portability and production checks pass. Shared
visual/interaction evidence is in CloakPDF's canvas checkpoint; it does not claim
this product's editor, physical touch or assistive acceptance is complete.

The full serial suite passes: 288 tests in eight files (360.20s), with the editor
browser tests pointed at the fixed production build using
`CLOAKRESUME_BROWSER_BUILD=production`. Two preceding development-mode runs each
reported a different isolated failure (focus-ring timing and a destroyed browser
context); the focused four-case focus sweep and this complete production run pass.
No production behavior or test assertion was changed to obtain this result.
Format/lint/types and the production/PWA build also pass.

## 2026-10-15 — Air 1.0.2 colour-wheel contract

Pinned the portable colour-wheel rules, opt-in CSS, shared math/types and working
reference. Product picker runtime adoption remains separate from this bundle sync.
Format/lint/types, build, design integrity and all 18 standalone portability
assertions pass. Development browser runs each reached 287/288: an isolated prism
PDF-symbol timeout passed on retry; a later contact focus-ring timing failure
passed the complete four-case focus sweep against the production build. The full
production suite passes: 288 tests in eight files (272.96s), without changing
product code or test assertions. The complete pass is recorded in
`evidence/colour-wheel-contract-2026-10-15-tests.log`.
No product UI source or dependency changed. The family evidence and PDF pilot are
tracked in Cloakyard's UX_REFRESH_TODO.md; physical/assistive acceptance remains open.

## 2026-10-19 — Shared Air disabled icon-button correction

Synchronized the canonical Air CSS, manifest and gallery hashes. Guarded unavailable
icon buttons have inert hover/press states and a full-strength keyboard focus
contour. The live family behavior is validated in CloakPDF's editor-wrappers audit.
Resume's product components do not yet import this opt-in Air bundle; full editor
and colour-wheel adoption remain separately tracked. No product component, export
logic or dependency changed. Contract remains Air 1.0.2 / bb90f52e0b0a.

Format/lint/types, production/PWA build, design integrity and all 18 portability
checks pass. An initial development run reached 287/288 with Academic CV/a4 title
wrapping timing out at 20 seconds; that unchanged case passed alone. The complete
serial production suite passes: 288 tests in eight files (361.10s), using
`CLOAKRESUME_BROWSER_BUILD=production`. Results are saved in
`evidence/icon-focus-2026-10-19-tests.log`.
No timeout or assertion was changed. Physical/assistive acceptance remains open.

## 2026-10-19 — entry and recovery adoption

The start page, native compact menu, blank/sample/file entry, browser restore,
privacy, confirmation/notice and render-error recovery consume the pinned Air
bundle. Five source surfaces are implemented; their physical/assistive validation
flags stay open. This is **not** a completed editor or product migration.

Saved work survives cancellation and invalid files. Valid imports are parsed
before replacement confirmation, carry document settings, and ignore duplicate
pending reads. The existing blank placeholder and random sample data remain.
Privacy retains all six policy sections and its July revision date, keyboard wrap,
Escape, pointer dismissal and mobile swipe/cancel. Air dialogs opt into inert
backgrounds; Safari's pointer opener is explicitly focused before opening. Error
recovery honestly describes the last browser-saved draft, supports clipboard
failure fallback and returns to the configured application base.

The entry page supports short landscape. The old editor orientation handler stays
scoped to the editor pending its migration. Landing/reading/recovery fonts do not
reach document templates. All template/font/output source files remain unchanged.
The old entry, receipt, fake résumé proof and privacy skins are removed, including
unused reveal keyframes. The historical Workbench audit is now labelled as such.
No dependency was added. The optional finite horizon renderer is excluded from
precache; static/reduced/offscreen/editor-unmount behavior is checked separately.

Reproduce the entry matrix with a production preview and
`SITE_URL=http://127.0.0.1:8145 node scripts/test-air-entry.mjs`. The default evidence
directory is `/tmp/cloakresume-air-entry`; set `AIR_EVIDENCE_DIR` to change it.
The compact durable record is `evidence/entry-recovery-2026-10-19.json`.

The browser regression harness now waits for a committed responsive panel and
font-driven textarea mirror resizing before taking its baseline. Both previous
failures were reproduced: detached elements returned empty focus styles, and a
fallback-font height caused the initial caret scroll to be measured 61px away
from the settled field. Assertions and timeouts are retained. Confirmation
focus/typing checks now follow immediate Air dismissal instead of waiting for
retired CSS animation selectors. Full runs, rather than filtered diagnostic runs,
remain the commit gate.

Remaining Resume work: editor shell/sections, custom widgets and wheel alignment,
template/review/format/export chrome, PWA/update safety, static 404, social/PWA/README
previews, then final whole-product comparison. The capture helpers recognize the
new landing heading; existing published screenshot/OG assets are explicitly still
legacy until that preview slice. Physical touch/software keyboards, actual OS IME,
spoken assistive and physical GPU/battery acceptance are not certified by emulation.

Final gate: **288/288 in eight files, no skips**, using the production browser build;
107 editor cases and 17 templates × two paper sizes × five fixtures all pass.
**341 layout cases, 14 journeys and 124 contrast pairs** pass. Check (zero warnings),
build, 77-source design inventory, 18 portability checks and exact family sync pass.
Native Safari focus return was rechecked on the fresh 8146 production origin.

## 2026-10-19 — editor shell and navigation

The header, original 32px mark/44px link target, 72px rail, 360/420px writing-panel
frame, section picker, view/paper choices and preview dock now consume Air. The
panel heading scrolls with its content. Compact section changes retain focus;
portrait keeps equal panes and short 640–1023px landscape uses side-by-side panes.
The obsolete orientation lock, keyframes, header/rail/brand/segment/dock skins,
skip-link skin and unconsumed geometry tokens are removed. No dependency added.

Preview zoom, pinch, Fit/100%, content and paper sizes are preserved. The dock is
outside document scrolling so it stays reachable. All template, PDF/font and data
sources are unchanged. Section interiors, custom widgets/wheel, library/review,
PWA/static recovery and actual OG/PWA/README assets remain open. The existing
Ready Offline notice was observed oversized at 32px text; this is a tracked PWA
defect, not a shell conformance claim.

324 layout observations and ten 13-section/zoom/paper journeys pass, covering all
required widths/themes and 16/32px root text. 60 contrast pairs, exact five-page
light/dark text/font/geometry/background comparison, emulated pinch and forced-
colour focus pass. Firefox 158 actual 200% keyboard/picker/expanded zoom and Safari
27 section/paper/privacy focus return were inspected; review tabs are closed and
Firefox zoom restored. Physical touch/software keyboard, OS IME, spoken assistive
and GPU/battery gates remain open.

The first full run found three genuine 320px formatting/bullet-row overflows.
Those rows now wrap without shrinking controls; the original four containment/
44px tests pass, then the complete production suite passes **287/287 in eight
files, no skips**, including all 107 editor cases and 17 templates × two papers ×
five fixtures. Source-contract checks now assert Air geometry and no orientation
lock; two obsolete geometry checks were consolidated. No feature assertion or
timeout was relaxed. Check/build/design/18 portability/exact sync pass.

Durable evidence: `evidence/editor-shell-2026-10-19.json`, checks log and five PNGs.
Full local captures, pre-fix failure log and contrast diagnostics remain under
`/tmp/cloakresume-air-shell/`. Next: shared editor fields and repeated-writing controls,
then every section and custom picker/review/template/export/PWA/preview slice.

Final static adoption check rejected a literal marker radius. Switching it to the
shared radius token passes; focused light/dark pixel comparisons are identical.
The full 287-test run preceded this equivalent-style cleanup; final format/lint/
type/build/design/portability pass afterward. Template loading and export busy-label
stability remain partial-source follow-ups in Preview/ToolbarActions.

## 2026-10-19 — shared writing fields and formatting

Plain text, CSV, textarea and rich writing use Air labels, help, a single field
contour and capability-based editable type. Formatting has neutral pressed states
and 44px targets; hint actions keep 44px targets with reserved text space. Invisible
hint rows, compact size flags and retired hint/compact CSS are removed. Both remaining
error-help consumers were traced and migrated before removing their legacy classes.
A format scope retires removed fields and disables stale actions, preventing a
removed bullet from being restored through its old toolbar handler.

384 layouts across six consumers, 16 sizes, both themes and 16/32px root text pass.
32 contrast pairs, exact invalid text/help/focus, selected formatting and forced
colours pass. Native Safari pointer formatting and Firefox actual 200% keyboard
formatting preserve multiline selection/text. Native tabs are closed, Firefox
zoom restored. No template, PDF/font/data or dependency source changed.

All **290 tests in eight files pass with no skips**, including 110 editor cases and
17 templates × A4/Letter × five fixtures. The first full run's four failures used a
shared legacy focus baseline; assertions now explicitly check the Air field contour
while retaining contact's current contour/clipping/validation gate. The new tablet
case also asserts actual coarse capability. No feature assertion or timeout weakened.
Check/build/design/18 portability/exact sync pass. Detailed proof, failures and limits:
`evidence/writing-fields-2026-10-19.json` and checks log; captures under
`/tmp/cloakresume-air-fields/`.

Next is repeated-entry/bullet chrome and identity/focus/reorder/removal. Contact,
select/date/logo/wheel, hint popups, review/templates/export/PWA/static404 and actual
preview assets remain partial. Physical keyboard/touch/IME, spoken assistive and
shader hardware gates remain open. IMG stays last and parked.

## 2026-10-19 — Air repeated writing entries

Open entry headings, contextual 44px actions, Add/empty guidance and full-width
bullets now use Air. One removal owner replaces duplicate confirmation state.
Stable UI-only bullet keys retain duplicate-string identity and selection; guarded
move boundaries keep focus. Safari pointer actions explicitly focus their button.
Escape, survivor/Add recovery, nested drag, external text drop and saved data pass.
Live announcements are contained by their list so enlarged phone panes cannot
scroll a hidden parent blank. Confirm is visible beside the active action.

640 populated/confirmation layouts, 240 empty layouts, 37 contrast pairs, forced
colours/reduced motion, Safari and Firefox actual 200% pass. The full serial
production suite passes **297/297 in eight files, 361.26s, zero skips**
(117 editor; 34 template/paper cases, 17 × two papers × five fixtures). Check,
build/72 precache, 78-source inventory, 18 portability and exact family sync pass.
No dependency, template/PDF/font/schema/data source change. Old sub-card CSS,
compact/stack flags, duplicate bullet markup and removal state are removed.

Evidence: `evidence/repeated-entries-2026-10-19.json`, matching checks log and six
PNGs; full local captures and failure diagnostics in `/tmp/cloakresume-air-entries/`.
Contact/select/date/logo/wheel/hint and other section/review/export/PWA/asset work
remain open, as do physical touch/IME/assistive/hardware gates. Native tabs closed
and Firefox zoom restored. Local commits only; IMG remains last.

## 2026-10-19 — Air contact and native selects

Contact and Languages now use labelled Air fields and content-aware paired columns.
The shared native select owns its arrow/options/selected check and browser/OS fallback;
legacy contact grids, tiny uppercase type and duplicate select arrow are removed.
All nine stored kind keys, values, browser semantics, validation and imported custom
proficiency remain intact. No template/PDF/font/schema/data/dependency source change.

128 field/popup layout cases, 20 Home/End/Escape journeys, 28 contrast pairs, invalid
focus, forced colours/reduced motion, native Safari and Firefox actual 200% pass.
Full serial production suite: **298/298 in eight files, 374.85s, zero skips**
(118 editor; 34 template/paper cases, 17 × two papers × five fixtures). Check/build,
78-source design, 18 portability and exact family sync pass. Entry JS gzip is
152.57 kB (down 1.68); CSS gzip 25.34 kB (down .25); 73 precache entries.

Evidence: `evidence/contact-selects-2026-10-19.json`, matching checks log and six
PNGs; full local proof `/tmp/cloakresume-air-selects/`. Native tabs closed and
Firefox zoom restored. Next: date/current-job controls, then logo/wheel, remaining
sections/hints/review/library/export/PWA/static recovery and actual preview assets.
Human/device gates remain open. Local commits only; IMG stays last.

## 2026-10-19 — Air partial dates and current-job controls

MonthYearField, Experience Current job and Education Present now use Air fields,
clear actions, checkbox row, popup and neutral selection grids. Partial and imported
raw strings remain distinct; opening/dismissing never normalizes them. Prior-end
restoration, current-job disabled state and template output stay intact. Year
choice/clear restore surviving focus, nested Escape closes years before the popup,
non-modal Tab can leave, and closing content is inert. Old date skins/compact type
are removed; legacy popup CSS excludes Air popovers but retains live old consumers.

**300/300 tests in eight files, 381.21s, zero skips**; 120 editor cases and all 34
complete template/paper cases (17 × two papers × five fixtures). 256 layouts across
16 sizes × both themes × 16/32px × four date states, 20 selection/clear journeys,
52 contrast pairs, emulated touch cancellation and forced/reduced states pass.
Native Safari pointer/focus and Option-Tab/Space Present selection pass; Firefox
actual 200% keyboard/nested Escape passes. Browser zoom restored and task tabs closed.
Check/build/78-source design/18 portability/exact sync pass. No dependency or
schema/template/PDF/font changes. 73 precache entries, 2440.53 KiB.

Six proof PNGs, `evidence/date-controls-2026-10-19.json` and matching checks log
are durable. Full raw/native captures and next-slice notes:
`/tmp/cloakresume-air-dates/`. Latest native preview 8154; earlier task ports remain.
Next: logo search/profile photo, then wheel, remaining sections/hints/review/library/
export/PWA/static recovery and actual preview assets. Human/device gates remain
open; IMG remains last. Local commits only, no push/deployment.

## 2026-10-19 — Air logo and profile photo controls

Profile/Skills logo search and Profile photo controls use Air. Stable icon names,
80-result cap, unknown imported values and exact photo bytes remain intact.
Touch opens the surface without focusing search; keyboard opens search. Clear,
selection, Escape, Tab exit and native photo cancellation preserve usable focus.
The date/logo popups share viewport placement; unused cr-control styling is removed.
Filtering keeps a stable result area so a quick touch cannot select a shifted icon.
Forced-colour selection uses a visible border. No output/font/schema/dependency change.

**303/303 tests in eight files, 372.83s, zero skips**; 123 editor cases and
34 template/paper cases (17 × two papers × five fixtures). 320 logo/photo layouts,
20 contrast pairs and 256 shared-date regression layouts pass. Forced colours,
reduced motion, emulated touch cancellation, Safari and Firefox actual 200% pass.
Check/build/78-source design/18 portability/exact family sync pass.

The first full run passed 301/303; two source-location checks still expected
viewport handling inside the pickers. They now follow the shared helper and retain
all viewport/listener/placement requirements. The final full run passes without
skips, feature-assertion removal or timeout increases. An earlier interrupted run
was discarded while correcting the forced-colour marker.

Evidence: `evidence/logo-photo-2026-10-19.json`, matching checks log and eleven proof PNGs.
Raw matrix: `/var/folders/k0/mzs4nsyn7k78t1j1xlsxq1q40000gn/T/cloakresume-logo-photo-tc0UgP`; additional states/notes in
`/tmp/cloakresume-air-logo/`. Native tabs closed and Firefox zoom restored.
Next: colour wheel, then remaining hints/sections/review/library/export/PWA/static
recovery and preview assets. Physical touch/keyboard/IME/assistive gates remain
open. Local commits only; IMG remains last.

## 2026-10-19 — consistent landing arrows

Air 1.0.4 uses straight forward-navigation arrows. See
[scope, validation and evidence](link-arrows-2026-10-19.md). Twenty-two responsive
light/dark cases and two enlarged-text cases pass, including compact-menu
keyboard return; desktop/laptop/phone captures were visually inspected.

## 2026-10-19 — approved angled hyperlinks and neutral navigation

Air 1.0.5 restores the approved angled hyperlink cue and neutral header/footer
treatment. See [scope and evidence](hyperlinks-2026-10-19.md). Twenty-four local
responsive/theme/text cases pass; desktop/laptop/phone captures were inspected.

## Neutral hyperlink follow-up — 2026-10-19

Air 1.0.6 removes blue hyperlink text, including hover, and specifies neutral
inline/directional treatments. See [scope and evidence](neutral-links-2026-10-19.md).

Neutral hyperlink checkpoint: final stable production build passes all 303 tests (eight files, no unhandled errors), plus formatting/types, build, 78-surface integrity and 18 portability checks.

## 2026-10-21 — Air primary-colour controls

CloakResume's two toolbar paths share the pinned Air colour math, full-brightness
208px hue/saturation wheel, Brightness, exact hex and optional native precision
ranges. The ten preset names and values remain intact. Opening keeps the exact
stored primary; achromatic editing remembers hue, and black remembers saturation.
Invalid hex stays editable with an associated blur error while output retains its
last valid colour. Primary pointer capture, cancel/lost-capture rollback and the
existing arrow/Shift/Home/End shortcuts are covered.

Desktop uses an immediate non-modal portal; compact mode is a modal surface with
background inertness and return to More options. Both reuse date/logo viewport
placement and remain scrollable on short or enlarged screens. Fine input starts
at Brightness; coarse input starts on the surface. The shared modal focus filter
now excludes closed details content. Compact drag dismissal remains independent
of wheel dragging and keeps the visible close alternative.

Removed duplicate HSL conversion, pointer lightness clamping, mismatched thumb
geometry, global pointer listeners, old lightness CSS/tokens and the unused
cr:open-color-picker bridge. No dependency, schema, template, palette derivation
or export changes. Other overflow/library/review/PWA interiors remain open.

Validation: **310/310 tests in eight files, 397.32s, zero skips**; 130 editor cases and all 34 template/paper cases with five fixtures each. 195 responsive/theme/text/edge cases and 14 contrast pairs pass. Check/build/79-source design/18 portability/exact family sync pass. See [compact evidence](evidence/colour-controls-2026-10-21.json) and its 14 representative captures. The 34 before/after template/paper images and
geometry records match exactly; separately downloaded A4/Letter PDFs have identical
Poppler-rendered pixel hashes. Native Safari supports exact hex, precision controls
and Escape return; native Firefox actual 200% supports the compact modal, keyboard
range editing, scrolling and return. Review tabs closed and zoom restored.

The current piece is local only. Physical touch/software keyboards, OS IME and
spoken assistive acceptance remain open. Next: writing-hint popup interiors,
followed by remaining sections/review/library/overflow/export/PWA and real assets.
CloakIMG stays last, with its parked draft preserved.

## 2026-10-21 — Air writing hints

The six grammar field consumers now use an immediate Air popover with a named
heading, optional-suggestion description, close control, readable semantic kind,
full phrase/reason and neutral replacement actions. Text wraps and targets grow;
short/offset viewports use the shared date/logo/colour positioning and scroll.
No changes to Harper, its ranking/source, first-occurrence callbacks, rich text,
resume schema, templates, typography, palette or export path. Target JD remains
outside the existing grammar scan.

Escape/close returns to the trigger, Tab can leave the non-modal popup, and outside
pointer/focus dismisses. Applying focuses the surviving field because the report
and badge disappear on edit; refreshed reports stay closed. The review-jump audit
found scrolling without focus. It now focuses the named field with one Air contour,
retiring the decorative glow. Removed duplicate popup placement/animated presence,
legacy uppercase/mono chips, truncation, tinted actions and unused .popover skin.

Validation: **318/318 tests in eight files, 421.01s, zero skips**; 138 editor
cases and all 34 template/paper cases with five fixtures each. The final production
build remained unchanged throughout the full serial suite. **452 hint layouts and
26 contrast pairs pass**, including all six real consumers and explicitly injected
long-replacement DOM text stress. No-browser availability skips or timeout increases.
Check/build, 79-source inventory, 18 portability checks and exact family sync pass.
[Evidence](evidence/writing-hints-2026-10-21.json) contains 18 proof captures and
the full-suite log. All 34 before/after image/geometry records and both actual
A4/Letter PDF raster comparisons match exactly. Safari and Firefox actual 200%
pass popup access, replacement, formatting preservation and surviving field focus;
native tabs are closed and Firefox zoom restored.

Targeted checks first caught an Awards test helper that assumed textarea-only
sections and then a hidden photo-input selector; the helper now waits for a visible
writing control. The actual missing review-jump focus was fixed rather than weakening
the assertion. Historical source tests now follow shared placement and Air focus.

Next: remaining content-section interiors, especially Target JD, Quick stats/Extras,
paired Award/Certification year fields and Profile helper copy, followed by complete
section acceptance and template/library/review/overflow/export/PWA/static recovery
and actual assets. Physical input/IME/assistive speech remain open. Local only;
CloakIMG stays last. Scratch: `/tmp/cloakresume-air-hints/`.

## 2026-10-21 — Air content-section interiors

All 13 section sources have complete composition review and software acceptance,
including blank drafts and populated/imported content. Awards/Certifications year
fields and Quick stats/Extras pairs reuse the content-aware field layout; arbitrary
year strings remain intact. Stats and Extras have ordinary headings and open groups,
with independent IDs/actions. Profile formatting help is associated with its field.
Target JD uses a neutral privacy note, the Air primary action and an 18px/1.6 icon.
Safari pointer opening explicitly focuses Analyze so review dismissal returns there.
The unused uppercase/mono cr-field-label skin and focus tint have been removed.

No schema, Harper, template, pagination, palette or export change. Target JD remains
outside grammar scanning. All existing rich text, dates, logo/photo, field hints,
CSV/custom values, add/reorder/removal and save/restore workflows are preserved.
The section inventory marks Air implementation and records software evidence;
physical touch/software keyboard, OS IME and spoken assistive gates remain open.

Validation: **323/323 production tests, eight files, zero skips, 443.4s**;
143 editor cases and 34 template/paper cases with five fixtures each. Final runtime
and dist stayed unchanged throughout the serial suite. **1,666 distinct section
layouts and 16 contrast pairs pass**; 130 JD cases were rechecked after the final
icon correction (1,796 executions total). All required size classes, short landscape,
both themes, 16/32px root text, coarse/fine input and forced colours are covered.
Check/build, 79-source inventory, 18 portability checks and exact family sync pass.
[Evidence](evidence/content-sections-2026-10-21.json) includes 64 proof captures
and the full-suite log. All 34 output image/geometry records and actual A4/Letter
PDF rasters match the pre-change baseline exactly. Native Safari and Firefox actual
200% pass their described editing/focus flows; review tabs closed and zoom restored.

Next: template library, then all four review tabs, overflow/export busy/recovery,
PWA/static 404 and real OG/PWA/README assets. Ready Offline enlarged-text styling is
reserved for its PWA slice. No push/deploy. CloakIMG stays last and untouched.
Scratch: `/tmp/cloakresume-air-sections/`.

## 2026-10-21 — Air template library

The library uses the shared wide dialog/sheet, labelled compound search and neutral
choice states. Template names, descriptions and levels precede the actual previews.
Its height stays stable while filtering; Close remains reachable while content
scrolls. All 17 templates, categories, badges and name/description/level/category
matching remain available. Composition defers filtering; clear restores search focus.
The shared content predicate preserves identity, stats, extras, custom, interests
and tools-only drafts. Sample previews never become saved content.

Real templates remain lazy, inert and output-accurate in the author's colour. The
obsolete card lift/tint, uppercase/mono metadata, duplicate Escape handler and
incorrect palette comment are removed. Library opening/dismissal is immediate.
The toolbar remains mounted through desktop/compact reflow; modal focus returns
to a surviving opener even if a compact handoff loses its original control.
Nested save-error dismissal, keyboard wrap and emulated swipe/cancel pass.

Validation: **338/338 production tests, eight files, zero skips, 474.52s**;
158 editor cases and all 34 template/paper cases with five fixtures each. Runtime
(106 tracked source files) and dist (99 files) stayed unchanged during the serial
suite. **386 layouts and eight contrast pairs pass**: 16 sizes, both themes,
16/32px root text, empty/populated drafts, gallery/filtered/no-results states,
plus two forced-colour keyboard cases. Native Safari and Firefox actual 200%
reviewed; tabs closed and zoom restored. Check/build, inventory, portability and
family sync pass. [Evidence](evidence/template-library-2026-10-21.json) records
41 captures, complete results and runtime/build hashes. All 34 output
image/geometry comparisons and actual A4/Letter PDF rasters match the baseline.

The forced-colour checker scopes its contour measurement to the library, waits
for the intended close focus, and measures after a rendered keyboard frame.
The initial complete suite passed all runtime cases but found three source checks
for the retired gallery skin. Those now verify the shared Air shell, inherited
safe-area containment, scroll ownership and actual template choices. Responsive
testing found the toolbar remount and missing logical focus fallback; both are
fixed and covered by regressions.

Next: complete review shell and all four panes, then overflow/export, PWA/static
recovery and actual assets. Physical touch/software keyboard, OS IME and spoken
assistive gates remain open. No push/deploy; CloakIMG stays last and untouched.
Scratch: `/tmp/cloakresume-air-library/`; read-only next-review notes are there.

## 2026-10-21 — Air résumé review

The persistent Air frame keeps Close, Escape, focus containment and background
inertness available while the report chunk loads. Overview, Keywords, Insights and
Parse use neutral shared segments, open report groups and readable relative text.
All scores, thresholds, dimensions, keyword counts, report ordering and complete
Parse text remain intact. Full phrases, reasons, field labels and captions wrap;
the first 25 writing details and remaining count are preserved. Short and long
panels share a stable tab anchor. Close remains outside the scrolling report.

The scan uses actual progress: known decoded byte totals show measured fractions;
unknown/compressed totals remain indeterminate. Loading, preparation and review
have named live statuses, with no invented minimum delay. Timestamps belong only
to successful scans of the current document. Duplicate opens cannot enqueue the
same revision twice; background completion, stale-edit invalidation and retry
remain intact. The scan action reserves both labels and preserves focus. Direct
and compact openers, resize fallback, field/JD jumps, nested save notices and
emulated swipe/cancel pass. Retired the old combined modal/loading shell, 900ms
delay, tinted cards, tiny mono labels, ignored boxed prop and unused wide aliases.

Validation: **349/349 production tests, 9 files, zero skips, 503.99s**;
165 editor cases, four report-fidelity component cases and all 34 template/paper
cases with five fixtures each. Runtime (134 source/public/config files) and dist
(99 files) stayed unchanged throughout the serial suite. **1,154 layouts and 14
contrast pairs pass**: 960 report layouts and 194 known/unknown/error/forced-colour
cases, all 16 sizes, both themes, 16/32px text and coarse/fine input. Native Safari
actual scan/JD/field focus and Firefox actual 200% tab/panel/Escape flows pass;
own tabs closed and zoom restored. Check/build, 80-source inventory, 18 portability
checks and exact family sync pass. [Evidence](evidence/resume-review-2026-10-21.json)
retains 68 captures, results, logs and hashes. All 34 output image/geometry records
and actual A4/Letter PDF rasters match the baseline. Scoring logic is unchanged.

Early harness checks used a hidden tabpanel and the wrong application root ID;
those selectors were corrected without changing the feature assertions. Contrast
measurement now resolves light-dark ink through an actual element and waits for
the theme frame; progress measurement waits for the lazy report content. The final
checks pass. All-clear/no-insights and long/repeated finding data are covered by
static component renders; real report/progress/error layouts use the production
app and actual Harper engine. Physical touch/software keyboard, OS IME and spoken
assistive acceptance remain open.

Next: compact Options sheet and export busy/recovery; then PWA/static recovery
and actual OG/PWA/README assets. No push/deploy. CloakIMG stays last and untouched.
Scratch: `/tmp/cloakresume-air-review/`.

## 2026-10-21 — Air Options and export controls

Options uses the shared Air dialog/sheet with a fixed heading, one scrolling
command region, background inertness and full relative-size labels. It retains
PDF, Scan, Template, Primary colour, A4/Letter, New, Save and Load. Immediate
teardown restores the opener before a destination modal captures focus; the
queued 200ms handoff is removed. Options survives desktop/compact resizing,
keeps the selected paper, and restores a visible toolbar action on dismissal.
Safari pointer focus, native file-picker cancellation, malformed data,
replacement cancellation and repeated selection of the same file are covered.

Both PDF actions reserve ready/busy label geometry and remain focusable while
real duplicate guards block activation. The separate status reports preparation,
download initiation or failure; Options stays open during export. Template-not-ready,
long-title and actual page-overflow rejection preserve the draft. A forced canvas
serialization failure removes the export clone, shows a recoverable notice and
permits an actual successful PDF retry. JSON save failures also preserve the draft.
The exporter, file schema, templates, fonts and paper geometry remain unchanged.

The keyboard check found and fixed an off-screen wrap target: modal Tab/Shift+Tab
now scrolls the target into view. Native inspection caught a legacy green focus
rule and a one-pixel scroll-edge clip. Air dialogs now use the shared blue rule,
and Options reserves enough clearance for its complete outline. Both theme colours
and visible outline bounds are asserted; native Firefox 200% confirms the result.
Safari colour handoff/native-picker cancellation and Firefox library handoff/Escape
return to More options. Own native tabs are closed and zoom restored.

Removed BottomSheet, unused configuration, 183 lines of obsolete dialog/sheet/
overflow CSS (including six keyframes), the handoff timer, two unused breakpoint
exports and stale current references. Active legacy consumers remain explicitly
tracked in [the cleanup record](code-cleanup.md); no new dependency was added.

The evidence records the final production suite, frozen source/build hashes,
192 ready/busy/failure layouts at 16 sizes in both themes and 16/32px text,
coarse/fine input, eight unique contrast pairs (minimum 6.87:1), forced colours,
native checks, all 34 exact template/paper image/geometry comparisons and actual
A4/Letter PDF raster/text/geometry/link comparisons for two fixtures.
See [Options/export evidence](evidence/options-export-2026-10-21.json).

Initial harness corrections used the real `#app`, preserved touch emulation when
resizing (changing it reloads a Puppeteer page), waited for actual template and
dynamic-viewport readiness, and distinguished the export host from existing
measurement nodes. Feature assertions and required timeouts were preserved.
An intermediate complete run passed 359 tests and exposed a review reflow/focus
race. The media-query hook now reads current browser matches through
`useSyncExternalStore`, replacing mirrored state/effect that could lag a resize.
A deterministic case holds native change notifications while closing the review;
focus reaches the current compact toolbar. Required timeouts remain unchanged.
The final full suite runs after these corrections against a frozen build.
Physical touch/software keyboard, OS IME and spoken assistive gates remain open.
Next: PWA safety/static recovery, then actual OG/PWA/README assets. No push/deploy;
CloakIMG remains last. Scratch: `/tmp/cloakresume-air-options/`.

Final gate: **361/361 production tests, 9 files, zero skips, 510.69s**; 177 editor cases. All 136 recorded runtime/token/config files and 99 dist files remained unchanged. Check/build, 80-source inventory, 18 portability checks and exact family sync pass.

## 2026-10-21 — PWA safety and static recovery

The PWA notices now use in-flow Air typography/actions and preserve editor space.
Offline status pauses while hovered/focused and cannot dismiss an update. Busy
commands retain focus, guard duplicates and expose a separate live status. A scoped
resize observer keeps focused controls and their outline visible in short screens.
Updates save the last committed edit before activation and again before reload;
storage/file-operation blockers retain the draft and offer a real retry. Another
tab's activation does not reload this tab without consent. Later valid installs
remain observable after an install failure. No timed reload or cosmetic spinner.

Root `404.html` replaces the 527-line legacy public page. Vite bundles its pinned
Air CSS and tiny text-only requested-path enhancement without React. The recovery
link works without JavaScript, metadata remains noindex, paths are rendered as
text, and service-worker fallback only handles real app entry URLs. Local Wrangler
returns root 200, explicit recovery 200 after URL normalization, and an unknown route 404; the real generated
worker preserves missing-route 404 after caching the root for offline use.

- 384 layouts: six states, sixteen sizes, light/dark, 16/32px root text; coarse
  input through 1024px. Twelve forced-colour cases, 60 saved captures, no geometry
  failures or page errors. Each notice action is focused at every size without
  test-side scrolling; focus outline clearance is checked. Ten text contrast pairs
  pass, minimum 6.63:1. Representative rendered states inspected.
- 104 hyperlink-state and 28 keyboard checks on explicit and missing-route 404s:
  neutral text including hover, angled cues and visible focus; forced colours use
  system colours. Safari keyboard skip/return and enlarged recovery, Firefox actual
  200% recovery/update views inspected. Both native browsers complete real local
  worker updates and preserve a final name edit; own tabs closed and zoom restored.
- All 34 template/paper raster/text/geometry captures match `54be0f1`. Four actual
  PDF comparisons (plain and contact-link fixtures, A4 and Letter) retain exact
  raster hashes, extracted text, page boxes and URI annotations.
- Eleven focused PWA tests pass. The complete production suite passes **372/372
  tests in 10 files, zero skips, 544.88 seconds**. All 138 recorded source/config/
  asset files and 103 build files match the pre-run freeze. Exact manifests and
  results are in `evidence/pwa-recovery-2026-10-21.json`.
- Format/lint/types, build, 83-source inventory, 18 standalone portability checks
  and exact family sync pass. Build retains its existing large-chunk advisory;
  budgets were not weakened. Shared Air 1.0.6 contract and dependencies unchanged.

The initial lifecycle tests exposed Workbox's dropped message result, missed later
install and controller-change/activation timing. Fixes are covered by real-worker
regressions. Visual review caught resize focus clipping; the earlier full run was
interrupted and replaced by a fresh final-build run. No increased suite timeouts,
skips or test-side manual scrolling hide these failures.

Cleanup and traced remaining consumers: `code-cleanup.md`. Inventory now explicitly
includes root static recovery and its enhancement. Physical touch/software keyboard,
OS IME, spoken assistive and real-device gates remain open. Next: actual
OG/PWA/README assets and metadata, then final product acceptance and cleanup.

## 2026-10-21 — Actual social, PWA and README assets

Replaced the legacy device-named captures with actual production landing and
editor screenshots in light/dark. The Air social card uses the canonical mark,
local pinned CSS and real editor proof. Manifest install colours, image dimensions,
content labels, social title/alt text and README theme selection agree. README,
CONTRIBUTING and brand-assets guidance now identify Air as authoritative.

Removed the stale `.cr-input` capture selector and 58 net lines of unused skin/
comments. The two generators shrink from 293 to 178 lines; there is no new
package or runtime feature. Fresh contexts, synthetic sample seed/date, image/
font readiness and failure propagation replace the old shared dev capture path.
The generator rejects an actual dev server; a missing browser fails and closes
its owned preview. Retained consumers and next candidates are in `code-cleanup.md`.

All five assets repeat byte-for-byte and match `dist` (1,091,463 bytes total,
versus 1,231,012 for the three former images). Chromium parses the built manifest
without errors; all eight declared icon/screenshot images decode at their declared
sizes. Both README picture sources select correctly. Presentation assets remain
outside the application-shell precache. Launcher artwork is unchanged.

88 baseline/current layout comparisons cover all 11 required viewport sizes,
landing/editor, light/dark, coarse input and 16/32px root fonts with reduced motion.
Geometry and computed control styles match; no horizontal overflow/page errors.
73 screenshots are pixel-exact; the remaining 15 differ only at rounded field
edges (at most 58 pixels, two channel levels). Those raster statistics are kept
separate from geometry assertions. Native-size assets and actual desktop/laptop/
tablet/minimum-phone and enlarged-text captures were visually inspected.
124 neutral link states and 32 keyboard checks pass on landing and static recovery.

All 34 template/paper comparisons, two additional linked-document captures and
four actual PDF raster/text/page-geometry/URI comparisons match `24c89e6`.
**372/372 production tests in 10 files, zero skips, 530.12s**. The first completed
run passed 371/372 and exposed a stale README audit-wording assertion. Its fix
checks the live Air inventory’s complete TSX coverage while preserving historical
source/output-boundary checks; 25 focused checks then passed before the fresh full
pass. No feature assertion, timeout or skip was weakened. An earlier broad run
was deliberately interrupted to settle the OG renderer’s GPU scaling difference;
only the final run above closes the gate.

Format/lint/types pass with zero warnings/errors; production build, 86-source
inventory, 18 isolated portability assertions and exact six-repository sync pass.
The existing build chunk-size warning remains. All 284 recorded source/config/
test/document/asset/build files, including 105 `dist` files, stayed frozen through
the final run. Temporary preview/dev servers 8208, 8209 and 8210 are stopped.

Evidence: `evidence/preview-assets-2026-10-21.json` and its adjacent directory.
Next: final product cleanup/acceptance, starting with exact font/token/selector
consumers and pending inventory/44px target gates. Physical touch/software keyboard,
OS IME, spoken assistive and GPU/battery/thermal gates remain open. No push/deploy;
CloakIMG stays parked and last. Static asset validation does not complete the product.

## 2026-10-21 - Unused foundation cleanup

Removed 61 unused token names / 62 declarations, the 241-line unused JSON mirror
and both unreachable non-Air popup skin rules. Pinned Air now owns the explicit
design-authority assertion; retained compatibility values, fonts, templates,
export/schema and date/drag behavior are unchanged. See `code-cleanup.md`.

- **372/372 production tests in 10 files, zero skips, 537.78s**. All 283 recorded
  source/config/test/document/asset/build files (105 dist) remained frozen.
- Check: 147 files, zero format/lint/type errors. Build: 77 precache entries,
  2398.16 KiB; existing chunk warning. Inventory: 86 sources. Portability: 18
  assertions. Exact six-document/bundle family sync passes.
- 88 baseline/current geometry and computed-style comparisons pass across all
  required sizes, themes and 16/32px root text. 81 pixel-exact; seven rounded-edge
  antialiasing differences (at most 57 pixels / 2 channel levels), recorded openly.
- 256 partial-date layouts pass, including imported/empty/Present values, coarse
  targets, Current job, focus and short/enlarged screens. Public links: 124
  layout/state and 32 keyboard checks on home/404. No page errors or overflow.
- All 34 template/paper captures, two linked captures and four actual A4/Letter
  PDF comparisons are exact in raster/text/geometry/URI links.
- Inspected desktop/laptop/tablet/phone editor and landing themes, enlarged editor
  text and desktop/laptop/phone date controls. Native Safari/Firefox were not
  repeated for unused-token/unreachable-selector removal; prior behavior evidence
  remains separate. Physical/assistive/hardware gates remain open.

Evidence: `evidence/unused-foundations-2026-10-21.json`; larger scratch and scripts:
`/tmp/cloakresume-air-cleanup/`. Live font/token bridge and three transitive orphan
candidates remain for the next bounded cleanup. Full-product acceptance is not
complete. Dependency upgrades and final dev -> PR -> main integration are tracked
in the family rollout after the remaining migrations; CloakIMG stays last.

## 2026-10-21 — Privacy, dialogs, update notice and UI foundations

Privacy now uses canonical Air prose inside the standard 576px dialog with a
persistent close heading. The update/error/offline notice uses the shared neutral
panel tokens and actions. Removed legacy UI fonts/aliases; document fonts and all
17 template families remain. Destructive backdrop presses preserve confirmation;
safe start navigation and notices retain normal dismissal.

**373/373 production tests, 10 files, zero skips, 531.02s**. Check/build, 86-source
inventory, 18 portability checks and exact six-copy sync pass. The final 269
source/asset/test/build files stayed unchanged through regression. Responsive:
341 entry/recovery layouts + 14 journeys, 384 PWA cases + eight extra desktop/tablet
captures, 192 Options, 960 review and 386 library cases; 120 neutral-link states
and 24 keyboard checks. Reviewed desktop/laptop/tablet/phone light/dark captures,
enlarged text, short landscape and forced-colour cases. The update controller's
real activation/storage/error tests pass; no artificial update outcome replaces them.

34 paper-only captures are exact; four PDFs preserve raster/text/geometry/URI links.
The old preview harness also included the app page below its clipped preview;
that surrounding page changes to Air. A fresh paper-only baseline avoids confusing
that intentional UI change with authored output. Earlier harness mistakes and their
corrections are retained in the evidence, not relabeled passes.

Evidence: [privacy/dialog alignment](evidence/privacy-dialogs-2026-10-21.json).
Remaining date-motion/target, physical keyboard/IME/assistive and hardware gates
are separate. This does not declare the entire family migration complete.
