---
name: CloakResume — Cloakyard Workbench
description: >-
  A technical-editorial system for a private, browser-native résumé workbench.
  It shares CloakPDF's paper surfaces, slate rules, typography, geometry, and
  interaction language while retaining CloakResume Emerald as its identity.
status: authoritative
version: 2.0.0
date: 2026-07-22
mode: light-and-dark
genre: modern-minimal
design-system: app-wide
primary: "#047857"
paper: "oklch(0.975 0.009 255)"
ink: "oklch(0.225 0.031 255)"
fonts:
  display: Archivo
  body: Archivo
  mono: JetBrains Mono
macrostructures:
  marketing: Workbench
  editor: Persistent canvas workbench
  content: Long document
navigation: N1b three-zone solid header
footer: Ft5 statement band
---

# CloakResume design system

> **Current source of truth.** This document and the root `tokens.css` and
> `tokens.json` files supersede every earlier CloakResume design note. Retired
> blue, glass, and spring-motion specifications have been removed.

Compatibility aliases exist only where an active component still consumes them;
retired visual experiments and speculative token aliases are not part of the system.

`tokens.css` is normative for runtime values. This document is normative for
composition, component behavior, responsive rules, and content hierarchy.

## Family signature

CloakResume and CloakPDF are siblings authored by the same designer. They share:

- Archivo for decisive display and durable interface text.
- JetBrains Mono for status, provenance, IDs, counts, and operational labels.
- Cool paper, dark slate ink, flat surfaces, and one-pixel rules.
- A single product accent. CloakResume uses Emerald `#047857`; CloakPDF keeps blue.
- Real browser-native instruments as proof, never fake browser or OS chrome.
- Large declarations, fact strips, and operational ledgers instead of generic cards.
- A dark engineering/privacy chapter and Ft5 statement footer.
- Compact 6–8px corners, no resting shadows, and restrained functional motion.

Résumé sections, templates, tailoring, ATS review, spelling and grammar, live paper
preview, JSON save/load, and PDF export are this product's native instruments.

## Product truth

The central line is **“A complete résumé workbench. Nothing uploaded.”**

“Nothing uploaded” applies to résumé and job-description content. CloakResume
processes that content in the browser and stores working data locally. Static app
assets may still be fetched and the installable app may cache assets. Copy must not
overstate cold-cache offline availability.

The privacy proof path is:

1. Content enters through the local editor, a local JSON file, or the local sample.
2. Browser state and local language tooling perform editing, tailoring, and review.
3. The browser writes a PDF or JSON file directly to the user's device.

The absent routes are upload server, required account, and product analytics.

## Scope boundary

This system governs landing, editor chrome, navigation, rails, panels, toolbars,
dialogs, sheets, popovers, menus, notices, privacy content, loading, and error pages.
It does **not** restyle user résumé templates. A rendered résumé is an output artifact:
its selected typeface, colours, spacing, and white paper remain template-true in both
themes and in print.

## Colour

The cool paper and slate ladder is identical to CloakPDF:

- Paper `oklch(0.975 0.009 255)`; Paper 2 `oklch(0.947 0.014 255)`.
- Surface `oklch(0.992 0.004 255)`.
- Ink `oklch(0.225 0.031 255)`; secondary ink `oklch(0.43 0.035 255)`;
  muted ink `oklch(0.48 0.03 255)`.
- Rule `oklch(0.865 0.022 255)`; strong rule `oklch(0.72 0.032 255)`.

CloakResume Emerald 700 `#047857` / `oklch(0.508 0.118 165.612)` is the only
product accent. It owns primary actions, active sections, links, progress, focus-
adjacent cues, and proof markers. Hover uses Emerald 800; active uses Emerald 900.
Red, amber, and green status colours are semantic only.

Night surfaces use navy slate rather than pure black. The core action accent stays
fixed across themes; the soft accent surface and label colour use explicit dark-mode
companions for readable contrast. Marketing backgrounds are flat. Grainient, aurora
glow, decorative radial gradients, cursor spotlights, and translucent glass panels
are outside this system and are not shipped as fallback components.

## Typography

- Hero display: Archivo 760, `clamp(2.75rem, 6.4vw, 6.75rem)`, 0.91 line-height,
  `-0.065em` tracking, and a compact editorial measure.
