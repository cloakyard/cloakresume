# Code cleanup record

Update this alongside each bounded Air piece. Trace runtime and test consumers;
remove unused implementations and references together. Keep historical evidence
intact. A lazy module or legacy name alone does not prove dead code. Deferred
items must name a live consumer and the condition for safe removal.

## 2026-10-21 — Options and export

- Removed `BottomSheet.tsx` after tracing its sole consumer, ToolbarOverflow.
  `OptionsDialog.tsx` now provides the required Air frame with a narrow API;
  unused title/ariaLabel/showCloseButton/maxHeight configuration is gone.
- Removed 183 lines of unused `cr-overlay`, `cr-dialog` (including heading,
  description, close and footer), `cr-sheet`, overflow-item styles, six entry/exit
  keyframes and their media rules. Source search finds no runtime consumers.
- Removed the queued 200ms handoff and its reduced-motion timing branch.
  Synchronous teardown restores focus before the next modal mounts.
- Replaced fixed 14.5px rows, decorative eyebrow and blue command icons with
  shared Air components. Updated current inventory and source audit references.
  Removed the unsupported approximate export-bundle-size comment and stale toolbar
  description. The family handoff now names the actual App/Layout composition.
- At this checkpoint, retained `useAnimatedPresence`: MonthYearField and ReloadPrompt still used it.
  Retained `.tb`, popover/toast styles and compatibility tokens for their current
  consumers. The next PWA migration must trace those references again.
- Retained ToolbarCenterBridge: both events have actual ToolbarOverflow callers.
  Retained Editor (SectionPanel), GithubIcon (ErrorBoundary), and the lazy exporter,
  PDF font preparation and all template assets. No speculative removals.
- Dependencies, file schema, exporter and document templates are unchanged.
  Regression proof: [Options/export evidence](evidence/options-export-2026-10-21.json).

Removed `BP.narrow` / `BP.tiny` after source, test, script and config searches
confirmed only `BP.mobile` consumers. The legacy focus selector now excludes Air
dialogs, so the shared blue focus rule applies without another product override.

Replaced mirrored media-query state/effect with the browser’s current external-store
snapshot. This removes stale responsive state during modal dismissal; a delayed
notification regression covers focus restoration after resize.

Next: PWA registration/update/recovery and static 404, followed by actual social,
PWA and README assets. Trace removed assets and obsolete generator references at
that point. Full-product cleanup and physical/assistive acceptance remain open.

## 2026-10-21 — PWA and static recovery

- Retired the legacy `cr-toast` and `.tb` selectors, toolbar/toast presence rules,
  Hallmark notice header, spinning icons and timed reload fallback. ReloadPrompt
  now uses shared Air actions in normal flow and real worker activation.
- Removed `public/404.html` (527 legacy lines). Root `404.html` is a Vite HTML
  input importing the pinned Air CSS and one small recovery stylesheet; requested
  path enhancement has no React dependency. Updated active test references.
- Stopped using the Workbox message helper that discards its asynchronous result;
  direct waiting-worker delivery catches synchronous failure. Registration listeners
  remain active after failed/later installs and are removed on unmount.
- `useAnimatedPresence` and `.cr-popover` remain live in MonthYearField. They are
  not dead code. Existing lazy exporter, templates, fonts and file schema are unchanged.
- Remaining asset work: `build-pwa-screenshots.mjs` still uses the retired `.cr-input`
  selector. Replace it with actual editor captures in the next asset piece, and
  trace Archivo/JetBrains registrations, legacy tokens and all image/metadata consumers
  before removing anything. Do not infer unused assets from the initial bundle.
- Ignore the local `.wrangler/` development cache. No new dependency was added.

Evidence: `docs/air/evidence/pwa-recovery-2026-10-21.json` in CloakResume.
Next: actual OG/PWA/README assets and metadata, then full-product cleanup and
acceptance. Physical/assistive gates remain open; CloakIMG stays parked and last.

Asset-piece cleanup follow-up: `.cr-input` styles have no current TSX consumer;
the remaining script selector is stale. Remove that obsolete selector and its
unused skin together when replacing the screenshot generator.

## 2026-10-21 — Preview assets and metadata

- Replaced `iPhone.png` / `iPad.png` with four content/theme-named production
  captures. Updated every active manifest, README, artwork, generator and test
  reference together. Historical evidence retains its original asset names.
