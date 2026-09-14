# Template container and content audit

Verified in Chrome on 14 September 2026 after the [editor and pagination audit](release-audit-2026-09-14.md).

## Findings and corrections

- Reproduced the reported Bauhaus headline with “Senior Backend Engineer · Distributed Systems & Streaming”. The local preview on port 4186 was serving the earlier stats-only branch, whose fixed header rows let the title extend about 15px above its container. The current branch sizes those rows from their content and includes every contact. Switched the existing preview URL to this branch and confirmed that the title remains inside the header, including a longer headline and eight contacts.
- Long language proficiency text could escape the facts column in Classic Sidebar, Monograph, Prism, and Horizon. Constrained both language fields to their available width and enabled wrapping; applied the same correction to Compact Timeline's shared layout pattern.
- A single project title in ATS Plain and ATS Professional matched both the first-child and last-child flex rules. The latter prevented shrinking, allowing an unbroken project name to extend beyond the page. Restricting that rule to a separate metadata field lets the title wrap inside the document.
- Visual review found stat labels continuing onto another page without their values. All eight templates that display stats now identify each complete value/label pair to the paginator. Pairs that fit on a page stay together; unusually tall content can still continue across pages.
- A second review of every exported PDF page found certification names separated from their issuer/year in Classic Impact (Letter) and Gradient Header (A4). Those records now move together when they fit on a fresh page. Gradient Header award titles also follow their descriptions onto the next page. Explicitly kept records taller than a page can still split without losing content. Three new browser pagination regressions cover direct records, nested records, and oversized records; the nested case reproduced the defect before the fix.
- Long tool/interest badges in Classic Impact and Monograph also stay whole when they fit on a page, preventing a wrapped tool name from continuing mid-word on another page. The template matrix now compares each marked record with its rendered counterpart, in addition to checking full source-text preservation.

## Reproducible browser coverage

`tests/template-layouts.spec.ts` exercises all **17 templates × 2 paper sizes × 5 content fixtures = 170 scenarios**. The fixtures include the reported headline with every section populated, two deterministic full sample resumes, long prose and metadata with 150-character unbroken tokens and 17 stats, and a sparse profile.

Each scenario checks rendered word bounds against the paper and meaningful container edges, paper height, presence of display fields, conservation of each source block's characters across its page fragments, whole stat pairs, whole marked credentials/badges, and uncaught browser errors. Checking container edges specifically catches the reported header defect even when the title remains within the paper. Generated continuation labels and the ordering of parallel columns are excluded from the content-conservation comparison.

The fixtures populate profile, contacts, experience, skills, projects, education, certifications, awards, languages, interests, tools, stats, extras, and custom sections. Stats are checked in the eight supporting templates; the other nine preserve their existing section choices. The existing editor suite also exercises all editor sections and their interactions.

```sh
vp install
vp check
vp test
vp run build
CLOAKRESUME_BROWSER_BUILD=production TEMPLATE_AUDIT_DIR=/tmp/cloakresume-template-audit vp test
```

The browser suites require Chrome/Chromium; set `CHROME_PATH` when it is outside the detected locations. Without a detected browser, these suites are explicitly skipped. The recorded runs used local Chrome and had no skipped tests.

## Final results

- Final full suite against the production build: **220 tests passed across eight files**, with no skipped tests.
- The production browser coverage includes **77 tests**, comprising 43 editor regressions and 34 template/paper cases that execute all 170 content scenarios.
- Production template matrix: **644 rendered pages**, with no container-bound violations, missing checked fields, changed character inventories, separated stat pairs or marked records, or runtime errors.
- TypeScript, formatting, lint, and the production/PWA build passed. The existing PDF bundle-size advisory remains.
- Visual review covered all A4 pages of the compact and long-field fixtures, one full-sample Letter first page per template, and all sparse first pages: **132 screenshots**. After the stat-pair correction, all **26 changed or new screenshots** were inspected again, including affected Letter continuations; unchanged images were compared by hash.
- Real Export PDF downloads for **all 17 templates on both A4 and Letter: 34 PDFs, 135 pages**. Every page count and paper dimension matched the preview. All **1,886 field/phrase checks** passed, including long names, headlines, credentials, and all 17 stats in each supporting template. Every certification retained its issuer on the same page, and every award title stayed with the start of its description. All **386 link annotations** remained within their page bounds. No export or runtime errors occurred.
- Rendered **every PDF page with Poppler at 110 DPI** and visually inspected all **135 pages**, including all continuation pages and populated sections. Regenerated the exports after the corrections and inspected all **seven changed pages** again; the other **128 pages** were pixel-identical to the reviewed versions. No clipping, overflow, missing content, separated credentials, or split tool badges remained in these PDFs.

One intermediate development run timed out while waiting for the Academic CV / Letter preview. Its isolated recheck passed all five content fixtures, and the final complete production run passed. No timeout limits were relaxed.

The new matrix supplements the earlier feature and oversized-content checks. These results describe the tested Chrome documents; they do not establish correctness for every possible input or browser.
