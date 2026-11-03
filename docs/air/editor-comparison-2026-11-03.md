# Full-view editor comparison — 2026-11-03

The comparison covers working editors, every section, focused fields, templates,
Options, date/contact/logo/photo pickers, writing controls, review and progress
states. Landing-page evidence is not whole-app acceptance.

The date popup lacked Air's popover layer and could render behind compact form
fields. It now uses `--air-z-popover`, matching the other writing pickers. Its
browser audit verifies actual hit ownership and waits for dismissal before
reopening. Stale in-flow update-banner guidance is corrected. No resume data,
template, pagination or export code changes.

Validation: check/build, all 373 tests, Knip, design and portability pass. Browser
coverage includes 1,666 empty/populated section layouts, 384 writing-field layouts,
128 contact-select layouts, 256 date layouts, 320 logo/photo layouts, 386 template
library layouts, 194 review/progress edges and 192 Options layouts. Both themes,
phone/tablet/laptop/desktop, enlarged text, keyboard and forced-colour cases are
included. Cross-app field/font/focus/dialog comparisons pass in Chrome and WebKit.

The full coverage ledger and selected rendered evidence are in Cloakyard's
`docs/air/editor-comparison-2026-11-03.md`. Raw output is retained in
`/tmp/air-editor-comparison-2026-11-03`. Physical iPhone/software-keyboard, Windows,
OS IME, browser zoom and spoken-assistive acceptance remain open.