- Removed 58 lines of obsolete `.cr-input` field/invalid/disabled/hover/focus skin
  and superseded comments. Searches of TSX, scripts, tests and generated markup
  found no remaining consumer; actual capture readiness now uses Air fields.
- Reduced the two generators from 293 to 178 lines (including comments/formatting).
  OG renders local artwork directly; the screenshot generator owns one production
  preview. Independent contexts, seeded/fixed-date synthetic content, decoded
  images/fonts and failure propagation replace shared session/dev-server assumptions.
  No new package, runtime abstraction or application feature was added.
- README, CONTRIBUTING and brand-assets documentation now point to Air rather than
  the retired Workbench palette, typography, frame and tablet screenshot. The
  historical design audit remains clearly marked history, with a current follow-up.
- Preserved the canonical mark, launcher/maskable assets and `favicon.svg` /
  `logo.svg` compatibility copies for older saved URLs. The existing brand tests
  verify their glyph, RGB output and safe-zone geometry.

Retained after consumer tracing:

| Code/assets                                                 | Live consumer and follow-up                                                                                                                                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archivo registration/file and `--font-body` / `--font-sans` | Base/body/form bridge in `index.css` and `cloak-family.css`; audit inherited and transitional states in final cleanup before replacing.                                                      |
| JetBrains registration/file and legacy font tokens          | Remaining typography bridge; `Preview` has a `font-mono` loading state. Audit actual computed resolution and unused token exports in final cleanup, then remove proven unused registrations. |
| Geist, Instrument Serif, Lora and document font preparation | Named template styles and PDF rendering; protected output, not obsolete application decoration.                                                                                              |
| `.cr-field`, `.cr-field-row`, `.cr-stack`                   | Shared fields, Profile/Projects/BulletList formatting and section layout.                                                                                                                    |
| `.cr-popover` and `useAnimatedPresence`                     | MonthYearField’s live positioning/presence adapter.                                                                                                                                          |
| Toolbar bridge, Editor, GithubIcon and lazy export          | ToolbarOverflow, SectionPanel, ErrorBoundary and explicit export respectively.                                                                                                               |

No dependency, template, exporter or file-schema changes. Evidence:
`evidence/preview-assets-2026-10-21.json`. Next: full-product cleanup/acceptance,
including token/font consumer resolution, remaining inventory gates and the
44px target sweep. Physical touch/software keyboard, OS IME, assistive speech and
GPU/battery acceptance remain separate. CloakIMG stays last and untouched.

The asset pass also updates the README audit assertion to verify actual Air
inventory coverage for every live TSX file. Historical source coverage and output
exemptions remain enforced. `cleanup-followup.json` in the asset evidence lists
conservative token candidates after checking source, token chains and compiled
Tailwind references; these are candidates, not blanket deletion permission.
DragList’s `.cr-drag-item` is explicitly live. Review only its earlier transform
override and the non-Air-only date-popup skin during the next bounded cleanup.

## 2026-10-21 — Unused foundation cleanup

- Removed 61 unused token names (62 declarations, including one dark override),
  traced through source, scripts and compiled Tailwind CSS. Each removal has no
  non-declaration runtime reference; the exact list is in the dated evidence.
- Removed the 241-line `tokens.json` mirror: no build/runtime/generator consumer
  exists. Updated README and historical-audit links together. The surviving
  `tokens.css` header now identifies a compatibility/output bridge; it no longer
  claims to be the application's normative design authority.
- Removed both `.cr-popover:not(.air-popover)` skin rules. The only live
  `.cr-popover` markup is MonthYearField and always includes `.air-popover`.
  Keep its placement/presence rules and hook; no interaction was replaced.
- Reconciled legacy source tests with pinned Air token ownership. Removed only
  assertions for the deleted mirror, unused ink alias and unused stagger token.
  Preserve semantic status, focus, popup lifecycle, document and feature checks.
- Retained fonts, loaded-template assets, document styles, actual token consumers
  and the live `.cr-drag-item` class. Font/bridge migration and transitive orphan
  cleanup remain the next bounded audit; do not call all foundations migrated.