- Section display: Archivo 720, `clamp(2.15rem, 4.7vw, 4.9rem)`, 0.98 line-height.
- Editor/dialog titles: Archivo 720–760, 1.05–1.15 line-height.
- Body: Archivo 400–600, 1.5–1.6 line-height; never below 14px.
- Operational label: JetBrains Mono 600, 10–12px, uppercase, 0.05–0.10em tracking.
- Wordmark: Archivo 800, 18px, `line-height: 1`, `-0.02em` tracking. Archivo and
  JetBrains Mono use the same explicit self-hosted face registrations and font files
  as CloakPDF; never rely on a family-name alias or narrowed fallback for either.

Mono is metadata, not personality. Never use it for paragraphs or oversized display.
Italic serif marketing headlines are not part of the family.

## Exact geometry

| Element                     | Rule                                    |
| --------------------------- | --------------------------------------- |
| Maximum content frame       | `88rem` / 1408px                        |
| Phone / 640px+ page gutter  | `16px` / `24px`                         |
| Marketing / editor header   | `72px` / `64px`                         |
| Editor rail / desktop panel | `72px` / `328px`; `384px` at ≥1280px    |
| Header and editor logo      | `40px`, `0.6rem` wordmark gap           |
| Statement footer            | No repeated logo; product/family kicker |
| Card/dialog radius          | `8px`                                   |
| Repeatable editor entry     | `1px` complete rule, `12px` inset       |
| Input/button/popover radius | `6px`                                   |
| Standard dialog             | `min(36rem, calc(100vw - 3rem))`        |
| Wide ATS/gallery dialog     | `min(68.75rem, calc(100vw - 3rem))`     |
| Popover maximum             | `24rem` or safe viewport width          |

Use the 4px family rhythm: **4, 8, 12, 16, 24, 32, 48, 72, 112, 160px**.
Major sections use 72–160px vertical space; instrument internals use 12–32px.
Avoid nested padded cards and arbitrary competing widths.

## Macrostructures

### Marketing — Workbench

The landing sequence is fixed: N1b three-zone header → split declaration → real
résumé start/load workbench and document preview → factual strip → Build/Tailor/
Export ledgers → dark local-processing receipt → Ft5 statement footer.

The hero performs real actions: start blank, load sample, load a local file, or
resume local work. It is not a screenshot, decorative mockup, window, or animation.

### Editor — persistent canvas workbench

The editor stays a full-screen instrument: 64px top bar, 72px section rail, a 328px
desktop properties panel below 1280px, a 384px properties panel at 1280px and above,
and a persistent document stage. The panel width comes from the responsive
`--editor-panel-width` token; Layout never carries a parallel hard-coded width. All
fixed and sticky panels begin below the complete 64px header. At narrow widths, the
mobile proof and lower workspace divide available content height exactly 50:50. The
lower workspace shows one open section editor or the inline section picker. Closing
an editor reveals the picker in place; other sections never overlay an open form.
The editor header contains only document actions: project provenance and the GitHub
link remain on the landing page and policy surfaces. Animate inner content only;
never animate this geometry.

### Content — long document

Privacy, explanatory, error, and empty-state pages use the 88rem outer frame with a
narrow reading column, declarative title, mono chapter markers, ruled sections, and
a dark statement close. They never introduce a separate microsite.

## Navigation and branding

N1b is a three-zone grid: logo at start, product links at centre, primary/source
actions at end. It is never a floating pill. The shell is solid paper, 72px tall,
and bounded by a one-pixel rule. Mobile may collapse centre links while preserving
logo and action alignment inside the 16px gutter.

The circular mark is 40px in marketing and editor headers, paired with the wordmark
at a `0.6rem` gap—the exact CloakPDF header geometry. Header lockups render the
full-bleed `public/icons/logo.svg` inside the circular clip so the visible mark fills
the 40px box; the inset `favicon.svg` is reserved for browser icon metadata. The Ft5
statement footer does not repeat the lockup; it closes with the product/family kicker
and provenance line. Never redraw, stretch, or independently resize the wordmark.

## Surfaces and common components

- Cards are flat solid paper/surface with a 1px rule and 8px corner. No resting
  shadow; hover may strengthen the rule or change paper tint.
- Every repeated résumé entry uses a complete card boundary and 12px inset. Below
  640px the redundant drag grip is hidden to protect the heading/action row; the
  44px move-up/down controls remain available and named.
