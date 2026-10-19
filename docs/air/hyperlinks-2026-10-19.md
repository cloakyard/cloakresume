# Approved hyperlink treatment — 2026-10-19

The user reconfirmed angled hyperlinks and asked to preserve the approved Air design.
Air 1.0.5 (`94c5e537752f`) supersedes the straight-link rule introduced in 1.0.4.
Hyperlinks with a cue use ArrowUpRight; forward app actions and same-page jumps
retain ArrowRight. Header/footer navigation and credits keep neutral ink, while
meaningful body links, focus and active indicators retain the existing blue.
Destinations, new-tab behavior and product features are preserved.

Restores angled Source and family hyperlinks. Forward app actions retain their arrows. Check/lint/types/build, all 303 tests in the eight-file production suite, 78-surface integrity and 18 portability checks pass. Local only; document output is unchanged.

The family link review covers 22 required viewport/theme cases per app plus two
320px/200% text cases (120 total), compact-menu opening/Escape/focus restoration,
neutral Source colour and decorative icon hiding. Desktop/laptop/phone light/dark
navigation captures were visually inspected. This bounded correction does not
complete the unfinished Resume/IMG migrations or physical/assistive acceptance.

Evidence: `evidence/hyperlinks-2026-10-19/`; full captures and command logs remain
in `/tmp/air-hyperlinks-2026-10-19/`. Root/PDF/Drop publication follows validation;
Resume/IMG remain local.