Evidence: `evidence/unused-foundations-2026-10-21.json`. Full-product, physical
touch/software keyboard, OS IME, spoken assistive and hardware acceptance remain
open. No dependency or export/schema/template change belongs to this slice.

## 2026-10-21 — Dependency rollout preparation

Updated Harper to 2.13.0, React to 19.3.1, Lucide to 1.61.0, Vite+ to 1.3.0,
pnpm to 12.14.0 and compatible transitive packages. CI checkout/setup-node actions
use current release commit pins. Removed obsolete minimum-age exclusions and the
fast-uri/sharp overrides; normal resolution provides their current compatible
versions. Scoped Workbox to glob 13.0.6 to retire its deprecated glob 11 dependency;
real service-worker tests pass with the unchanged async glob API. Keep the active
brace-expansion security override. No unused runtime package was found.

All 372 production tests pass, including the actual Harper worker and PWA flows.
The 34 template/paper captures, two linked fixtures and four PDF comparisons keep
exact raster/text/geometry/links. See [dependency evidence](evidence/dependencies-2026-10-21.json).
Live fonts/tokens and final product acceptance remain the next bounded migration;
this dependency commit does not mark them complete.

## 2026-10-21 — Privacy, overlays and UI foundations

This supersedes the retained UI-font rows above. Body, form defaults, code metadata,
scrollbars and colour-swatch chrome now use the pinned Air tokens. Removed both
unused Archivo/JetBrains registrations and their 75,332 bytes of font assets,
53 legacy token names and 33 unused Tailwind aliases, including all three tracked
transitive orphans. No template uses those UI registrations: Geist, Instrument
Serif, Lora, platform template fallbacks and PDF font preparation remain intact.

The privacy policy uses `air-prose` inside the standard shared dialog, with a
separate scroll body and persistent close control. Its duplicate link/list/section
skins are removed. The update notice uses the same neutral panel tokens and
shared actions; the existing service-worker and draft-saving lifecycle remains.
Template loading is ordinary UI status, using Air sans on a light paper plane.

Retained: the actual white-paper/thumbnail colour and author-link hover alias;
MonthYearField's live presence/placement adapter and its motion values; DragList's
active drag transform. These are traced consumers, not proven dead code.
Tailwind's broad scan still emits unused utility selectors mentioned by historical
evidence/tests (`--surface`, `--color-proof-ink-2`); they have no runtime consumer.
A future scan-scope cleanup should remove that generated residue with output proof.

Validation/evidence: [privacy/dialog evidence](evidence/privacy-dialogs-2026-10-21.json).
Whole-product target/motion and physical/assistive/hardware gates remain open.

## 2026-10-26 — Storyline and shared public chrome

Removed Resume's production `mountAirLight` effect/ref/markup, horizon CSS and
obsolete shader precache exclusion. Canonical shader references remain live in the
family gallery/Yard; no speculative asset deletion. The family horizon test now
lists only surviving horizon consumers. New Storyline is native transform/opacity
motion with shared lifecycle cleanup; no runtime package or draft-data coupling.
Removed duplicate brand/header/footer link/type/padding rules in favor of the
portable Air shell. Fixed the reduced-motion reset to zero duration instead of
creating tiny transitions on previously unanimated layout properties. Kept all
editor/template/export, update, source/download and native features.

Validation and evidence: `storyline-family-2026-10-26` in current validation records.
This is a bounded source cleanup; broader migration and physical gates remain open.

## 2026-10-26 — Full web cleanup audit

Audited all web imports/exports, dependencies, custom styles, public assets and
build/generator/test entry points. Restricted Tailwind to shipped `src/` and root
HTML, removing 18,816 bytes of generated CSS (3,106 bytes at gzip level 9). Removed
the obsolete two-column media rule and its two orphaned data attributes; made
ReloadPromptView, assertExportFits and ProjectItem module-private. Their live
behavior and data types remain. Added accurate Knip entry points, including static
recovery CSS. Preserve Air font mappings consumed by preflight, lazy templates,
fonts, date/drag adapters and export safety checks. No dependency change.

The earlier broad Tailwind scan follow-up is now resolved. Dynamic
`resume-section-nav--rail` remains live; no unsafe selector purge was used.
All 373 serial production tests, exact render/export comparisons, lint/build and
Air gates pass; see `evidence/code-cleanup-2026-10-26/`.
