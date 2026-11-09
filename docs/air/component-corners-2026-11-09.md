# Component corners — 2026-11-09

Air 1.7.1 pins the existing role-based corner rules in the standalone contract.
The library preview's inner bottom clip derives from the 18px panel radius minus
its actual 1px border. Template output, paper geometry and document styles are
unchanged. The shared radius helpers are synchronized for family compositions.

Fresh gates pass: 373 production/unit/browser tests; 1,666 content-section layouts,
386 library layouts, 960 review layouts and 192 Actions states. The shared editor
comparison covers 66 Chromium and 66 WebKit cases in both themes at all eleven
sizes; each field/button/dismiss corner is compared against isolated Air controls
in default, hover and focus. Family public/privacy/recovery, dialogs and real-worker
PWA notice matrices pass. Build/types/check/design/portability and dead-code checks
pass. Reviewed phone, tablet, laptop and desktop screenshots preserve output.

Full per-view/role evidence is recorded in Cloakyard's
`docs/air/component-corners-2026-11-09.md`. The release PR records final main checks,
production verification and dev synchronization. Physical devices, OS keyboards,
IME, actual zoom and spoken assistive acceptance remain open.
