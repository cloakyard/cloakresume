# Compact editing and dependencies — 2026-11-09

Air 1.7.0 gives the compact editor an unboxed 64px header, a single Preview/Edit
switch and trailing Export/More actions. The Actions sheet uses the family menu
recipe. The autosaved writing panel retains Close, outside its scrolling body.
Enlarged fields may use 60% of the working region while preview retains at least
40%. Desktop composition, document typography, templates and output are preserved.

Removed the obsolete two-button view segment and duplicate menu skins. Updated
stale Options labels/selectors and product guidance for current dialog motion and
bottom-right PWA notices. No transaction tick is implied for autosaved writing.

Dependencies are current as checked on November 9: Vite+ 1.5.0, pnpm 12.18.0,
Harper 3.0.0, html2canvas-pro 2.6.3, Lucide 1.70.0, Tailwind 4.3.5 and the current
compatible graph. Security audit: zero known vulnerabilities.

Validation: check/types/build; all 373 production tests, including browser,
template/export and grammar/review regressions; 1,666 writing-section layouts,
386 library, 960 review and 192 Actions states. The family canonical-control
comparison passed 66 Chromium + 66 WebKit cases and a 24-case compact follow-up.
Shared real-worker notices, classic-scrollbar dialogs, privacy/recovery, motion
and landing matrices also pass across all viewport classes and both themes.

Browser captures include phone, tablet, laptop, desktop, short landscape and
32px root text. Physical devices, software keyboards/IME, real browser zoom and
spoken assistive acceptance remain open. Family receipts live in Cloakyard's
`docs/air/evidence/mobile-simplicity-2026-11-09`; the complete Air contract remains
bundled here. The preceding release is deployed through #60; exact-main checks and production verification are recorded in that PR.
