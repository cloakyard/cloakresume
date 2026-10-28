# Air consistency audit — 2026-10-28

Air 1.2.4 pins the same public compact navigation and correct CSS time conversion
for both seconds and milliseconds. The production light arrival stays 900ms.

Changed the public compact boundary from 54rem to the shared 40rem and removed duplicate row/chevron styles. All 373 production tests pass with zero skips; 28 affected design/PWA tests were rerun. Entry checks cover 335 layouts and 14 journeys. Build/check/dead-code/design/portability and artwork checks pass. Existing export intermittency remains open.

The four refreshed websites pass 1,152 Chrome/Firefox shell layouts with zero
deviations/errors. PDF/Resume share 264 PWA layouts and 54 exact visual pairs.
The common notices preserve each app's update/work-safety lifecycle. Yard and
Drop's website have no PWA worker. Link states remain neutral, including hover.

[Local evidence](evidence/consistency-2026-10-28/) preserves this candidate's verification.
[The family audit](https://github.com/cloakyard/cloakyard/blob/main/docs/air/consistency-2026-10-28.md)
contains the before/after review, full test ledger and production release tracking.
Deployment is tracked separately from these pre-merge acceptance results.

Full product, physical/assistive/hardware and existing output/security acceptance
items remain open. This audit does not mark those surfaces fully validated.