- Buttons use a 6px corner and stable height. A scope has one emerald primary;
  secondary controls are neutral outlined or quiet text actions.
- Inputs use a solid surface, 1px boundary, visible focus ring, and no error-state
  layout shift. Inputs remain 16px on phones to prevent auto-zoom.
- Icons are inline metadata, not coloured icon tiles.
- Proof and capability ledgers use numbered rows, descriptive text, metadata, and a
  ruled rhythm instead of interchangeable feature cards.
- Loading and empty states retain the loaded instrument's geometry.
- Status states combine icon, text, and colour; colour is never the only signal.
- The Ft5 footer is a dark Night statement band: product/family kicker, large local-
  first declaration, two-by-two link index, then version, author, privacy, and MIT
  provenance below a rule. Its structure and spacing mirror CloakPDF.

## Overlays

Every overlay shares one shell: solid Surface, 1px Rule, 8px corners, named overlay
shadow, and a Night 58% scrim. No backdrop blur, frosted glass, decorative
transparency, or unscoped z-index.

- Standard dialogs use 36rem. Template galleries, ATS review, and the long-form
  privacy document may use the 68.75rem wide variant. The privacy dialog begins
  with the Night architecture receipt—promise, three-step document path, and absent
  routes—then returns to a narrow ruled reading column for the full policy. Desktop
  dialogs are centred and stay within
  `calc(100dvh - 3rem)`.
- At 640px and below, modal content becomes a viewport-wide bottom sheet, max-height
  92dvh, square lower corners, 8px upper corners, and safe-area bottom padding.
- Dialog title, description, close, scroll region, and actions occur in the same
  order. Escape/outside dismissal, focus containment/return, and scroll lock are
  consistent. Inner scroll uses `overscroll-behavior: contain`.
- Scrim and panel enter together over 220ms. Dialogs, sheets, and popovers retain
  their mounted focus/geometry state through a 160ms ease-in exit before unmounting.
- Popovers/menus use 6px corners and `--shadow-popover`, flip before clipping, keep a
  16px safe viewport edge, and never exceed 24rem.
- Toasts use solid surfaces/live-region semantics and do not cover modal actions.

Z-index is fixed: sticky 30, navigation 50, editor/toast 100, dialog 200, popover
900, system overlay 1000.

## Motion

- The product uses three motion primitives: 100ms press feedback, contextual
  fade/rise reveals for panels and overlays, and a three-block staged landing entry.
- Border, colour, tint, and 1–2px position changes are the default interaction.
  Fast feedback is 160ms, touch/sheet movement 220ms, and slow UI 260ms. The 400ms
  token is reserved for one-time structural reveals; landing delays use the 60ms
  stagger token.
- Entrances use `--ease-out`, exits/presses use `--ease-in`, and reversible state
  changes may use `--ease-in-out`. Active controls move at most 1px and never
  overshoot. Never use `transition: all` or animate a focus-ring shadow.
- Spatial icon motion is applied to an HTML wrapper, never directly to an SVG. The
  ATS field locator animates a pseudo-element with opacity/scale rather than paint-
  heavy shadow interpolation.
- Landing reveals may animate three major hero blocks and major sections once. Do
  not animate every row. Decorative infinite motion is prohibited.
- Functional progress, drag-over feedback, spinners, and live analysis remain.
- Reduced-motion removes nonessential transforms/smooth scrolling while preserving
  immediate state and progress communication. Popovers that own a positioning
  transform use opacity-only entry so motion cannot alter placement.

Never animate editor dimensions, dialog width, or the mobile editor's 50:50 split.

## Responsive and accessibility contract

Visual verification is mandatory at **320, 375, 414, 768, and 1280px** wide;
1440px validates the 88rem cap.

- Under 640px: 16px gutter, 2×2 fact strip, single-column start/file actions, 16px
  form controls, bottom-sheet overlays, and practical 44px touch targets.
- At 640px+: 24px page gutter and desktop overlay gutters.
- Below 860px: declaration splits and ledgers stack in source order.
- At 768px: no overflow, clipped actions, or off-canvas dialog controls.
- At 1280px+: the properties panel uses the 24rem widescreen token; it remains
  20.5rem from the desktop breakpoint through 1279px.
- Desktop content remains centred inside 88rem; no section gets a competing width.

