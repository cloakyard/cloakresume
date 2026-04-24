/**
 * Landing / welcome screen.
 *
 * Shown on first run (when there is no persisted resume in
 * localStorage) and also when the user clicks "New" in the toolbar to
 * start over. This is a full-screen experience — sticky nav, hero with
 * three primary CTA tiles, informational feature list, and a footer.
 *
 * When `onDismiss` is supplied, Escape-to-close is wired up so the
 * mid-session "New" flow can bail out. No visible close button — the
 * primary CTAs are the way forward, Escape is the way back.
 */

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EyeOff,
  FileText,
  FolderOpen,
  Laptop,
  Moon,
  Palette,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  SquareDashed,
  Sun,
  UserRoundCheck,
  WifiOff,
} from "lucide-react";

const GITHUB_URL = "https://github.com/cloakyard/cloakresume";

/* ────────────────────────────────────────────────────────────────
 * Glow card — shared mechanic used by both the primary CTA tiles
 * and the feature cards below. Renders a radial gradient that
 * follows the pointer (or touch point) for a premium hover feel.
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
  /** Optional close handler — enables X button and Escape to dismiss. */
  onDismiss?: () => void;
  /** Optional dark-mode toggle — shown in the top nav when provided. */
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function OnboardingScreen({
  onStartBlank,
  onLoadSample,
  onLoadFile,
  onDismiss,
  darkMode,
  onToggleDarkMode,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!onDismiss) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const showDarkToggle = typeof darkMode === "boolean" && !!onToggleDarkMode;
  const darkToggleLabel = darkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <div
      className="fixed inset-0 z-150 overflow-y-auto text-(--ink-1)"
      style={{ background: "var(--onboarding-bg)" }}
    >
      {/* Decorative blobs — animated aurora behind the hero. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(100vh,900px)] overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--brand) 35%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-20 right-[-10%] w-[460px] h-[460px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, #7c3aed 30%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[40%] left-[35%] w-[380px] h-[380px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, #059669 24%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 backdrop-blur-md bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] border-b border-(--line-soft)">
        <div className="max-w-[1180px] mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/icons/logo.svg" alt="" aria-hidden="true" className="w-8 h-8 shrink-0" />
            <div className="font-semibold text-(--ink-1) text-[15px] sm:text-base tracking-[-0.015em] leading-none truncate">
              Cloak<span className="text-(--brand)">Resume</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {showDarkToggle && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="w-9 h-9 rounded-lg grid place-items-center text-(--ink-3) bg-transparent cursor-pointer transition-colors duration-150 hover:bg-(--surface-3) hover:text-(--ink-1)"
                title={darkToggleLabel}
                aria-label={darkToggleLabel}
                aria-pressed={darkMode}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-2.5 sm:px-3 h-9 rounded-lg border border-(--line) bg-(--surface) text-(--ink-2) text-[13px] font-medium no-underline transition-[border-color,box-shadow,transform,background] duration-150 hover:border-(--ink-3) hover:bg-(--surface-2) hover:text-(--ink-1) hover:shadow-(--sh-sm) [&_svg]:text-(--ink-1)"
              aria-label="View CloakResume on GitHub"
            >
              <GithubMark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-24 pb-10 sm:pb-14">
        {/* Headline */}
        <h1 className="text-center text-[34px] sm:text-[46px] md:text-[60px] lg:text-[68px] font-semibold text-(--ink-1) tracking-[-0.03em] leading-[1.05] m-0 max-w-[900px] mx-auto animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
          Build a résumé that{" "}
          <em className="font-serif italic font-normal text-(--brand)">stays yours</em>.
        </h1>

        <p className="text-center text-(--ink-3) text-[15px] sm:text-[17px] md:text-[18px] leading-[1.55] max-w-[640px] mx-auto mt-5 sm:mt-6 animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
          Beautifully designed templates, real ATS analysis, and zero servers. Your data is stored
          locally — nothing is ever uploaded.
        </p>

        {/* Trust badges — inline row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-6 text-xs text-(--ink-4) animate-[fade-in-up_0.6s_ease-out_0.15s_both]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <UserRoundCheck className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
            No sign-up
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-(--ink-6)" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-medium">
            <EyeOff className="w-3.5 h-3.5 text-[#7c3aed]" aria-hidden="true" />
            No tracking
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-(--ink-6)" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-(--brand)" aria-hidden="true" />
            Local-first
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-(--ink-6)" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-medium">
            <WifiOff className="w-3.5 h-3.5 text-(--ink-3)" aria-hidden="true" />
            Works offline
          </span>
        </div>

        {/* Primary CTA tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-10 sm:mt-12 max-w-225 mx-auto animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
          <GlowCard
            onClick={onStartBlank}
            glow="rgba(37, 99, 235, 0.22)"
            ariaLabel="Start a blank résumé from a clean template"
          >
            <div className="px-5 py-6 sm:p-6 flex flex-col gap-2">
              <span className="w-11 h-11 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) mb-2 transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105">
                <SquareDashed className="w-5 h-5" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                Start blank
              </span>
              <span className="text-[13px] leading-[1.5] text-(--ink-4)">
                Begin with a clean template and make it yours.
              </span>
            </div>
          </GlowCard>

          <GlowCard
            onClick={onLoadSample}
            glow="rgba(124, 58, 237, 0.2)"
            ariaLabel="Load the bundled sample résumé"
          >
            <div className="px-5 py-6 sm:p-6 flex flex-col gap-2">
              <span className="w-11 h-11 rounded-xl grid place-items-center bg-[color-mix(in_oklab,#7c3aed_14%,transparent)] text-[#7c3aed] mb-2 transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                Load sample
              </span>
              <span className="text-[13px] leading-[1.5] text-(--ink-4)">
                See a fully populated résumé to explore the app.
              </span>
            </div>
          </GlowCard>

          <GlowCard
            onClick={() => fileRef.current?.click()}
            glow="rgba(5, 150, 105, 0.2)"
            ariaLabel="Load a saved résumé from a local file"
          >
            <div className="px-5 py-6 sm:p-6 flex flex-col gap-2">
              <span className="w-11 h-11 rounded-xl grid place-items-center bg-[color-mix(in_oklab,#059669_14%,transparent)] text-[#059669] mb-2 transition-[transform] duration-200 group-hover:-translate-y-px group-hover:scale-105">
                <FolderOpen className="w-5 h-5" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
                Load saved
              </span>
              <span className="text-[13px] leading-[1.5] text-(--ink-4)">
                Continue from a JSON file you previously saved.
              </span>
            </div>
          </GlowCard>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7 sm:gap-y-8">
          <FeatureItem
            icon={<ShieldCheck className="w-5 h-5" />}
            iconBg="bg-(--brand-50)"
            iconFg="text-(--brand)"
            title="Zero servers"
            description="Every keystroke stays in your browser. No accounts, no telemetry, no hidden uploads."
          />
          <FeatureItem
            icon={<ScanSearch className="w-5 h-5" />}
            iconBg="bg-[color-mix(in_oklab,#7c3aed_14%,transparent)]"
            iconFg="text-[#7c3aed]"
            title="Real ATS analysis"
            description="Paste a job description and get actionable feedback on keywords, formatting, and match."
          />
          <FeatureItem
            icon={<Palette className="w-5 h-5" />}
            iconBg="bg-[color-mix(in_oklab,#059669_14%,transparent)]"
            iconFg="text-[#059669]"
            title="Beautiful templates"
            description="Carefully crafted layouts that look great on screen, in print, and through every PDF reader."
          />
          <FeatureItem
            icon={<FileText className="w-5 h-5" />}
            iconBg="bg-[color-mix(in_oklab,#d97706_14%,transparent)]"
            iconFg="text-[#d97706]"
            title="Crisp PDF export"
            description="Pixel-perfect exports with proper typography, selectable text, and print-ready margins."
          />
          <FeatureItem
            icon={<WifiOff className="w-5 h-5" />}
            iconBg="bg-[color-mix(in_oklab,#ea580c_14%,transparent)]"
            iconFg="text-[#ea580c]"
            title="Works offline"
            description="Installable as a PWA. Once loaded, you can build and export without a connection."
          />
          <FeatureItem
            icon={<Laptop className="w-5 h-5" />}
            iconBg="bg-[color-mix(in_oklab,#0891b2_14%,transparent)]"
            iconFg="text-[#0891b2]"
            title="Light & dark mode"
            description="Thoughtful theming that follows your system or respects your manual choice."
          />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="relative max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="border border-(--line) bg-(--surface) rounded-2xl shadow-(--sh-sm) px-5 py-8 sm:px-10 sm:py-12">
          <div className="text-center mb-8 sm:mb-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--brand) mb-2.5">
              How it works
            </div>
            <h2 className="text-[22px] sm:text-[28px] md:text-[32px] font-semibold text-(--ink-1) tracking-[-0.02em] leading-[1.2] m-0">
              From blank page to hired, in three steps.
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 list-none p-0 m-0">
            <Step
              n={1}
              title="Fill in your details"
              description="Work through each section with inline hints and autosave. Nothing leaves the browser."
            />
            <Step
              n={2}
              title="Scan against a job"
              description="Paste a job description and let the ATS panel surface keywords, gaps, and wins."
            />
            <Step
              n={3}
              title="Export & apply"
              description="Download a polished PDF or save a JSON to continue on another device — your choice."
            />
          </ol>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative border-t border-(--line-soft)">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-center gap-2 text-[12.5px] text-(--ink-4)">
          <span className="font-medium text-(--ink-3)">
            Cloak<span className="text-(--brand)">Resume</span>
          </span>
          <span className="text-(--ink-6)" aria-hidden="true">
            ·
          </span>
          <span className="font-mono tabular-nums tracking-tight">v{__APP_VERSION__}</span>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Sub-components
 * ──────────────────────────────────────────────────────────────── */

interface FeatureItemProps {
  icon: ReactNode;
  iconBg: string;
  iconFg: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, iconBg, iconFg, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className={`shrink-0 w-10 h-10 rounded-lg grid place-items-center ${iconBg} ${iconFg}`}
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

interface StepProps {
  n: number;
  title: string;
  description: string;
}

function Step({ n, title, description }: StepProps) {
  return (
    <li className="flex items-start gap-4">
      <span
        className="shrink-0 w-9 h-9 rounded-full grid place-items-center font-serif italic text-[17px] font-semibold text-(--brand) bg-(--brand-50) border border-(--brand-100)"
        aria-hidden="true"
      >
        {n}
      </span>
      <div>
        <div className="text-[15px] font-semibold text-(--ink-1) tracking-[-0.005em] mb-1">
          {title}
        </div>
        <div className="text-[13.5px] leading-[1.55] text-(--ink-3)">{description}</div>
      </div>
    </li>
  );
}
