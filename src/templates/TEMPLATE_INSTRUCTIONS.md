# Template Instructions

Rules every template in `src/templates/*.tsx` must follow. If you add or redesign a template, this is the contract.

## 1. Section coverage is non-negotiable

Every template **must** render every section in `ResumeData` when that section is non-empty. Hiding a section because the design "looks cleaner" without it is not acceptable.

Required references (the audit in `README` / CI greps for these):

- `resume.profile.summary`
- `resume.experience`
- `resume.education`
- `resume.skills`
- `resume.projects`
- `resume.certifications`
- `resume.awards`
- `resume.languages`
- `resume.interests`
- `resume.tools`
- `resume.extras`
- `resume.custom`

Always gate each section by `.length > 0` / truthiness so a template with empty sections doesn't render empty headers.

Quick self-check:

```bash
for f in src/templates/*.tsx; do
  for field in profile.summary experience education skills projects certifications awards languages interests tools extras custom; do
    grep -q "resume\.${field}" "$f" || echo "MISSING $field in $f"
  done
done
```

## 2. Pagination: sections can span pages, but never split mid-item

Long CVs must flow across multiple A4 pages. The shared `PaginatedCanvas` does the work — call it from every new template. The rules it enforces:

- **Atoms are indivisible.** Each top-level JSX block you push into the `atoms` array is treated as one unit: either the whole atom fits on the current page, or it is moved whole to the next page.
- **Per-item atoms for list sections** (Experience, Education, Projects, Custom). This lets a long experience section continue across pages at item boundaries — not mid-bullet.
- **Single-atom grids** for sections rendered as 2-col / 3-col grids (Skills, Credentials, Tail/More). A grid cannot be split across atoms without tearing the layout; the whole grid moves to the next page if it doesn't fit.
- **Keep-with-next.** Any atom that is an isolated section header (an `<h2>` with no following item in the same atom) must carry `data-keep-with-next="true"`. The packer will evict it onto the next page alongside its first item so headers are never orphaned.
- **`break-inside: avoid`** on items that must not split _within themselves_ (a single job entry, a project card). The packer handles page-level breaks; `break-inside` handles print engine breaks inside an atom that is itself taller than a page.

Do **not**:

- Hardcode `.resume-page` divs for multi-page templates (this bypasses pagination and cuts off content when it overflows).
- Wrap sidebar content in `overflow: hidden` + a `mask-image` fade. Fades hide content, which violates rule 1.
- Let a sidebar grow past 297mm. The sidebar must either fit inside one A4 (cap it and keep content short) or be split across hardcoded pages the way `ClassicSidebar` does.

**Sidebar pattern** — the only sidebar template we ship is `ClassicSidebar`, which splits its sidebar content across two hardcoded pages (page 1: contact + skills; page 2: credentials + languages + interests + tools + extras + quickStats). This works when the sections are predictable and bounded. We tried dynamic sidebar pagination (`Spotlight` / `DuoTone`); it proved fragile in practice — sidebar-first-page reserve estimates drifted with font changes, leaving inconsistent page heights. If you need a sidebar layout, prefer the ClassicSidebar split approach over dynamic pagination.

## 3. ATS parseability

Every template — even the "creative" ones — must be parseable by Applicant Tracking Systems.

- Use real semantic HTML: `<h1>`, `<h2>`, `<ul>`, `<li>`. Do not fake headings with styled `<div>`s unless you also emit a screen-reader-accessible equivalent.
- Text must be **selectable and copyable**. No text baked into SVGs, no `background-image` text, no `::before { content: "…" }` carrying content (that rule is for decoration only).
- Standard section labels where possible: `Experience`, `Education`, `Skills`, `Projects`, `Certifications`, `Awards`, `Languages`. Creative labels (`Expertise`, `Credentials`, `At a Glance`) are OK for design families but keep an ATS-safe template (`AtsPlain`, `AtsProfessional`) using the canonical names.
- No multi-column layouts in `AtsPlain`. ATS parsers read top-to-bottom and multi-column layouts scramble order.
- Real bullet lists, not dashes or dots rendered as inline text.
- Dates formatted with `formatDateRange(start, end)` from `shared.tsx` for consistency.

## 4. Two-column layouts: weight distribution

When you choose a sidebar layout:

- The **right (main) column owns the narrative**: summary, experience, projects, education, custom sections. These sections carry the hiring signal and need the width.
- The **left (sidebar) column owns the identity + supporting facts**: photo/monogram, name, title, contact, skills, languages, tools, interests, extras, quick stats. Short, scannable, factual.
- `ClassicSidebar` splits sidebar content across two hardcoded pages (page 1: contact + skills; page 2: credentials + languages + interests + tools + extras + quickStats). Use this pattern — content is bounded and predictable per page.
- We explicitly do **not** ship a dynamically-paginated sidebar template: the per-page reserve estimates for the identity block drift with font and content changes, producing inconsistent page heights. If you need more than what fits in one A4 sidebar, split like ClassicSidebar rather than trying to measure and flow.

