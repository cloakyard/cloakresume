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