Text zoom and pinch zoom remain enabled. Layout tolerates 200% text zoom, long names,
translated labels, safe-area insets, and software keyboards. Every control has an
accurate name and visible `:focus-visible` treatment. Semantic landmarks, heading
order, dialog labels, focus return, escape dismissal, and readable muted contrast are
mandatory. Icon-only controls have a minimum 40px visual hit area.

Ordinary interface prose and résumé-document text preserve natural word boundaries:
use `overflow-wrap: normal`, `word-break: normal`, and `hyphens: manual` at document
and paragraph roots. Never apply `anywhere` or `break-word` globally; arbitrary
mid-word breaks make names and résumé copy look corrupted in the preview and PDF.
Emergency wrapping is limited to genuinely unbroken values such as URLs, code,
filenames, and constrained tokens.

## Invariants

1. CloakResume Emerald `#047857` owns product interaction.
2. Archivo + JetBrains Mono unify every chrome surface.
3. Cool paper, slate ink, hairline rules, and no resting card shadow.
4. Real résumé instrument; no fake chrome or decorative hero motion.
5. One 88rem frame, one logo lockup, and one overlay shell.
6. Résumé templates retain their own document visual styles.
7. Editor header/rail/panel and mobile 50:50 geometry remain exact.
8. Prose and document output wrap on natural word boundaries.

## Exports

The complete inventory lives in `tokens.css` and `tokens.json`; these are the four
portable equivalents required for downstream implementations.

### 1. CSS custom properties

```css
:root {
  --color-paper: oklch(0.975 0.009 255);
  --color-surface: oklch(0.992 0.004 255);
  --color-ink: oklch(0.225 0.031 255);
  --color-rule: oklch(0.865 0.022 255);
  --color-accent: oklch(0.508 0.118 165.612);
  --color-accent-hover: oklch(0.432 0.095 166.913);
  --color-accent-active: oklch(0.378 0.077 168.94);
  --color-focus: oklch(0.596 0.145 163.225);
  --font-display: "Archivo", "Arial Narrow", sans-serif;
  --font-body: "Archivo", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --radius-card: 0.5rem;
  --radius-control: 0.375rem;
  --page-max: 88rem;
  --header-height: 4.5rem;
  --editor-header-height: 4rem;
  --editor-panel-width: 20.5rem;
  --editor-panel-width-wide: 24rem;
}
```

### 2. Tailwind CSS v4 `@theme`

```css
@theme {
  --font-sans: "Archivo", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --color-primary-500: var(--color-focus);
  --color-primary-600: var(--color-accent);
  --color-primary-700: var(--color-accent-hover);
  --color-primary-800: var(--color-accent-active);
  --color-page-bg: var(--color-paper);
  --color-border: var(--color-rule);
  --spacing-page: var(--page-gutter-wide);
  --radius-panel: var(--radius-card);
  --radius-button: var(--radius-control);
  --ease-cloak-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 3. DTCG `tokens.json`

```json
{
  "color": {
    "$type": "color",
    "paper": { "$value": "oklch(0.975 0.009 255)" },
    "ink": { "$value": "oklch(0.225 0.031 255)" },
    "accent": {
      "$value": "oklch(0.508 0.118 165.612)",
      "$description": "CloakResume Emerald 700 / #047857"
    },
    "rule": { "$value": "oklch(0.865 0.022 255)" }
  },
  "font": {
    "$type": "fontFamily",
    "display": { "$value": ["Archivo", "Arial Narrow", "sans-serif"] },
    "body": { "$value": ["Archivo", "system-ui", "sans-serif"] },
    "mono": { "$value": ["JetBrains Mono", "ui-monospace", "monospace"] }
  }
}
```

### 4. shadcn/ui CSS variables

```css
:root {
  --background: 97.5% 0.009 255;
  --foreground: 22.5% 0.031 255;
  --card: 99.2% 0.004 255;
  --card-foreground: 22.5% 0.031 255;
  --primary: 50.8% 0.118 165.612;
  --primary-foreground: 98.5% 0.004 255;
  --muted: 94.7% 0.014 255;
  --muted-foreground: 48% 0.03 255;
  --border: 86.5% 0.022 255;
  --input: 86.5% 0.022 255;
  --ring: 59.6% 0.145 163.225;
  --radius: 0.375rem;
}
```