## 5. Typography

A resume is a typographic document. Treat it as one.

- **Body size**: 9.0pt – 10.5pt. Below 9pt is uncomfortable on print; above 10.5pt wastes density.
- **Line height**: 1.4 – 1.6 depending on the template's rhythm. Denser templates (`CompactTimeline`) sit at 1.4; airier ones (`Typographic`, `Minimalist`) at 1.5 – 1.6.
- **Font families**:
  - Default: `'Geist', 'Inter', sans-serif` (modern, neutral).
  - Executive / academic: `'Instrument Serif'` or `'Lora'` for headings, paired with a sans body. Fall back to `Georgia` / `Iowan Old Style`.
  - ATS-safe: `'Calibri', 'Arial', sans-serif` only.
- **Hierarchy**:
  - Name: 18pt – 32pt, weight 700–800, tight tracking.
  - Section headers (`h2`): 9pt – 14pt, distinguish via uppercase + letter-spacing, weight, or serif treatment — not size alone.
  - Job titles: slightly larger or heavier than company name; company gets accent colour.
  - Dates / meta: smaller, muted colour, often `font-variant-numeric: tabular-nums` so columns align.
- **Tracking**: use `letter-spacing` sparingly — ALL CAPS text benefits from 0.5 – 2.5px; lowercase body text almost never does.
- **Monospace for numbers** in date ranges and stats: `font-variant-numeric: tabular-nums`.

## 6. Restraint — do not be tacky or loud

Resumes are professional documents. Design enhances, never shouts.

- **One accent colour** at a time (comes from `palette.primary*`). No rainbow gradients in body content. Gradients are OK for hero blocks (Aurora, GradientHeader) but keep them soft.
- **No drop shadows on text.** Subtle shadows on cards (`0 0.5mm 2mm rgba(15,23,42,0.08)`) are fine.
- **No emoji or stylised icons as content separators.** Use hairlines, dots, or the accent colour.
- **Max two font families** per template. Mixing four is chaos.
- **No animations** — the output is a static PDF.
- **Colour contrast** for body text must be at least WCAG AA (4.5:1). Muted greys are `#4b5563` or darker against white.

## 7. Every section starts with a header

Readers scan by heading. No section — not even short ones like Languages or Tools — may render without a distinguishable heading. The heading can be:

- A real `<h2>` with CSS styling (`mm-h2`, `au-h2`, etc.)
- A numbered marker + label pair (`tg-marker-num` + `tg-marker-label` in `Typographic`)
- A sidebar-style `<div class="…-h3">` for short aside labels

The common requirement: **visual weight + consistent placement**. A reader should be able to locate a section in under a second.

When you group two sections into one atom (e.g. `Credentials` containing both Certifications and Awards in a 2-col grid), both sub-groups still need their own sub-heading inside the grid.

## 8. Implementation checklist for a new template

1. Read this file and `shared.tsx` first.
2. Import the shared helpers: `contactIcon`, `renderContactValue`, `certificationLink`, `formatDateRange`, `formatLocation`, `splitSkills`, `extractInitials`.
3. Build the `atoms: React.ReactNode[]` array in read order (profile → summary → experience → …).
4. Wrap multi-page output in `<PaginatedCanvas>`. Pass `mainPaddingMm` and (if sidebar) `sidebarWidthMm`, `sidebarBackground`, `sidebarPaddingMm`.
5. Use the audit snippet in §1 locally. Every field must be referenced.
6. Run `vp check` — lint + typecheck must be clean before review.
7. Run `vp test` — no regressions in existing templates.
8. Preview with the `sampleResume` in the template modal; also preview with a long resume (10+ experience items, 15+ skills, 10+ projects) to confirm pagination holds.
9. Register the template in `src/templates/index.ts` with accurate category, level, and badge metadata.
10. If you add a new sidebar template, follow the `ClassicSidebar` split-across-hardcoded-pages pattern. Do not attempt dynamic sidebar pagination.

## Why these rules exist

- **"Display all sections"**: the user pays for a resume that represents _all_ their experience. A template that silently hides a sidebar section because the candidate has many skills is sabotaging the user.
- **"Never split mid-section"**: PDF output is read sequentially. A bullet cut in half across pages looks broken; a job that fits on page 2 instead of bleeding across the page gutter reads cleanly.
- **"ATS-safe"**: 70%+ of applications pass through ATS parsers before a human sees them. A beautiful template that ATS can't read is a liability.
- **"Restraint"**: recruiters spend under 10 seconds per resume. Loud design burns that budget on decoration instead of content.
