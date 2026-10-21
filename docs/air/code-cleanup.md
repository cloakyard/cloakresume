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
- Retained `useAnimatedPresence`: MonthYearField and ReloadPrompt still use it.
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
