# Quick Stats follow-up audit

Verified in Chrome on macOS on 15 September 2026 against the production build.

## Finding and correction

- **Resolved — `src/templates/ClassicImpact.tsx:32`:** the six-character value `500MW+` wrapped its plus sign onto a second line when four cards shared the main column. Classic Impact now switches to two columns when any value exceeds four characters or any label exceeds twenty characters. Compact metrics such as `25+`, `12+`, `6×`, and `4` retain four columns. Each row remains a separate pagination block.
- Added A4 and Letter browser regressions for `GLOBAL`, `WINNER`, `500MW+`, and `100000`. The assertions check line counts and card padding boundaries, as well as complete values, labels, order, and column count.

## Validation results

| Check                                          | Result                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `vp install`                                   | Passed                                                             |
| `vp check`                                     | Formatting, lint, and types passed                                 |
| `vp pm audit`                                  | No known vulnerabilities found                                     |
| `vp run build`                                 | Passed; existing chunk-size advisory remains                       |
| `CLOAKRESUME_BROWSER_BUILD=production vp test` | **280 tests passed across eight files; none skipped**              |
| Focused stats browser regressions              | Eight cases passed across A4 and Letter                            |
| Template matrix                                | **17 templates × two paper sizes × five fixtures = 170 scenarios** |

The matrix checks rendered text bounds, page dimensions, expected fields, source-content preservation, complete stats and marked records, and browser errors. It covers all populated sections, including the title, language proficiency, and inline formatting. The initial audit captured 645 page screenshots with no recorded violations; the complete matrix passed again after the value-width correction.

## Visual and stress review

- Visually inspected representative rendered pages for all 17 layouts, plus selected continuation pages. Automated boundary and content checks cover every matrix scenario; the manual review sampled those screenshots.
- Checked the reported four metrics, larger numbers, wide letters, compact values, empty and single-stat sections, three and five stats, long labels, unbroken tokens, fifty stats, and a section near a page break on both A4 and Letter: **24 document cases**.
- Checked the stats editor at **320, 390, 768, and 1440 pixels** in both light and dark mode: **eight viewport/theme cases**. Inputs had accessible labels, mobile input text was 16px, and no horizontal page overflow was detected. Manually reviewed the narrow mobile views and desktop dark view.
- The combined 32-case stress run reported no clipping, missing or reordered stats, wrapped metric values, unnamed inputs, or browser errors.
- Downloaded three PDFs through the actual Export PDF action: the reported metrics, wide-character values, and fifty stats. Rendered and visually inspected **all five PDF pages**, including all three pages of the long list. Cards retained their values and labels, continuation rows stayed intact, and work experience followed the stats correctly.

## Reproduction and scope

```sh
vp install
vp check
vp pm audit
vp run build
CLOAKRESUME_BROWSER_BUILD=production TEMPLATE_AUDIT_DIR=/tmp/cloak-stats-audit/matrix vp test
```

Chrome/Chromium must be available for the browser suites; use `CHROME_PATH` for a nonstandard installation. The recorded runs used local Chrome with no skipped tests. Local screenshots, PDF renders, stress results, and logs are under `/tmp/cloak-stats-audit` for this session.

This was a focused content-fit and interaction review using the [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). It does not establish exhaustive accessibility compliance or coverage of other browser engines. Two-column templates retain their existing independent-column pagination behavior.
