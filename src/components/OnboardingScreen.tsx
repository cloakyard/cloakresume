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
}

export function OnboardingScreen({
  onStartBlank,
  onLoadSample,
  onLoadFile,
  onDismiss,
  onResumeEditing,
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
      style={{ background: "var(--onboarding-bg)" }}
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
          <div className="max-w-[1180px] mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/icons/logo.svg"
                alt=""
                aria-hidden="true"
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
              />
              <div className="font-semibold text-(--ink-1) text-[17px] sm:text-[19px] tracking-[-0.025em] leading-none truncate">
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

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-24 pb-10 sm:pb-14">
          <h1 className="text-center text-[34px] sm:text-[46px] md:text-[60px] lg:text-[68px] font-semibold text-(--ink-1) tracking-[-0.03em] leading-[1.05] m-0 max-w-[900px] mx-auto animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
            Build a résumé that{" "}
            <em className="font-serif italic font-normal text-(--brand)">stays yours</em>.
          </h1>

          <p className="text-center text-(--ink-3) text-[15px] sm:text-[17px] md:text-[18px] leading-[1.55] max-w-[640px] mx-auto mt-5 sm:mt-6 animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
            Beautifully designed templates, real ATS analysis, and zero servers. Your data is stored
            locally — nothing is ever uploaded.
          </p>

          {/* Primary CTAs.
           *
           * When `onResumeEditing` is provided we feature it as a wide
           * horizontal card above the standard 3-tile row so the
           * "continue where you left off" path is visually dominant
           * without making the three fresh-start tiles look stretched.
           * Otherwise just the 3-tile row renders. */}
          <div className="mt-10 sm:mt-12 max-w-225 mx-auto flex flex-col gap-3 sm:gap-4 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
            {onResumeEditing && (
              <GlowCard
                onClick={onResumeEditing}
                glow="rgba(5, 150, 105, 0.26)"
                ariaLabel="Resume editing your current résumé"
              >
                <div className="flex items-center gap-4 sm:gap-5 px-5 py-4.5 sm:px-6 sm:py-5">
                  <span className="shrink-0 w-12 h-12 sm:w-13 sm:h-13 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105">
                    <FilePen className="w-5.5 h-5.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                        Resume editing
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md bg-(--brand-50) text-(--brand)"
                        aria-hidden="true"
                      >
                        Saved
                      </span>
                    </div>
                    <span className="block text-[13px] sm:text-[13.5px] leading-[1.5] text-(--ink-4) mt-0.5">
                      Pick up where you left off — your work is already in this browser.
                    </span>
                  </div>
                  <ArrowRight
                    className="shrink-0 w-4 h-4 text-(--ink-4) transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-(--brand)"
                    aria-hidden="true"
                  />
                </div>
              </GlowCard>
            )}

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
              <GlowCard
                onClick={onStartBlank}
                glow="rgba(5, 150, 105, 0.22)"
                ariaLabel={
                  onResumeEditing
                    ? "Start a blank résumé — replaces the work saved in your browser"
                    : "Start a blank résumé from a clean template"
                }
              >
                <div className="relative px-5 py-6 sm:p-6 flex flex-col gap-2">
                  <span className="w-11 h-11 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) mb-2 transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105">
                    <SquareDashed className="w-5 h-5" />
                  </span>
                  <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                    Start blank
                  </span>
                  <span className="text-[13px] leading-[1.5] text-(--ink-4)">
                    Begin with a clean template and make it yours.
                  </span>
                  <ArrowRight
                    className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-4 h-4 text-(--ink-5) opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-(--brand)"
                    aria-hidden="true"
                  />
                </div>
              </GlowCard>

              <GlowCard
                onClick={onLoadSample}
                glow="rgba(5, 150, 105, 0.22)"
                ariaLabel="Load a randomly-generated sample résumé — content is fictional"
              >
                <div className="relative px-5 py-6 sm:p-6 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="w-11 h-11 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) mb-2 transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105 group-hover:-rotate-6">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md bg-(--brand-50) text-(--brand)"
                      aria-hidden="true"
                    >
                      <Dices className="w-3 h-3" />
                      Fictional
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                    Load sample
                  </span>
                  <span className="text-[13px] leading-[1.5] text-(--ink-4)">
                    Fresh, randomly-generated content every time — names and details are fictional,
                    not real people.
                  </span>
                  <ArrowRight
                    className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-4 h-4 text-(--ink-5) opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-(--brand)"
                    aria-hidden="true"
                  />
                </div>
              </GlowCard>

              <GlowCard
                onClick={() => fileRef.current?.click()}
                glow="rgba(5, 150, 105, 0.22)"
                ariaLabel="Load a saved résumé from a local file"
              >
                <div className="relative px-5 py-6 sm:p-6 flex flex-col gap-2">
                  <span className="w-11 h-11 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) mb-2 transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105">
                    <FolderOpen className="w-5 h-5" />
                  </span>
                  <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                    Load saved
                  </span>
                  <span className="text-[13px] leading-[1.5] text-(--ink-4)">
                    Continue from a JSON file you previously saved.
                  </span>
                  <ArrowRight
                    className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 w-4 h-4 text-(--ink-5) opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-(--brand)"
                    aria-hidden="true"
                  />
                </div>
              </GlowCard>
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
                className="relative flex flex-col rounded-2xl border border-(--line-soft) bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] p-5 backdrop-blur-md"
                style={{
                  backgroundImage:
                    "radial-gradient(280px 280px at 100% 0%, rgba(5, 150, 105, 0.18) 0%, rgba(5, 150, 105, 0.06) 38%, transparent 68%)",
                }}
              >
                <div className="relative">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--brand)">
                    How it works
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
                className="group relative flex flex-col justify-between rounded-2xl border border-(--line-soft) bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] p-5 text-inherit no-underline backdrop-blur-md transition-colors hover:border-(--brand-300)"
                style={{
                  backgroundImage:
                    "radial-gradient(280px 280px at 0% 100%, rgba(5, 150, 105, 0.14) 0%, rgba(5, 150, 105, 0.05) 38%, transparent 68%)",
                }}
              >
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
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
                    <span className="inline-flex shrink-0 items-center rounded-full border border-(--line-soft) bg-[color-mix(in_oklab,var(--ink-1)_4%,transparent)] px-2 py-px font-mono text-[10px] tabular-nums tracking-tight text-(--ink-4)">
                      CloakResume v{__APP_VERSION__}
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
