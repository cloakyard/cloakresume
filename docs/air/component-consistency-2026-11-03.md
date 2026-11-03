# CloakResume component consistency — 2026-11-03

Global/editor focus rules now use Air's 3px offset. Ordinary Air buttons inherit
the shared rule rather than an editor override; template choices use the same
spacing. The browser regression still verifies visible, unclipped focus and now
expects the contract's 3px value. No résumé template or data processing changes.

Validation: all 373 tests against the production build; 1,666 empty/populated
section layouts and 16 contrast pairs; 386 template-library layouts and eight
contrast pairs; both browser engines' shared editor/dialog comparisons; build,
check, Knip and Air provenance/portability gates.

The family audit includes all six public/privacy/recovery surfaces, all three
working editors and their actual dialogs. Air remains 1.6.0. Raw evidence is in
`/tmp/air-components-2026-11-03`; selected evidence is retained by the canonical
Cloakyard audit of this date. Existing approved editor compositions remain.
Physical Windows/iPhone, software keyboard, OS IME, real browser zoom and spoken
assistive acceptance remain open; automated WebKit does not close them.

Release follows passing local checks through dev → main. Unrelated work is excluded.
