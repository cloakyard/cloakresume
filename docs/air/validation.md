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
