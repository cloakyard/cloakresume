# Contributing to CloakResume

Contributions are welcome. Keep résumé content local, keep the editor dependable, and
preserve the CloakPDF-family product language.

## Set up

Requires Node.js 24 or newer and the Vite+ CLI.

```bash
npm install --global vite-plus
git clone https://github.com/cloakyard/cloakresume.git
cd cloakresume
vp install
vp dev
```

Create a focused branch, make the smallest coherent change, and avoid reformatting
unrelated files.

## Required checks

Run the full local gate before opening a pull request:

```bash
vp check
vp test
vp build
```

Use `vp outdated` and `vp pm audit` when changing dependencies. If setup, package
management, or runtime selection behaves unexpectedly, run `vp env doctor` and include
its output in the report.

## Product-chrome changes

Read [DESIGN.md](DESIGN.md) and [docs/design-audit.md](docs/design-audit.md) before
changing landing, editor, control, overlay, empty, error, or loading UI.

- Product chrome uses CloakResume Emerald `#047857`, Archivo, JetBrains Mono, cool
  paper, slate rules, 6–8px geometry, and solid surfaces.
- The 88rem frame, 40px header logo, 64/72px headers, 72px rail, 328px desktop panel,
  and overlay widths are shared contracts.
- Verify at 320, 375, 414, 768, 1280, and 1440px, in light and dark schemes, with
  keyboard navigation and reduced motion.
- Preserve native browser zoom and check long labels and 200% text zoom.
- If the landing page changes materially, regenerate and inspect the social and PWA
  captures with `vp run generate-og` and `vp run generate-screenshots`.

## Résumé-template changes

Résumé templates are output artifacts, not application chrome. Read
[src/templates/TEMPLATE_INSTRUCTIONS.md](src/templates/TEMPLATE_INSTRUCTIONS.md)
before editing or adding one. Every template must render every populated section,
paginate without clipping content, keep text selectable, and remain honest at A4 and
US Letter sizes.

Preview realistic and long résumés, verify links and page boundaries, and test PDF
export. Register a new template in `src/templates/index.ts` with accurate metadata.

## Pull requests

Describe the user-facing outcome, files in scope, validation performed, and any
intentional exceptions. Include before/after captures for visual changes. Report
security issues privately according to [SECURITY.md](SECURITY.md), not in a public
issue or pull request.
