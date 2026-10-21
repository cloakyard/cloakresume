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

Read [DESIGN.md](DESIGN.md) before changing visible UI. Its complete portable
Cloakyard Air contract supersedes historical styling guidance. Current coverage,
evidence and cleanup live in [docs/air](docs/air/validation.md).

- Use the pinned `src/styles/air.css` tokens and controls. Keep application text
  neutral in both themes; hyperlinks never become blue on hover. Preserve angled
  hyperlink cues and the shared blue keyboard focus outline.
- Keep the product colour in its mark/landing light. Résumé output retains its
  selected fonts, colours, paper and geometry.
- Inspect every required viewport class, light/dark, keyboard/coarse input,
  reduced motion, enlarged text and browser zoom as specified by DESIGN.md.
- Remove replaced code only after tracing all consumers. Record remaining live
  adapters in [the cleanup record](docs/air/code-cleanup.md).
- After visible changes, build and regenerate actual previews with
  `vp run generate-screenshots`, then `vp run generate-og`. Follow
  [the asset workflow](docs/brand-assets.md) and inspect every generated image.
- Run `vp check`, `vp run build` and the complete production suite:
  `CLOAKRESUME_BROWSER_BUILD=production vp test run --no-file-parallelism`.
  A missing browser or skipped required test does not pass acceptance.

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
