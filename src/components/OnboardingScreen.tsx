/**
 * Landing / welcome screen.
 *
 * Shown on first run (when there is no persisted resume in
 * localStorage) and also when the user clicks "New" in the toolbar to
 * start over. This is a full-screen experience — sticky nav, hero with
 * primary CTA tiles, feature grid, "How it works" + Cloakyard family
 * cards, and a slim attribution row.
 *
 * When `onDismiss` is supplied, Escape-to-close is wired up so the
 * mid-session "New" flow can bail out. No visible close button — the
 * primary CTAs are the way forward, Escape is the way back.
 */

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Dices,
  EyeOff,
  FilePen,
  FileText,
  FolderOpen,
  GitFork,
  Laptop,
  MonitorSmartphone,
  Palette,
  Rocket,
  Scale,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  SpellCheck,
  SquareDashed,
  Star,
  UserRoundCheck,
  WifiOff,
} from "lucide-react";
import { GRAINIENT_DARK, GRAINIENT_LIGHT, GRAINIENT_MOTION } from "../constants/grainient.ts";
import { usePrefersDark } from "../utils/usePrefersDark.ts";
import { Grainient } from "./Grainient.tsx";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal.tsx";

const GITHUB_URL = "https://github.com/cloakyard/cloakresume";
const GITHUB_LICENSE_URL = "https://github.com/cloakyard/cloakresume/blob/main/LICENSE";
const CLOAKYARD_URL = "https://github.com/cloakyard";
const AUTHOR_URL = "https://github.com/sumitsahoo";

declare const __APP_VERSION__: string;

/* Frozen brand palette, applied as inline CSS vars on the
 * OnboardingScreen root so the entire landing page renders as
 * CloakResume emerald regardless of the user's stored editor primary.
 *
 * The editor lets the user theme `--color-primary-*` to any colour
 * (Ocean blue, Indigo, Rose, …) and persists that pick to localStorage.
 * That's exactly right for the editor + preview — they should reflect
 * the user's craft. But the landing page is brand identity, not a
 * preview, and it has to read as CloakResume green every time.
 *
 * Two reasons every token is pinned, not just `--color-primary-*`:
 *   1. The user can pick any primary in the editor, which writes
 *      `--color-primary-*` onto :root.
 *   2. In dark mode `--brand-*` are defined at :root as
 *      `color-mix(in oklab, var(--color-primary) NN%, transparent)`.
 *      Custom properties are substituted at the declaring element,
 *      so a descendant override of `--color-primary` does NOT reach
 *      back into those already-computed `--brand-*` values — they
 *      have to be pinned explicitly. */
const LANDING_BRAND_PALETTE: CSSProperties = {
  "--color-primary-50": "#ecfdf5",
  "--color-primary-100": "#d1fae5",
  "--color-primary-200": "#a7f3d0",
  "--color-primary-300": "#6ee7b7",
  "--color-primary-400": "#34d399",
  "--color-primary-500": "#10b981",
  "--color-primary-600": "#047857",
  "--color-primary-700": "#065f46",
  "--color-primary-800": "#064e3b",
  "--color-primary-900": "#022c22",
  "--color-primary": "#047857",
  "--brand": "#047857",
  "--brand-hover": "#065f46",
  "--brand-active": "#064e3b",
  "--brand-50": "#ecfdf5",
  "--brand-100": "#d1fae5",
  "--brand-200": "#a7f3d0",
  "--brand-300": "#6ee7b7",
  "--brand-600": "#047857",
  "--brand-700": "#065f46",
} as CSSProperties;

/* ────────────────────────────────────────────────────────────────
 * Glow card — shared mechanic used by the primary CTA tiles. Renders
 * a radial gradient that follows the pointer (or touch point) for a
 * premium hover feel.
 * ──────────────────────────────────────────────────────────────── */

interface GlowCardProps {
  children: ReactNode;
  glow: string;
  onClick?: () => void;
  as?: "button" | "div";
  className?: string;
  ariaLabel?: string;
}

