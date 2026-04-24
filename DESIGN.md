---
name: CloakResume
tagline: A private, local-first résumé builder with an editor on the left and a paper-true preview on the right.
description: |
  CloakResume is a browser-native resume studio. The chrome recedes into
  soft ocean-blue neutrals so the rendered résumé — always rendered on a
  crisp white "sheet of A4" — stays the hero of the screen. Overlays
  are frosted glass, motion is short and spring-like, and every colour
  and shadow is tuned so a user can look at the editor chrome and the
  printed output side-by-side without either one feeling out of place.

# ───────────────────────────── Colour ─────────────────────────────
color:
  mode: dual # ships a light and dark theme, derived from the same tokens
  brand:
    # The user picks any primary; the palette below is the default ocean-blue.
    # Tints/borders are derived live so templates stay visually coherent.
    primary-50: "#EFF6FF"
    primary-100: "#DBEAFE"
    primary-200: "#BFDBFE"
    primary-300: "#93C5FD"
    primary-400: "#60A5FA"
    primary-500: "#3B82F6"
    primary-600: "#2563EB" # canonical brand
    primary-700: "#1D4ED8"
    primary-800: "#1E40AF"
    primary-900: "#1E3A8A"
    primary: "#2563EB"
    # Translucent brand tints used for selected-state backgrounds and
    # accent-icon pills inside the editor chrome.
    brand-50: "#EFF6FF"
    brand-100: "#DBEAFE"
    brand-200: "#BFDBFE"
    brand-300: "#93C5FD"
    brand-hover: "#1D4ED8"
    brand-active: "#1E40AF"

  light:
    # Ink (text) ladder — high-contrast slate, not pure black, so body
    # copy feels softer on white. ink-1 is the default body colour.
    ink-0: "#050816"
    ink-1: "#0B1220"
    ink-2: "#1F2937"
    ink-3: "#4B5563"
    ink-4: "#6B7280"
    ink-5: "#9CA3AF"
    ink-6: "#D1D5DB"
    # Surfaces. `surface` is plain white for cards and inputs; `surface-2`
    # is the whole-app canvas tone; `surface-3` is the pressed/hover wash.
    surface: "#FFFFFF"
    surface-2: "#F8FAFC"
    surface-3: "#F1F5F9"
    surface-panel: "#FCFCFD" # editor panel interior
    surface-raised: "#FFFFFF" # cards sitting inside a glass panel
    page-bg: "#F8FAFC"
    # Hairlines. Three weights let panel dividers, accordion edges, and
    # within-card rules all read as distinct without any one becoming loud.
    line: "#E5E7EB"
    line-soft: "#EFF1F4"
    line-hairline: "#F3F4F6"
    # Status triad — earthy, desaturated so they coexist with the brand blue.
    ok: "#059669"
    ok-bg: "#ECFDF5"
    ok-border: "#A7F3D0"
    warn: "#D97706"
    warn-bg: "#FFFBEB"
    warn-border: "#FDE68A"
    danger: "#DC2626"
    danger-bg: "#FEF2F2"
    danger-border: "#FECACA"
    # Ambient gradients behind the résumé preview and welcome screen.
    preview-bg: "linear-gradient(180deg, #EEF2F7 0%, #E8EDF4 100%)"
    onboarding-bg: |
      radial-gradient(ellipse at 20% 0%,  rgba(37, 99, 235, 0.08), transparent 55%),
      radial-gradient(ellipse at 80% 100%, rgba(37, 99, 235, 0.05), transparent 55%),
      linear-gradient(180deg, #FAFBFC 0%, #F1F5F9 100%)

  dark:
    # Ink flips — near-white top of ladder, slate bottom. Same six steps
    # so component rules that read `ink-3` keep working.
    ink-0: "#F8FAFC"
    ink-1: "#F1F5F9"
    ink-2: "#E2E8F0"
    ink-3: "#CBD5E1"
    ink-4: "#94A3B8"
    ink-5: "#64748B"
    ink-6: "#475569"
    # Surfaces — deep slate/navy, almost black at the canvas level. The
    # résumé page itself stays white; a soft filter keeps it from glaring.
    surface: "#0F172A"
    surface-2: "#0B1220"
    surface-3: "#1E293B"
    surface-panel: "#111827"
    surface-raised: "#1E293B"
    page-bg: "#0B1220"
    line: "#1E293B"
    line-soft: "#172033"
    line-hairline: "#111827"
    # Status — punched up just enough to remain legible on dark, sat back
    # far enough that they don't feel neon.
    ok: "#34D399"
    ok-bg: "rgba(5, 150, 105, 0.16)"
    ok-border: "rgba(52, 211, 153, 0.32)"
    warn: "#FBBF24"
    warn-bg: "rgba(217, 119, 6, 0.16)"
    warn-border: "rgba(251, 191, 36, 0.32)"
    danger: "#F87171"
    danger-bg: "rgba(220, 38, 38, 0.16)"
    danger-border: "rgba(248, 113, 113, 0.32)"
    preview-bg: "linear-gradient(180deg, #0B1220 0%, #070B14 100%)"
    onboarding-bg: |
      radial-gradient(ellipse at 20% 0%,  rgba(59, 130, 246, 0.18), transparent 55%),
      radial-gradient(ellipse at 80% 100%, rgba(37, 99, 235, 0.10), transparent 55%),
      linear-gradient(180deg, #0B1220 0%, #060912 100%)
    # Resume page luminance in dark mode — applied as a filter on the
    # white sheet so it doesn't glare against the dark canvas. Stripped
    # on print/export so output always matches the designed-for-paper look.
    preview-page-filter: "brightness(0.88) contrast(0.98)"

# ───────────────────────────── Typography ─────────────────────────
typography:
  families:
    sans: "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    serif: "'Instrument Serif', 'Iowan Old Style', Georgia, serif"
    mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
  weights:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
  features:
    # Geist stylistic sets: cv11 straightens the lowercase 'a', ss01
    # tightens the numerals — makes the mono strings read more technical.
    enabled: ["cv11", "ss01"]
    tabular-nums: used on scores, ATS rings, and date ranges
  roles:
    body:
      family: sans
      size: 14px
      line-height: 1.5
      color: ink-1
    body-compact:
      # Editor inputs on desktop where pointer precision is available.
      size: 13.5px
      line-height: 1.45
    input-mobile:
      # 16px on mobile prevents iOS from auto-zooming the field on focus.
      size: 16px
      padding: "12px 12px"
    label-caps:
      # Tracked-caps mono used for "FIELD LABEL", "LAST SCAN", section
      # dividers inside templates — reads as quiet, technical infrastructure.
      family: mono
      size: 10.5px
      weight: 600
      case: uppercase
      tracking: 0.08em
      color: ink-5
    section-title:
      family: sans
      size: 13.5px
      weight: 600
      letter-spacing: -0.005em
      color: ink-1
    display-headline:
      # Onboarding hero — "Build a résumé that stays yours"
      family: sans
      size: [26px, 30px, 34px] # sm · md · lg
      weight: 600
      letter-spacing: -0.025em
      line-height: 1.15
    display-italic:
      # The italic "stays yours" fragment — editorial serif nestled inside
      # a sans headline. The single place the serif voice appears in chrome.
      family: serif
      style: italic
      weight: 400
      color: primary-600
    score-numeral:
      # The big number inside the ATS score ring.
      family: mono
      size: 22px
      weight: 700
      letter-spacing: -0.02em
      features: tabular-nums

# ───────────────────────────── Spacing & layout ───────────────────
layout:
  shell:
    # Desktop grid: persistent section rail, editor panel, live preview.
    grid-template: "56px 400px 1fr"
    header-height: 56px
    breakpoint-mobile: "<1024px"
    breakpoint-desktop: ">=1024px"
  mobile:
    strategy: "single-view with a segmented toggle (Edit / Preview) in the header"
    floating-section-pill: "anchored above the safe-area, opens a bottom-sheet section drawer"
  responsive-breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"
    2xl: "1536px"
  spacing-scale:
    # Tailwind's 4-px scale is the house unit. The values below are the
    # steps the app actually uses most; others are available but rare.
    0: "0"
    px: "1px"
    0.5: "2px"
    1: "4px"
    1.5: "6px"
    2: "8px"
    2.5: "10px"
    3: "12px"
    3.5: "14px"
    4: "16px"
    5: "20px"
    6: "24px"
    8: "32px"
    10: "40px"
    12: "48px"
  rhythm:
    section-stack: "16px between editor cards"
    section-stack-tight: "12px inside list sections (e.g. stacked bullets)"
    editor-panel-padding: "12-14px"
    template-page-margin: "varies by template; set in mm, never px"
  touch-targets:
    minimum: 38px
    desktop-shrink-to: 34px

# ───────────────────────────── Radii ──────────────────────────────
radii:
  xs: 4px # inline chips, tight tags
  sm: 6px # toolbar buttons, small inputs, compact fields
  md: 8px # default — toolbar buttons, select menus, status pills
  lg: 10px # accordion cards in the editor, popover items, icon tiles
  xl: 14px # popovers, glow tiles, glass panels
  2xl: 20px # onboarding card, bottom-sheet top corners
  full: 999px # color-picker thumb, section pill, chip indicators
  resume-page: 2px # the "paper" sheet — intentionally almost square

# ───────────────────────────── Elevation ──────────────────────────
shadow:
  # Paired tinted shadows — a short near-layer plus a long soft-layer.
  # Tuned to read as slate (not black) so they feel native to the blue canvas.
  light:
    xs: "0 1px 0 rgba(15, 23, 42, 0.04)"
    sm: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)"
    md: "0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)"
    lg: "0 20px 40px -12px rgba(15, 23, 42, 0.15), 0 4px 8px rgba(15, 23, 42, 0.05)"
    xl: "0 30px 60px -20px rgba(15, 23, 42, 0.25), 0 8px 20px -8px rgba(15, 23, 42, 0.08)"
    focus: "0 0 0 3px rgba(37, 99, 235, 0.18)" # soft brand halo
    resume-page: "0 1px 3px rgba(15, 23, 42, 0.08), 0 24px 60px -24px rgba(15, 23, 42, 0.22), 0 6px 12px -6px rgba(15, 23, 42, 0.08)"
  dark:
    xs: "0 1px 0 rgba(0, 0, 0, 0.30)"
    sm: "0 1px 2px rgba(0, 0, 0, 0.40), 0 1px 3px rgba(0, 0, 0, 0.30)"
    md: "0 4px 12px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.30)"
    lg: "0 20px 40px -12px rgba(0, 0, 0, 0.60), 0 4px 8px rgba(0, 0, 0, 0.35)"
    xl: "0 30px 60px -20px rgba(0, 0, 0, 0.70), 0 8px 20px -8px rgba(0, 0, 0, 0.40)"
  elevation-map:
    flat: "no shadow — hairline border only"
    resting: xs
    interactive: sm # inputs, toolbar buttons
    hover: md # cards, tiles, menu items
    overlay: lg # popovers, dropdowns, modal cards
    sheet: xl # bottom sheet, ATS review modal, onboarding
    page: resume-page # the A4/Letter sheet in the preview

# ───────────────────────────── Glass & backdrops ─────────────────
glass:
  # Frosted-glass surfaces are the app's signature overlay. Used by
  # dropdowns, colour picker, bottom sheet, ATS modal, and zoom dock.
  light:
    background: "rgba(255, 255, 255, 0.88)"
    blur: 14px
    saturate: 100%
    border: "1px solid rgba(15, 23, 42, 0.06)"
    shadow: "0 24px 56px -14px rgba(15, 23, 42, 0.18), 0 4px 14px -4px rgba(15, 23, 42, 0.06)"
    fallback-no-backdrop-filter: "opaque surface colour"
  dark:
    background: "rgba(15, 23, 42, 0.78)"
    blur: 14px
    border: "1px solid rgba(255, 255, 255, 0.08)"
    shadow: "0 24px 56px -14px rgba(0, 0, 0, 0.6), 0 4px 14px -4px rgba(0, 0, 0, 0.35)"
    fallback-no-backdrop-filter: "rgba(15, 23, 42, 0.96)"
  glass-dark:
    # Dark-tinted variant used by floating docks (zoom control, mobile
    # section pill) that must read against bright content below.
    background: "rgba(11, 18, 32, 0.72)"
    blur: 20px
    saturate: 160%
    shadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 18px 40px -10px rgba(15,23,42,0.45), 0 4px 10px rgba(15,23,42,0.25)"
  popover:
    background: "rgba(248, 250, 252, 0.70)"
    blur: 24px
    saturate: 160%
  page-backdrop:
    # The dim behind sheets and modals.
    light: "rgba(15, 23, 42, 0.28) + blur(4px)"
    dark: "rgba(0, 0, 0, 0.55) + blur(4px)"

# ───────────────────────────── Motion ─────────────────────────────
motion:
  easing:
    standard: "cubic-bezier(0.4, 0, 0.2, 1)" # default transitions
    spring-out: "cubic-bezier(0.2, 0.8, 0.2, 1)" # sheet/popover appears
    ios-sheet: "cubic-bezier(0.32, 0.72, 0, 1)" # ATS modal rise
    ease-out: "ease-out" # gentle fades
  durations:
    instant: 100ms # button colour/border, input hover
    fast: 150ms # accordion border, chev rotate
    short: 200ms # tile hover lifts, chev transforms
    medium: 280ms # page content fade-in-up
    sheet: 300ms # bottom sheet & ATS modal
  keyframes:
    fade-in-up:
      duration: 280ms
      easing: ease-out
      from: { opacity: 0, translateY: 10px }
      to: { opacity: 1, translateY: 0 }
    scale-in:
      duration: 160ms
      easing: spring-out
      from: { opacity: 0, scale: 0.96 }
      to: { opacity: 1, scale: 1 }
    sheet-rise:
      duration: 220ms
      easing: spring-out
      from: { translateY: 100% }
      to: { translateY: 0 }
    ats-slide-up:
      duration: 300ms
      easing: ios-sheet
      from: { translateY: 28px, opacity: 0.7 }
      to: { translateY: 0, opacity: 1 }
    field-glow:
      # Soft pulsating brand halo that breathes three times (~4s) when
      # the user taps an Insight to jump to a specific résumé field.
      duration: 4s
      easing: standard
      shape: "triple decaying pulse of brand box-shadow, 0 → 14px ring"
  hover-affordance:
    button-press: "translateY(1px) on :active"
    tile-lift: "translateY(-1px) + shadow-md on :hover"
    icon-pill: "scale(1.05) + translateY(-1px) on :group-hover"

# ───────────────────────────── Focus & a11y ───────────────────────
focus:
  ring: "0 0 0 3px rgba(37, 99, 235, 0.18)" # soft brand halo; never hairline
  input-focused-border: primary-600
  respects-visible-only: true # uses :focus-visible — keyboard-only ring
contrast:
  body-on-surface: "ink-1 on surface → AAA in light, AA in dark"
  muted-on-surface: "ink-4 used only for labels and sub-text, never buttons"
touch:
  minimum-target: 38px
  iOS-zoom-guard: "16px input font size on mobile"
motion-safe:
  reduced-motion: "long animations (field-glow, sheet-rise) should shorten or suppress"
print:
  page-size: [A4, Letter]
  behavior: "chrome hidden, .resume-page isolated to 210x297mm (A4) or 216x279mm (Letter); dark-mode brightness filter stripped; every .tpl-link becomes a real PDF link annotation"

# ───────────────────────────── Component primitives ──────────────
components:
  toolbar-button:
    # `.tb` — the canonical toolbar button. Ghost / primary / danger-ghost
    # variants opt in via modifier classes.
    height-mobile: 38px
    height-desktop: 34px
    padding-x: 12px
    gap: 8px
    font: "13px / sans / medium / ink-2"
    radius: md # 8px
    border: "1px solid line"
    background: surface
    hover: { background: surface-2, border: "#D6DADF" }
    active: { translateY: 1px }
    variants:
      ghost: "transparent border + background, hover = surface-3"
      primary: "brand-50 bg, brand-200 border, brand-700 text — hover climbs to brand-100/brand-300"
      danger-ghost: "transparent default, hover = danger-bg + danger text"
    group:
      # Segmented button group — shares a single border with inner dividers.
      radius: md
      divider: "1px line"
      height: 32px
  input:
    # `.cr-input` — 16px on mobile (iOS zoom guard), shrinks on desktop.
    radius: md
    border: line
    background: surface
    focus-border: primary-600
    focus-shadow: focus
    invalid: "danger-border + danger-bg/50 + red focus shadow"
    has-issues: "warn-border + amber focus shadow + pr-10 to reserve space for a floating hint badge"
    compact-variant: "smaller padding + 13.5px desktop / 14.5px mobile"
    hint:
      size: 11.5px
      colour: ink-4
      error-colour: danger
  accordion-card:
    # `.acc` — the editor's per-section card.
    radius: lg
    border: line-soft
    background: surface
    open: { border: line, shadow: xs }
    head:
      padding-mobile: "14px 16px"
      padding-desktop: "12px 14px"
      min-height-mobile: 56px
      hover-bg: surface-2
    icon-tile:
      size: 28px
      radius: md
      background: brand-50
      colour: primary-600
    title: { size: 13.5px, weight: 600, colour: ink-1, letter-spacing: -0.005em }
    sub: { size: 12px, colour: ink-4 }
    chevron: "ink-5, rotate 90deg when open"
    body:
      padding: "12px 14px 14px"
      divider: "1px line-hairline"
  sub-card:
    # Single entry inside a list section (one role, one project).
    radius: md
    border: line-soft
    background: surface-2
    padding: "10px → 12px desktop"
  section-rail:
    # Icon-only vertical rail on the left of the desktop shell.
    width: 56px
    tile-size: 40x40
    tile-radius: md
    inactive: "transparent bg, ink-4 glyph, hover = surface-3"
    active:
      bg: brand-50
      glyph: primary-600
      inset-ring: "1px brand-100"
      left-accent-bar: "4px wide, 10px outside the tile, rounded right"
    drawer-variant:
      # Mobile bottom-sheet list; adds label + description + chevron.
      item-min-height: 60px
      icon-tile: 40px (brand gradient when active)
      active-label-colour: brand-700
  glow-tile:
    # Onboarding call-to-action tile. Cursor-tracked radial glow.
    radius: xl
    border: line
    padding: "18px 18px 20px"
    icon-badge:
      size: 38px
      radius: lg
      tints:
        blue: { bg: brand-50, fg: primary-600 }
        violet: { bg: "#F4F0FF", fg: "#7C3AED" }
        green: { bg: "#ECFDF5", fg: "#059669" }
    glow: "260px-radius radial-gradient tracking cursor, fades on leave"
    hover: { translateY: -2px, border: brand-300, shadow: md }
  score-ring:
    # ATS two-score ring — absolute-centered mono numeral inside an SVG.
    numeral: "mono 22px / bold / ink-1 / tabular-nums"
    sub-caption: "mono 9px / uppercase / tracking 0.08em / ink-4"
    orientation: "-90deg so progress starts at 12 o'clock"
  status-pill:
    # OK / Warn / Danger soft-chip used throughout the ATS review.
    radius: full
    variants:
      ok: { bg: ok-bg, border: ok-border, fg: ok }
      warn: { bg: warn-bg, border: warn-border, fg: warn }
      danger: { bg: danger-bg, border: danger-border, fg: danger }
  scrollbar:
    class: .cr-scroll
    width: 10px
    thumb: "rgba(100, 116, 139, 0.30); hover 0.50"
    gutter: stable
  chips-and-tags:
    # Tech-stack chips in templates, language proficiency chips, keyword
    # match badges. Rendered with hairline borders and quiet fills.
    radius: sm
    border: line-soft
    background: surface-2
    font: "mono 11-12px or sans 12px depending on template voice"

# ───────────────────────────── Iconography ────────────────────────
icons:
  library: "lucide-react"
  stroke-width: 2
  default-size: 16px
  accent-pill-size: 28-40px
  brand-marks:
    # Brand icons (GitHub, LinkedIn, Twitter/X) are inlined as SVG paths
    # rather than pulled from Lucide — some have been removed upstream
    # and inline SVG is more print-stable.
    source: inline
    target-sizes: [12, 14, 16, 20]

# ───────────────────────────── Surfaces summary ──────────────────
surfaces:
  canvas: surface-2 # the app background behind everything
  chrome: surface # header, rail, panel
  input: surface
  raised-card: surface-raised # a card sitting inside a glass panel
  preview: preview-bg # gradient behind the résumé pages
  sheet: glass # bottom sheet / modal / popover
  tooltip: glass-dark # floating pill, zoom dock

# ───────────────────────────── Z-index ordinals ──────────────────
z-index:
  content: 0
  preview: 1
  header: 50
  floating-pill: 60
  popover: 80
  sheet-backdrop: 100
  sheet: 110
  modal-backdrop: 140
  modal: 150
  onboarding: 150

# ───────────────────────────── Persona ────────────────────────────
persona:
  voice: "Quietly confident. Technical but warm. Thinks in paper and print."
  inspirations:
    - "Linear — restraint, mono labels, sharp typography."
    - "Arc browser — softer gradients, frosted-glass pickers."
    - "Apple Keynote's inspector panels — accordion sections, muted chrome."
    - "Notion's editor — left rail + main panel discipline."
    - "A clean broadsheet newspaper — the white résumé page as centerpiece."
  words-it-would-use: [crisp, airy, restrained, paper, private, honest]
  words-it-would-avoid: [playful, chunky, neon, busy, skeuomorphic, gamified]
---

# CloakResume — Design Language

## The one-sentence summary

A quiet, paper-first résumé studio: the chrome is ocean-blue and frosted,
the ink is slate, and the centre of attention is always the rendered
**white A4 sheet** — clickable, measured in millimetres, never in pixels.

## Look and feel

CloakResume reads like a modern editor built around a single, precious
artefact — the résumé itself. The working surface is a soft off-white
(`surface-2 · #F8FAFC`) with hairline slate borders; no element in the
chrome has a strong saturated fill. The user's résumé, by contrast, is
rendered on a literal sheet of crisp white paper, floating inside a
gently gradient preview pane with three stacked drop shadows — a short
"paper-on-desk" shadow plus a long diffused ambient shadow. The effect
is that the app itself looks like the frame around a print-ready
document, not a web page.

The signature brand colour is a true **ocean blue** (`#2563EB`). It
appears only where it carries meaning: the active rail tile, the
primary call-to-action, link colour on template output, the soft focus
halo on every interactive control, and the single italic serif word in
the onboarding headline. Everywhere else the chrome deliberately
recedes into ink greys (`ink-1 → ink-6`) and slate-tinted lines, so a
user colour-picking their own brand primary never has to fight the app.

## Typography

Type is the product. The interface runs on **Geist** for sans (with the
`cv11` and `ss01` stylistic sets turned on so the lowercase `a` and the
numerals read as tightly as possible), **Geist Mono** for every label,
score, timestamp, and caps divider, and **Instrument Serif** — italic,
once — in exactly one place: the word "stays yours" in the onboarding
hero. That single serif fragment is the app's emotional signature,
paired against the long restrained sans elsewhere to feel editorial
rather than decorative.

All-caps mono labels (`FIELD NAME`, `LAST SCAN`, section dividers in
templates) are set at 10.5px with 0.08em tracking and `ink-5`. They
read like tooling — small, precise, quiet — and let the body copy be
the louder voice. Body text is 14px / 1.5 on mobile and 13.5px / 1.45
inside desktop editor inputs, because a pointer is more precise than a
thumb. Inputs on mobile are always ≥16px to sidestep iOS's auto-zoom.

## Surfaces and elevation

Four surfaces stack cleanly on top of each other:

1. **Canvas** — `surface-2` / `page-bg`. The whole-app backdrop.
2. **Chrome** — `surface` / white. Header, rail, panel. A single hairline
   `line` border is the divider between every chrome region.
3. **Glass** — translucent frosted pane (rgba-white @ 88% opacity,
   14px backdrop-blur, 1px slate-tinted border, paired tinted shadows).
   Used for _every_ overlay in the app: dropdowns, colour picker, date
   picker, bottom sheet, ATS review modal. Keeping overlays consistent
   makes the app feel like one coherent design language rather than a
   collection of widgets.
4. **Page** — pure white with a multi-layer soft shadow, 2px corner
   radius. The literal résumé sheet. In dark mode the chrome goes deep
   navy and the page gets a subtle `brightness(0.88) contrast(0.98)`
   filter so it doesn't glare — but print and PDF export strip that
   filter so output always looks designed-for-paper.

The shadow system is built from **paired tinted shadows** — a crisp
short shadow plus a soft long shadow, both using `rgba(15, 23, 42, *)`
in light mode so they read as slate instead of black. Every popup uses
the same `lg` / `xl` shadow recipe so the visual "weight" of a menu, a
sheet, and a modal is consistent.

## The shell

The desktop shell is a three-column CSS grid: **56px** icon rail · **400px**
editor panel · **1fr** preview. The rail is icon-only (tooltips on hover);
the active section gets a brand-tinted tile, a 1px inset brand ring, and
— the one piece of strong accent in the whole chrome — a 4px bright
brand accent bar extending outside the tile's left edge, so the selected
row is scannable from the far edge of the rail. This is the only place
the brand is applied as a saturated block.

Below 1024px the shell collapses to a single view. A segmented
**Edit / Preview** toggle in the header swaps between the editor stack
and the preview. A floating dark-glass **section pill** hovers above the
bottom safe-area, showing the current section name; tapping it opens a
full-width bottom sheet with the section list (same rail, different
variant — icon + label + description + chevron).

## The editor — accordion-first

The editor panel is a column of `.acc` accordion cards. Closed, each
card is a 14px-padded row: a 28px brand-tinted icon tile, a 13.5px
semibold title, a 12px muted sub-line, and a chevron that rotates 90°
on open. Cards stack with 10px vertical rhythm and have a
`line-soft` hairline border that firms up to `line` + an `xs` shadow
when opened. The open card reveals `cr-stack`-spaced form fields —
mono caps labels, 8px-radius inputs with the focus halo, and optional
`sub-card` containers for list entries (one per role, one per project),
nested at `surface-2` so they visually recede from the main card.

Invalid fields flip to danger-bordered with a red focus halo; fields
with live writing-hint findings turn amber and reserve 10px of
right-padding so the floating badge never overlaps user text.

## Overlays — the frosted-glass language

Every overlay in CloakResume uses the same three-layer recipe:

- **Backdrop** — `rgba(15, 23, 42, 0.28)` with a 4px blur on the page
  behind it. Strong enough to push the chrome into the background,
  weak enough to keep the user's résumé faintly visible.
- **Pane** — white at 88% opacity, 14px backdrop-blur, 1px slate-tinted
  border, paired tinted shadows. Corners: 14px (popovers) or 20px
  (bottom sheets).
- **Content** — plain white cards inside the glass. _Never_ translucent
  stacked on translucent; score numbers, form fields, and result cards
  always sit on solid `surface-raised` so legibility is absolute.

The bottom sheet animates in with a 220ms `spring-out` `sheet-rise`;
the ATS review modal uses a 300ms iOS-style `ats-slide-up` that
combines a short translate with a soft opacity ramp. Popovers and
dropdowns use a fast 160ms `scale-in`. These three durations — short,
medium, sheet — are the entire motion vocabulary.

## Motion

Motion is short, confident, and purpose-driven. Three principles:

- **Instant for pointer response** — 100ms colour/border transitions
  on every hover; 150ms on accordions. Nothing that a user can click
  twice takes longer than that.
- **Spring-out for arrivals** — anything new that appears (popover,
  dropdown, sheet, modal) uses a `cubic-bezier(0.2, 0.8, 0.2, 1)`
  so the last 20% of the movement softens. Never a bouncy overshoot.
- **Field glow for navigation** — when the user taps an Insight to
  jump to a specific field, the target input pulses a soft brand
  halo three times over ~4 seconds. Each pulse decays slightly; the
  user's eye is drawn to it without being yanked there.

Everything else is still: no idle shimmer, no "breathing" logos, no
skeleton animations that outlast the data.

## Colour as meaning

Status colours are **earthy, not neon**: forest `#059669` for OK,
amber `#D97706` for warn, burnt-red `#DC2626` for danger. They appear
exclusively inside the ATS review scorecards, validation states, and
the onboarding trust strip. In dark mode they punch up just enough to
stay legible — `#34D399`, `#FBBF24`, `#F87171` — and their
surround/background shifts to a translucent rgba fill with a matching
translucent border, so the chip itself never becomes a bright block.

Brand tints are _derived_, not hard-coded. The user picks a primary
colour; a small palette utility produces the `brand-50 → brand-700`
ladder live, and in dark mode those tints are re-expressed with
`color-mix(in oklab, …)` so translucent brand tiles stay crisp
against deep slate. No matter what primary the user picks, the app
stays visually coherent.

## The résumé canvas itself

The preview pane is the one area that ignores the design system on
purpose. It must look like paper, and paper is measured in millimetres:

- `.resume-page` is literally 210mm × 297mm (A4) or 216mm × 279mm
  (Letter). The box-shadow stack gives it a short "contact with desk"
  shadow plus a long ambient shadow.
- Pagination is computed from real rendered content — when a section
  overflows the page, the canvas slices it into an exact second page.
- Links in templates render as `.tpl-link` — a 1px dotted underline
  inheriting the current ink colour, turning brand-blue on hover.
  The PDF export re-walks the DOM and converts every one into a real
  PDF link annotation, so contact URLs stay clickable in the output.
- Print and PDF export strip every chrome-side filter: the dark-mode
  dimming, the backdrop-blur on glass panels hidden behind it, all of
  it. The printed résumé is always the designed-for-paper version.

Fifteen templates ship across five families (ATS-Safe, Classic,
Modern, Creative, Academic). They share the same `ResumeData` shape,
the same contact-icon set, the same uppercase-tracked section dividers
(`.uppercase-track`), and the same link treatment — so switching
templates feels like reformatting, never like rewriting.

## Dark mode

Dark mode is driven by `data-theme="dark"` on `<html>` with an
OS-preference fallback (`@media (prefers-color-scheme: dark)`), and
the user's explicit toggle always wins. The ink ladder inverts —
`ink-0 = #F8FAFC`, `ink-6 = #475569` — and surfaces move to a
deep-navy ramp (`#0F172A → #0B1220 → #1E293B`). The glass panes
retune to `rgba(15, 23, 42, 0.78)` with a thin white-rgba border so
they still read as translucent-over-something instead of as solid
navy blocks. Shadows deepen to true-black at higher alphas because
coloured shadows vanish into the dark canvas.

The résumé page itself **stays white**. This is deliberate and
non-negotiable: the exported PDF must look the same regardless of the
user's chrome preference, and a user reading their résumé next to the
printed version needs them to match. The only concession is a gentle
brightness filter so the bright page doesn't glare; print and PDF
strip it.

## Accessibility notes

- The focus ring is a **soft brand halo** (`0 0 0 3px rgba(37, 99, 235, 0.18)`),
  applied via `:focus-visible` so mouse clicks don't leave a
  lingering ring but keyboard navigation always shows one.
- All touch targets are ≥38px on mobile, ≥34px on desktop. Rail
  tiles are 40×40.
- Inputs never drop below 16px on mobile to prevent iOS auto-zoom.
- Muted text (`ink-4` / `ink-5`) is reserved for _labels_, _hints_,
  and _sub-captions_ — never used for actionable text.
- Dark-mode shadows, borders, and chip fills all use rgba so the
  underlying surface shows through; no element relies on a single
  colour for its semantics.

## What this design system is _not_

- Not playful. There are no rounded mascots, no gradient icons, no
  skeuomorphic paper textures. The paper metaphor is carried entirely
  by proportion, shadow, and millimetre measurement.
- Not aggressively branded. The app willingly steps out of the way so
  the user's résumé — and their chosen primary colour — is the thing
  the eye locks onto.
- Not chunky. Radii top out at 20px (on the biggest cards); most
  chrome sits at 8–10px. Buttons are 34–38px tall. Nothing in the
  interface is trying to feel big or important.
- Not dense, either. Vertical rhythm is generous (16px between editor
  cards, 14px inside), and whitespace around the résumé page in the
  preview is intentional — it's the "margin around a framed document"
  feel, not a cramped inspector panel.

The north star is simple: a user should open CloakResume, see their
résumé rendered like a real document on a real page, edit it through
a quiet sidebar that looks like a professional tool rather than a
marketing site, and export something that prints cleanly on A4. The
design system exists to make that experience feel inevitable.