function GlowCard({
  children,
  glow,
  onClick,
  as = "button",
  className = "",
  ariaLabel,
}: GlowCardProps) {
  const ref = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const [glowStyle, setGlowStyle] = useState<CSSProperties>({ opacity: 0 });

  const setGlowAt = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setGlowStyle({
        opacity: 1,
        background: `radial-gradient(320px circle at ${clientX - rect.left}px ${clientY - rect.top}px, ${glow}, transparent 70%)`,
      });
    },
    [glow],
  );

  const baseClass =
    "group relative overflow-hidden border border-(--line) bg-(--surface) rounded-2xl transition-[border-color,box-shadow,transform] duration-200 hover:border-(--brand-300) hover:shadow-(--sh-md) hover:-translate-y-0.5";

  const interactionProps = {
    onMouseMove: (e: React.MouseEvent) => setGlowAt(e.clientX, e.clientY),
    onMouseLeave: () => setGlowStyle({ opacity: 0 }),
    onTouchStart: (e: React.TouchEvent) => setGlowAt(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => setGlowAt(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: () => setGlowStyle({ opacity: 0 }),
    onTouchCancel: () => setGlowStyle({ opacity: 0 }),
  };

  const glowOverlay = (
    <div
      className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300 z-0"
      aria-hidden="true"
      style={glowStyle}
    />
  );

  if (as === "div") {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={`${baseClass} ${className}`}
        {...interactionProps}
      >
        {glowOverlay}
        <div className="relative z-[1]">{children}</div>
      </div>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseClass} ${className} text-left cursor-pointer text-(--ink-1)`}
      {...interactionProps}
    >
      {glowOverlay}
      <div className="relative z-[1]">{children}</div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────
 * CtaCard — the three primary entry-point tiles (Start blank / Load
 * sample / Load saved) all render through this. Layout is a strict
 * vertical stack: icon → title row → description, with the optional
 * badge (Recommended / Fictional) flowing INLINE beside the title
 * rather than living in a corner or a reserved top row. That keeps
 * every card visually balanced whether or not it has a badge: cards
 * without one simply have a title on its own line, and cards with
 * one get a small chip riding alongside the title.
 *
 * Why inline-with-title (not corner-anchored):
 *   - The badge labels the title, so reading-order pairs them.
 *   - No wasted top-row real estate when the badge is absent.
 *   - The icon, title, description, and arrow sit at identical
 *     positions across all three cards by simple flow layout — no
 *     absolute positioning gymnastics, no perceived drift.
 *
 * Both badge variants share `bg-(--brand-50) text-(--brand)`. In dark
 * mode `--brand-50` and `--brand` are pinned to the emerald palette
 * by LANDING_BRAND_PALETTE on the OnboardingScreen root, so the chip
 * stays light-emerald-on-dark-emerald against either canvas.
 * ──────────────────────────────────────────────────────────────── */

interface CtaCardProps {
  onClick: () => void;
  ariaLabel: string;
  icon: ReactNode;
  /** Adds a -6deg hover tilt to the icon — used on Load sample to
   *  reinforce the "shuffle / dice" feel. Off by default. */
  iconRotateOnHover?: boolean;
  title: string;
  description: string;
  /** Optional badge that flows next to the title. Pass `undefined`
   *  for cards that have no badge (e.g. Load saved). */
  badge?: { label: string; icon?: ReactNode };
}

function CtaCard({
  onClick,
  ariaLabel,
  icon,
  iconRotateOnHover,
  title,
  description,
  badge,
}: CtaCardProps) {
  return (
    <GlowCard onClick={onClick} glow="rgba(5, 150, 105, 0.22)" ariaLabel={ariaLabel}>
      <div className="relative px-5 py-6 sm:p-6 flex flex-col gap-2.5">
        <span
          className={`w-11 h-11 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105${
            iconRotateOnHover ? " group-hover:-rotate-6" : ""
          }`}
        >
          {icon}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
            {title}
          </span>
          {badge && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md bg-(--brand-50) text-(--brand)"
              aria-hidden="true"
            >
              {badge.icon}
              {badge.label}
            </span>
          )}
        </div>
        <span className="text-[13px] leading-normal text-(--ink-4)">{description}</span>
        <ArrowRight
          className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-4 h-4 text-(--ink-5) opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-(--brand)"
          aria-hidden="true"
        />
      </div>
    </GlowCard>
  );
}

/* Relative-time formatter for the "Saved Nm ago" caption under the
 * Resume-editing CTA. Coarse buckets only — anything older than a day
 * falls back to a date string. Returns null on bad input so the caller
 * can hide the caption rather than render "NaN ago". */
function formatRelativeTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return "just now";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ────────────────────────────────────────────────────────────────
 * GitHub mark — inline SVG so we don't pull in another dep.
 * ──────────────────────────────────────────────────────────────── */
function GithubMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Landing page.
 * ──────────────────────────────────────────────────────────────── */

interface Props {
  onStartBlank: () => void;
  onLoadSample: () => void;
  onLoadFile: (file: File) => void;
  /** Optional close handler — enables Escape to dismiss. */
  onDismiss?: () => void;
  /**
   * Optional "continue where you left off" handler. When provided, a
   * primary "Resume editing" tile is rendered ahead of the other CTAs.
   * Intended for the mid-session "New" flow, where existing work is
   * still in localStorage and the user may want to back out of
   * starting over.
   */
  onResumeEditing?: () => void;
  /**
   * ISO timestamp of the most recent persistence write. Rendered as a
   * "Saved 2h ago" caption under the Resume-editing CTA so a returning
   * visitor can confirm the draft they're about to pick up is the one
   * they expect.
   */
  lastSavedAt?: string;
}

export function OnboardingScreen({
  onStartBlank,
  onLoadSample,
  onLoadFile,
  onDismiss,
  onResumeEditing,
  lastSavedAt,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const isDark = usePrefersDark();
  const palette = isDark ? GRAINIENT_DARK : GRAINIENT_LIGHT;

  useEffect(() => {
    if (!onDismiss) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  /* The editor shell locks `body { overflow: hidden; height: 100% }` in
   * index.css so its 3-column grid owns scrolling. That lock has to be
   * lifted on the welcome screen — iOS Safari only collapses its URL
   * bar when the *document* scrolls, never when an inner container
   * does. Without the override, the bar stays at full height (~100px
   * tall) and the Grainient bottom-mask has nothing to align against.
   * We restore the editor's lock on unmount. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlHeight: html.style.height,
      htmlOverflow: html.style.overflow,
      bodyHeight: body.style.height,
      bodyOverflow: body.style.overflow,
    };
    html.style.height = "auto";
    html.style.overflow = "visible";
    body.style.height = "auto";
    body.style.overflow = "visible";
    return () => {
      html.style.height = prev.htmlHeight;
      html.style.overflow = prev.htmlOverflow;
      body.style.height = prev.bodyHeight;
      body.style.overflow = prev.bodyOverflow;
    };
  }, []);

  return (
    <div
      className="relative z-150 flex flex-col min-h-svh text-(--ink-1)"
      style={{ background: "var(--onboarding-bg)", ...LANDING_BRAND_PALETTE }}
    >
      {/* Emerald-toned animated WebGL backdrop. Palette + motion live
          in src/constants/grainient.ts so any future surface that wants
          the same gradient (editor shell, marketing pages) can read
          from one source. The .grainient-fixed class positions it as a
          page backdrop: fixed inset-0, z-0, with the iOS URL-bar mask
          on phones so the floating Safari bar samples the page bg, not
          the shader output. */}
      <Grainient className="grainient-fixed" {...GRAINIENT_MOTION} {...palette} />

      <div className="relative flex flex-col flex-1 min-h-0">
        {/* ── Nav ──────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-20 backdrop-blur-md bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] border-b border-(--line-soft)">
          <div className="max-w-[1180px] mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Use the circular favicon mark in chrome (not the
                  full-bleed PWA logo) so the brand reads as a circular
                  badge — matches the CloakPDF / CloakIMG header. */}
              <img
                src="/icons/favicon.svg"
                alt=""
                aria-hidden="true"
                className="w-10 h-10 shrink-0 drop-shadow-sm"
              />
              <div className="font-semibold text-(--ink-1) text-[19px] tracking-tight whitespace-nowrap">
                Cloak<span className="text-(--brand)">Resume</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-(--ink-3) tracking-[0.01em] whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-(--brand)" aria-hidden="true" />
                <span className="hidden sm:inline">100% Private · Open Source</span>
                <span className="sm:hidden">Private</span>
              </span>
              <span aria-hidden="true" className="w-px h-5 bg-(--line)" />
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="grid place-items-center text-(--ink-4) transition-colors duration-100 hover:text-(--ink-1)"
                aria-label="View CloakResume on GitHub"
              >
                <GithubMark className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────
             Two-column layout on large screens: a left-aligned
             headline + subtitle on the left, a stylised paper
             "résumé page" mockup on the right. Below the breakpoint
             both columns stack and the mockup is hidden — the CTA
             tiles already carry the "what you'll do next" weight on
             phones and the mockup adds visual padding that hurts
             single-column rhythm.

             The CTA cluster sits below the two-column hero (full
             width) so the three-tile row keeps its airy proportions
             and the "Resume editing" wide card has room to breathe. */}
        <section className="relative max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-24 pb-10 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-[34px] sm:text-[46px] md:text-[58px] lg:text-[60px] font-semibold text-(--ink-1) tracking-[-0.03em] leading-[1.05] m-0 max-w-[900px] mx-auto lg:mx-0 animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
                Build a résumé that{" "}
                <em className="font-serif italic font-normal text-(--brand)">stays yours</em>.
              </h1>

              <p className="text-(--ink-3) text-[15px] sm:text-[17px] md:text-[18px] leading-[1.55] max-w-[640px] mx-auto lg:mx-0 mt-5 sm:mt-6 animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
                Beautifully designed templates, real ATS analysis, and zero servers. Your data is
                stored locally — nothing is ever uploaded.
              </p>

              {/* Primary hero CTA — small, left-aligned on desktop.
                  Contextual: when there's saved work it picks up
                  editing where the user left off; otherwise it
                  starts a fresh blank résumé. Functionally
                  duplicates one of the larger CTA tiles below, but
                  giving the hero its own button (alongside the
                  headline) lets visitors act without scrolling and
                  matches the CloakIMG / CloakPDF landing rhythm. */}
              {/* Hero CTA — only shown to returning visitors with a
                  saved draft. A wider draft "card-button" with
                  eyebrow + title + saved-time metadata and a chevron
                  affordance; the whole surface is the button so the
                  hierarchy reads Your draft → Continue where you left
                  off → saved time → arrow. First-time visitors don't
                  get a hero CTA — the three tiles below (with "Start
                  blank" marked Recommended) already carry the
                  pick-your-starting-point story. */}
              {onResumeEditing && (
                <div className="mt-6 sm:mt-7 flex justify-center lg:justify-start animate-[fade-in-up_0.6s_ease-out_0.18s_both]">
                  {(() => {
                    const rel = formatRelativeTime(lastSavedAt);
                    return (
                      <button
                        type="button"
                        onClick={onResumeEditing}
                        aria-label={
                          rel
                            ? `Resume editing your saved draft — saved ${rel}`
                            : "Resume editing your saved draft"
                        }
                        className="group relative flex items-center gap-3.5 sm:gap-4 w-full max-w-md p-4 sm:p-4.5 rounded-2xl border border-(--brand-300) bg-[color-mix(in_oklab,var(--brand-50)_55%,var(--surface))] dark:bg-[color-mix(in_oklab,var(--brand)_14%,var(--surface))] text-left cursor-pointer shadow-[inset_0_1px_0_color-mix(in_oklab,var(--brand)_10%,transparent),0_10px_28px_-14px_color-mix(in_oklab,var(--brand)_38%,transparent)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-(--brand-600) hover:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--brand)_18%,transparent),0_16px_36px_-12px_color-mix(in_oklab,var(--brand)_45%,transparent)] active:translate-y-0 focus-visible:outline-none focus-visible:shadow-[var(--sh-cta),var(--sh-focus)]"
                      >
                        <span
                          className="shrink-0 w-11 h-11 rounded-xl grid place-items-center bg-(--brand) text-white shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
                          aria-hidden="true"
                        >
                          <FilePen className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-(--brand)">
                            Your draft
                          </span>
                          <span className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.005em] text-(--ink-1) leading-tight">
                            Continue where you left off
                          </span>
                          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-(--ink-4)">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-(--brand)"
                              aria-hidden="true"
                            />
                            {rel ? `Saved ${rel}` : "Saved draft ready"}
                          </span>
                        </span>
                        <ArrowRight
                          className="shrink-0 w-5 h-5 text-(--brand) transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Trust strip — three quiet pills under the CTA. The
                  privacy promise is already carried by the nav pill
                  ("100% Private · Open Source"), so this strip stays
                  complementary: each pill answers a different
                  zero-friction question (no sign-up needed? works
                  offline? ATS-aware?) without duplicating the header. */}
              <div className="mt-5 sm:mt-6 flex flex-wrap justify-center lg:justify-start gap-x-4.5 gap-y-2 text-[12.5px] text-(--ink-4) animate-[fade-in-up_0.6s_ease-out_0.22s_both]">
                <span className="flex items-center gap-1.5">
                  <UserRoundCheck className="w-3.5 h-3.5 text-(--brand)" /> No sign-up
                </span>
                <span className="flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-(--brand)" /> Works offline
                </span>
                <span className="flex items-center gap-1.5">
                  <ScanSearch className="w-3.5 h-3.5 text-(--brand)" /> ATS-ready
                </span>
              </div>
            </div>

            {/* Decorative résumé mockup — only on lg+. Pure
                presentation; doesn't render real ResumeData (the live
                preview lives inside the editor). The shapes mirror
                the actual CloakResume layout (avatar + name +
                headline; section dividers; bulleted body) so the
                hero answers "what does the output look like?" at a
                glance. */}
            <div
              aria-hidden="true"
              className="hidden lg:block animate-[fade-in-up_0.6s_ease-out_0.2s_both]"
            >
              <ResumeMockup />
            </div>
          </div>

          {/* Primary CTAs.
           *
           * The wide "Resume editing" card that used to sit above
           * the 3-tile row was removed once the hero gained its own
           * Resume-editing button — keeping both was redundant. The
           * "Or start over · replaces saved work" divider stays
           * (still gated on `onResumeEditing`) so the user is
           * warned that the tiles below overwrite their work. */}
          <div className="mt-10 sm:mt-12 max-w-225 mx-auto flex flex-col gap-3 sm:gap-4 animate-[fade-in-up_0.6s_ease-out_0.25s_both]">
            {onResumeEditing && (
              <div
                role="note"
                aria-label="The options below replace the work saved in your browser"
                className="flex items-center gap-3 sm:gap-4 px-1 mt-1 sm:mt-2"
              >
                <span className="h-px flex-1 bg-(--line-soft)" aria-hidden="true" />
                <span className="inline-flex items-center gap-2 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--ink-5)">
                  <span>Or start over</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-(--ink-6)" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1 normal-case tracking-normal font-medium text-warn">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    replaces saved work
                  </span>
                </span>
                <span className="h-px flex-1 bg-(--line-soft)" aria-hidden="true" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <CtaCard
                onClick={onStartBlank}
                ariaLabel={
                  onResumeEditing
                    ? "Start a blank résumé — replaces the work saved in your browser"
                    : "Start a blank résumé from a clean template (recommended)"
                }
                icon={<SquareDashed className="w-5 h-5" />}
                title="Start blank"
                description="Begin with a clean template and make it yours."
                badge={
                  !onResumeEditing
                    ? { label: "Recommended", icon: <Star className="w-3 h-3" /> }
                    : undefined
                }
              />

              <CtaCard
                onClick={onLoadSample}
                ariaLabel="Load a randomly-generated sample résumé — content is fictional"
                icon={<Sparkles className="w-5 h-5" />}
                iconRotateOnHover
                title="Load sample"
                description="Fresh, randomly-generated content every time — names and details are fictional, not real people."
                badge={{ label: "Fictional", icon: <Dices className="w-3 h-3" /> }}
              />

              <CtaCard
                onClick={() => fileRef.current?.click()}
                ariaLabel="Load a saved résumé from a local file"
                icon={<FolderOpen className="w-5 h-5" />}
                title="Load saved"
                description="Continue from a JSON file you previously saved."
              />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLoadFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────── */}
        <section className="relative max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-14 sm:pb-20">
          <div className="text-center mb-8 sm:mb-12">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--brand) mb-2.5">
              Why CloakResume
            </div>
            <h2 className="text-[24px] sm:text-[30px] md:text-[36px] font-semibold text-(--ink-1) tracking-[-0.02em] leading-[1.15] m-0">
              Everything you need, nothing you don&apos;t.
            </h2>
            <p className="text-(--ink-3) text-[14px] sm:text-[15.5px] leading-[1.55] max-w-[560px] mx-auto mt-3">
              A modern résumé builder that respects your privacy — built for people who care about
              their data and their craft.
            </p>
          </div>

          {/* All feature icons share the brand-emerald tint so the grid
              reads as one coherent system. The shape of each icon
              carries the meaning; colour is the single brand voice. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-7 sm:gap-y-8">
            <FeatureItem
              icon={<UserRoundCheck className="w-5 h-5" />}
              title="No sign-up"
              description="No accounts, no email, no passwords. Start building the moment the page loads."
            />
            <FeatureItem
              icon={<EyeOff className="w-5 h-5" />}
              title="No tracking"
              description="Zero analytics, zero telemetry, zero third-party scripts. You stay invisible."
            />
            <FeatureItem
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Local-first"
              description="Every keystroke stays in your browser. Nothing is ever uploaded to any server."
            />
            <FeatureItem
              icon={<WifiOff className="w-5 h-5" />}
              title="Works offline"
              description="Once the app is cached, keep editing and exporting without a connection — flights, trains, anywhere."
            />
            <FeatureItem
              icon={<Rocket className="w-5 h-5" />}
              title="Installable as a PWA"
              description="Add CloakResume to your home screen for a full-screen, app-like experience that launches in one tap."
            />
            <FeatureItem
              icon={<MonitorSmartphone className="w-5 h-5" />}
              title="Mobile, tablet & desktop"
              description="Editor and live preview adapt fluidly across every screen size — draft on the go, polish at your desk."
            />
            <FeatureItem
              icon={<ScanSearch className="w-5 h-5" />}
              title="Real ATS analysis"
              description="Paste a job description and get actionable feedback on keywords, formatting, and match."
            />
            <FeatureItem
              icon={<SpellCheck className="w-5 h-5" />}
              title="Spelling & grammar"
              description="A built-in Harper-powered pass flags typos, clunky phrasing, and passive voice as you edit."
            />
            <FeatureItem
              icon={<Palette className="w-5 h-5" />}
              title="Beautiful templates"
              description="Carefully crafted layouts that look great on screen, in print, and through every PDF reader."
            />
            <FeatureItem
              icon={<FileText className="w-5 h-5" />}
              title="Crisp PDF export"
              description="Pixel-perfect exports with proper typography, selectable text, and print-ready margins."
            />
            <FeatureItem
              icon={<Laptop className="w-5 h-5" />}
              title="Light & dark mode"
              description="Thoughtful theming that follows your system or respects your manual choice."
            />
            <FeatureItem
              icon={<GitFork className="w-5 h-5" />}
              title="Free & open source"
              description="MIT-licensed and on GitHub. Fork it, self-host it, or audit every byte — nothing is hidden."
            />
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────
             Two bento cards (How it works + Cloakyard family promo)
             plus a slim attribution row underneath. Mirrors the
             CloakIMG / CloakPDF Layout footer so the Cloakyard family
             reads consistently across products. The corner glow on
             each card is painted as a radial-gradient background-image
             (not a blurred absolute child) — same iOS-Safari-friendly
             trick the sister apps use to avoid `overflow-hidden +
             rounded-2xl + backdrop-filter` clipping bugs. */}
        <footer
          className="relative mt-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto max-w-[1100px] px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7">
            <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              {/* How it works card — emerald glow anchored top-right */}
              <div
                className="relative flex flex-col rounded-2xl border border-(--line-soft) bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] p-5 backdrop-blur-md"
                style={{
                  backgroundImage:
                    "radial-gradient(280px 280px at 100% 0%, rgba(5, 150, 105, 0.18) 0%, rgba(5, 150, 105, 0.06) 38%, transparent 68%)",
                }}
              >
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--brand)">
                      How it works
                    </div>
                    <span
                      translate="no"
                      className="inline-flex shrink-0 items-center rounded-full border border-(--line-soft) bg-[color-mix(in_oklab,var(--ink-1)_4%,transparent)] px-2 py-0.5 font-mono text-[10px] tabular-nums tracking-tight text-(--ink-4)"
                    >
                      v{__APP_VERSION__}
                    </span>
                  </div>
                  <h3 className="mt-2 text-[17px] sm:text-[19px] font-semibold tracking-[-0.01em] text-(--ink-1)">
                    From blank page to hired, in three steps.
                  </h3>
                </div>
                <ol className="relative mt-4 flex flex-col gap-3 list-none p-0 m-0">
                  <FooterStep
                    n={1}
                    title="Fill in your details"
                    description="Work through each section with inline hints and autosave. Nothing leaves the browser."
                  />
                  <FooterStep
                    n={2}
                    title="Scan against a job"
                    description="Paste a job description and let the ATS panel surface keywords, gaps, and wins."
                  />
                  <FooterStep
                    n={3}
                    title="Export & apply"
                    description="Download a polished PDF or save a JSON to continue on another device — your choice."
                  />
                </ol>
              </div>

              {/* Cloakyard family promo card — emerald glow anchored bottom-left */}
              <a
                href={CLOAKYARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between rounded-2xl border border-(--line-soft) bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] p-5 text-inherit no-underline backdrop-blur-md transition-colors hover:border-(--brand-300)"
                style={{
                  backgroundImage:
                    "radial-gradient(280px 280px at 0% 100%, rgba(5, 150, 105, 0.14) 0%, rgba(5, 150, 105, 0.05) 38%, transparent 68%)",
                }}
              >
                <div className="relative">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/icons/cloakyard.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-7 w-7 drop-shadow-sm"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-(--ink-4)">
                      Part of
                    </span>
                  </div>
                  <h4 className="mt-2.5 text-[17px] sm:text-[19px] font-semibold tracking-[-0.01em] text-(--ink-1)">
                    Cloakyard
                  </h4>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-(--ink-4)">
                    A family of privacy-focused tools that keep your data on your device.
                  </p>
                </div>
                <span className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium text-(--brand)">
                  Explore
                  <ArrowUpRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            </div>

            {/* Slim attribution row */}
            <div className="flex flex-col gap-2 border-t border-(--line-soft) pt-4 text-[12.5px] text-(--ink-4) sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span>Built with care by</span>
                <a
                  href={AUTHOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-(--ink-2) no-underline transition-colors hover:text-(--brand)"
                >
                  Sumit Sahoo
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-[inherit] text-[12.5px] text-(--ink-4) transition-colors hover:text-(--brand)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Privacy
                </button>
                <span aria-hidden="true">·</span>
                <a
                  href={GITHUB_LICENSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-(--ink-4) no-underline transition-colors hover:text-(--brand)"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>MIT licensed</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Sub-components
 * ──────────────────────────────────────────────────────────────── */

interface FeatureItemProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className="shrink-0 w-10 h-10 rounded-lg grid place-items-center bg-(--brand-50) text-(--brand)"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[14.5px] font-semibold tracking-[-0.005em] text-(--ink-1) mb-1">
          {title}
        </div>
        <div className="text-[13.5px] leading-[1.55] text-(--ink-4)">{description}</div>
      </div>
    </div>
  );
}

interface FooterStepProps {
  n: number;
  title: string;
  description: string;
}

function FooterStep({ n, title, description }: FooterStepProps) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-xs font-semibold leading-none tabular-nums text-(--brand-700)"
      >
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold tracking-[-0.005em] text-(--ink-1)">{title}</div>
        <div className="text-[12.5px] leading-[1.55] text-(--ink-4)">{description}</div>
      </div>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────
 * ResumeMockup — A pure-CSS stylised "paper" résumé page used as
 * decorative chrome in the onboarding hero. Mirrors the Classic
 * Sidebar template (CloakResume's default): a tinted left rail
 * carrying the identity block + contact/skills/languages, with a
 * main column carrying summary + experience + projects.
 *
 * Sized to A4 aspect (210 × 297). Wrapped in an outer
 * `overflow-visible` container so the rotated "ATS · 92" sticker
 * can sit slightly outside the page edge without being clipped by
 * the rounded corners of the inner page.
 *
 * Hidden below `lg:` because single-column phones don't need the
 * visual padding.
 * ──────────────────────────────────────────────────────────────── */
function ResumeMockup() {
  return (
    // Brand colours are pinned at the OnboardingScreen root via
    // LANDING_BRAND_PALETTE — the cascade carries them down here, so
    // the mockup needs no inline override of its own.
    <div className="relative mx-auto w-full max-w-[380px]">
      {/* Inner page: A4 aspect, white surface, rounded + overflow
          clipped so content can't bleed past the paper edge. The
          rotation lives here so the ATS sticker (sibling, outside
          this clipping container) tilts independently. */}
      <div
        role="presentation"
        className="relative aspect-[210/297] rounded-md bg-white shadow-(--sh-xl) ring-1 ring-slate-900/5 overflow-hidden rotate-[1.5deg] transition-transform duration-300 hover:rotate-0"
      >
        {/* Top emerald band — quiet horizontal accent matching the
            CloakResume templates that paint a brand-coloured header
            strip across the page. */}
        <div className="h-2 w-full bg-gradient-to-r from-(--color-primary-500) to-(--color-primary-700)" />

        <div className="grid grid-cols-[34%_minmax(0,1fr)] h-[calc(100%-0.5rem)]">
          {/* ── Sidebar (tinted brand-50 like the live template) ── */}
          <div className="bg-(--brand-50) px-3 py-3.5 flex flex-col gap-3 min-w-0">
            {/* Identity block */}
            <div className="flex flex-col items-center gap-1.5 pb-1">
              <div
                className="w-12 h-12 rounded-full ring-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary-300) 0%, var(--color-primary-500) 100%)",
                  // ring colour can't read brand var directly via tw, so inline
                  outlineColor: "var(--color-primary-600)",
                }}
              />
              <div className="h-2 w-20 rounded bg-slate-800/80 mt-1" />
              <div className="h-1.5 w-14 rounded bg-(--color-primary-600)/70" />
              <div className="h-0.5 w-7 rounded-full bg-(--color-primary-600) mt-0.5" />
            </div>

            {/* Contact */}
            <SidebarSection label="Contact">
              <SidebarContactRow widthClass="w-full" />
              <SidebarContactRow widthClass="w-5/6" />
              <SidebarContactRow widthClass="w-3/4" />
              <SidebarContactRow widthClass="w-2/3" />
            </SidebarSection>

            {/* Core Expertise (skill groups) */}
            <SidebarSection label="Core Expertise">
              <div className="h-1.5 w-2/3 rounded bg-slate-700/80" />
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-1 w-4/5 rounded bg-slate-200" />
              <div className="h-1.5 w-1/2 rounded bg-slate-700/80 mt-1" />
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-1 w-3/4 rounded bg-slate-200" />
              <div className="h-1.5 w-3/5 rounded bg-slate-700/80 mt-1" />
              <div className="h-1 w-5/6 rounded bg-slate-200" />
            </SidebarSection>

            {/* Languages */}
            <SidebarSection label="Languages">
              <div className="flex justify-between items-center gap-1.5">
                <div className="h-1 w-2/5 rounded bg-slate-300" />
                <div className="h-1 w-1/4 rounded bg-(--color-primary-600)/60" />
              </div>
              <div className="flex justify-between items-center gap-1.5">
                <div className="h-1 w-1/3 rounded bg-slate-300" />
                <div className="h-1 w-1/4 rounded bg-(--color-primary-600)/60" />
              </div>
            </SidebarSection>

            {/* Tools (chips) */}
            <SidebarSection label="Tools">
              <div className="flex flex-wrap gap-1">
                <Chip width="w-7" />
                <Chip width="w-9" />
                <Chip width="w-6" />
                <Chip width="w-8" />
                <Chip width="w-7" />
              </div>
            </SidebarSection>
          </div>

          {/* ── Main column ────────────────────────────────────── */}
          <div className="px-3.5 py-3.5 flex flex-col gap-3 min-w-0">
            {/* Summary */}
            <MainSection label="Summary">
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-1 w-11/12 rounded bg-slate-200" />
              <div className="h-1 w-3/4 rounded bg-slate-200" />
            </MainSection>

            {/* Experience */}
            <MainSection label="Experience">
              <ExperienceItem
                titleWidth="w-3/5"
                metaWidth="w-1/4"
                companyWidth="w-2/5"
                bullets={3}
              />
              <ExperienceItem
                titleWidth="w-2/5"
                metaWidth="w-1/4"
                companyWidth="w-1/3"
                bullets={2}
              />
            </MainSection>

            {/* Projects — single column with About Project / Role
                mini-labels + bullets, mirroring the updated live
                template. */}
            <MainSection label="Projects">
              <div className="flex flex-col gap-1.5">
                <ProjectCard nameWidth="w-3/4" />
                <ProjectCard nameWidth="w-2/3" />
              </div>
            </MainSection>
          </div>
        </div>
      </div>

      {/* ATS badge — sibling of the clipped page so the rotation
          can hang off the corner without being cropped. Anchored
          near the top-right of the page for the "passed your
          parser" cue. */}
      <div className="pointer-events-none absolute right-2 top-6 rotate-[8deg] inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white shadow-(--sh-md) ring-1 ring-(--brand-200) text-(--brand-700) text-[10px] font-semibold uppercase tracking-[0.08em]">
        <span className="w-1.5 h-1.5 rounded-full bg-(--brand)" />
        ATS · 92
      </div>

      {/* "Local only" chip — counter-anchored at bottom-left to
          balance the ATS badge on the top-right. Reinforces the
          "stays yours" hero promise with a visual cue at the
          mockup level: the page sits on your device, nothing is
          uploaded. Same chip recipe as the ATS badge so the two
          read as a matched pair, just rotated the other way. */}
      <div className="pointer-events-none absolute left-1 bottom-7 -rotate-6 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white shadow-(--sh-md) ring-1 ring-(--brand-200) text-(--brand-700) text-[10px] font-semibold uppercase tracking-[0.08em]">
        <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
        Local only
      </div>
    </div>
  );
}

/* Sidebar section: caps label with brand colour + brand-200
   underline, matching `.cs-h3` in ClassicSidebar.tsx. */
function SidebarSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="text-[7.5px] font-bold uppercase tracking-[0.12em] text-(--color-primary-600) pb-0.5 border-b border-(--brand-200)">
        {label}
      </div>
      <div className="flex flex-col gap-1 mt-0.5">{children}</div>
    </div>
  );
}

function SidebarContactRow({ widthClass }: { widthClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-(--color-primary-600) shrink-0" />
      <div className={`h-1 ${widthClass} rounded bg-slate-200`} />
    </div>
  );
}

function Chip({ width }: { width: string }) {
  return (
    <span
      className={`h-2.5 ${width} rounded-sm bg-(--color-primary-50) ring-1 ring-(--brand-200) inline-block`}
    />
  );
}

/* Main-column section head: dark caps title with a 2px underline
   and a short brand-coloured accent at the lower-left, matching
   `.cs-section-head` + `::after` in ClassicSidebar.tsx. */
function MainSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="relative pb-1 border-b-2 border-slate-700">
        <span className="block text-[8px] font-bold uppercase tracking-[0.13em] text-slate-700">
          {label}
        </span>
        <span className="absolute left-0 -bottom-0.5 w-6 h-0.5 bg-(--color-primary-600)" />
      </div>
      <div className="flex flex-col gap-1 mt-0.5">{children}</div>
    </div>
  );
}

// Stable string keys for the (purely-decorative) bullet rows so React's
// reconciler — and the no-array-index-key lint — both stay happy.
const BULLET_KEYS = ["b0", "b1", "b2", "b3", "b4"] as const;

function ExperienceItem({
  titleWidth,
  metaWidth,
  companyWidth,
  bullets,
}: {
  titleWidth: string;
  metaWidth: string;
  companyWidth: string;
  bullets: number;
}) {
  return (
    <div className="flex flex-col gap-1 mb-1.5 last:mb-0">
      <div className="flex justify-between items-center gap-2">
        <div className={`h-1.5 ${titleWidth} rounded bg-slate-800/80`} />
        <div className={`h-1 ${metaWidth} rounded bg-slate-300`} />
      </div>
      <div className={`h-1 ${companyWidth} rounded bg-(--color-primary-600)/70`} />
      {BULLET_KEYS.slice(0, bullets).map((key, i) => (
        <div key={key} className="flex items-start gap-1 mt-0.5">
          <span className="text-(--color-primary-600) text-[7px] leading-none mt-0.5 font-bold">
            ▸
          </span>
          <div className="flex-1 flex flex-col gap-0.5">
            <div className={`h-1 ${i === bullets - 1 ? "w-3/4" : "w-full"} rounded bg-slate-200`} />
            {i === 0 && <div className="h-1 w-5/6 rounded bg-slate-200" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ nameWidth }: { nameWidth: string }) {
  return (
    <div className="rounded-sm bg-slate-50 border border-slate-200 border-l-2 border-l-(--color-primary-600) p-2 flex flex-col gap-1 min-w-0">
      <div className={`h-1.5 ${nameWidth} rounded bg-slate-700/80`} />

      {/* "About Project" mini-label + bullet */}
      <div className="h-1 w-12 rounded bg-(--color-primary-600)/80 mt-0.5" />
      <div className="flex items-start gap-1">
        <span className="text-(--color-primary-600) text-[7px] leading-none mt-0.5 font-bold">
          ▸
        </span>
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="h-1 w-full rounded bg-slate-200" />
          <div className="h-1 w-4/5 rounded bg-slate-200" />
        </div>
      </div>

      {/* "Role" mini-label + bullet */}
      <div className="h-1 w-6 rounded bg-(--color-primary-600)/80 mt-0.5" />
      <div className="flex items-start gap-1">
        <span className="text-(--color-primary-600) text-[7px] leading-none mt-0.5 font-bold">
          ▸
        </span>
        <div className="flex-1">
          <div className="h-1 w-3/5 rounded bg-slate-200" />
        </div>
      </div>

      {/* Stack chips */}
      <div className="flex gap-0.5 mt-0.5">
        <span className="h-1.5 w-4 rounded-sm bg-(--color-primary-50) ring-1 ring-(--brand-200)" />
        <span className="h-1.5 w-5 rounded-sm bg-(--color-primary-50) ring-1 ring-(--brand-200)" />
        <span className="h-1.5 w-3 rounded-sm bg-(--color-primary-50) ring-1 ring-(--brand-200)" />
      </div>
    </div>
  );
}
