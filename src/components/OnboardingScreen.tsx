/**
 * Onboarding / welcome screen.
 *
 * Shown on first run (when there is no persisted resume in
 * localStorage) and also when the user clicks "New" in the toolbar to
 * start over. Offers three tiles: start blank, load the bundled sample,
 * or re-open a previously saved JSON file.
 *
 * When `onDismiss` is supplied, a close affordance (X, Escape key,
 * backdrop click) is rendered so the user can bail out — we only pass
 * it for the mid-session "New" flow, not for first-run.
 */

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EyeOff,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  SquareDashed,
  UserRoundCheck,
  X,
} from "lucide-react";

const GITHUB_URL = "https://github.com/cloakyard/cloakresume";

interface GlowTileProps {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  glow: string;
  /** Tailwind classes for the icon tile background + foreground. */
  iconTint: string;
}

function GlowTile({ onClick, icon, title, subtitle, glow, iconTint }: GlowTileProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [glowStyle, setGlowStyle] = useState<CSSProperties>({ opacity: 0 });

  const setGlowAt = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setGlowStyle({
        opacity: 1,
        background: `radial-gradient(260px circle at ${clientX - rect.left}px ${clientY - rect.top}px, ${glow}, transparent 70%)`,
      });
    },
    [glow],
  );

  return (
    <button
      ref={ref}
      type="button"
      className="group text-left px-4.5 pt-4.5 pb-5 border border-(--line) bg-(--surface) rounded-xl cursor-pointer transition-[border-color,box-shadow,transform] duration-200 relative overflow-hidden flex flex-col gap-1.5 text-(--ink-1) hover:border-(--brand-300) hover:shadow-(--sh-md) hover:-translate-y-0.5"
      onClick={onClick}
      onMouseMove={(e) => setGlowAt(e.clientX, e.clientY)}
      onMouseLeave={() => setGlowStyle({ opacity: 0 })}
      onTouchStart={(e) => setGlowAt(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => setGlowAt(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={() => setGlowStyle({ opacity: 0 })}
      onTouchCancel={() => setGlowStyle({ opacity: 0 })}
    >
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300 z-0"
        aria-hidden="true"
        style={glowStyle}
      />
      <span
        className={`relative z-[1] w-[38px] h-[38px] rounded-lg grid place-items-center mb-2 transition-[transform,background] duration-200 group-hover:-translate-y-px group-hover:scale-105 ${iconTint}`}
      >
        {icon}
      </span>
      <span className="relative z-[1] text-sm font-semibold tracking-[-0.005em] text-(--ink-1)">
        {title}
      </span>
      <span className="relative z-[1] text-xs leading-[1.45] text-(--ink-4)">{subtitle}</span>
    </button>
  );
}

function GithubMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface Props {
  onStartBlank: () => void;
  onLoadSample: () => void;
  onLoadFile: (file: File) => void;
  /** Optional close handler — enables X button, Escape, and backdrop click. */
  onDismiss?: () => void;
}

export function OnboardingScreen({ onStartBlank, onLoadSample, onLoadFile, onDismiss }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!onDismiss) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 grid place-items-center p-4 sm:p-6 md:p-10 z-150 overflow-auto"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(37, 99, 235, 0.08), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(37, 99, 235, 0.05), transparent 55%), linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%)",
      }}
    >
      {onDismiss && (
        <button
          type="button"
          className="absolute inset-0 bg-transparent cursor-pointer"
          onClick={onDismiss}
          aria-label="Close welcome screen"
        />
      )}
      <div
        className="bg-(--surface) border border-(--line) rounded-2xl shadow-(--sh-lg) w-full max-w-[920px] px-5 py-7 sm:px-8 sm:py-8 md:px-12 md:pt-10 md:pb-9 relative overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg grid place-items-center text-(--ink-4) bg-transparent cursor-pointer hover:bg-(--surface-3) hover:text-(--ink-1)"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <img src="/icons/logo.svg" alt="" aria-hidden="true" className="w-11 h-11 shrink-0" />
          <div>
            <div className="font-semibold text-(--ink-1) text-[17px] tracking-[-0.015em] leading-none">
              Cloak<span className="text-(--brand)">Resume</span>
            </div>
            <div className="text-(--ink-4) text-[13px] mt-1">
              The private, local-first résumé builder.
            </div>
          </div>
        </div>

        <h1 className="text-[26px] sm:text-[30px] md:text-[34px] font-semibold text-(--ink-1) tracking-[-0.025em] leading-[1.15] m-0 mb-3.5">
          Build a résumé that{" "}
          <em className="font-serif italic font-normal text-(--brand)">stays yours</em>.
        </h1>
        <p className="text-(--ink-3) text-[13.5px] sm:text-[14.5px] leading-[1.55] max-w-160 m-0 mb-6 md:mb-8">
          Beautifully designed templates, real ATS analysis, and zero servers. Your data is stored
          locally — nothing is ever uploaded.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
          <GlowTile
            onClick={onStartBlank}
            icon={<SquareDashed className="w-4 h-4" />}
            title="Start blank"
            subtitle="From a clean template"
            glow="rgba(37, 99, 235, 0.18)"
            iconTint="bg-(--brand-50) text-(--brand)"
          />
          <GlowTile
            onClick={onLoadSample}
            icon={<Sparkles className="w-4 h-4" />}
            title="Load sample"
            subtitle="See a fully populated résumé"
            glow="rgba(124, 58, 237, 0.16)"
            iconTint="bg-[#f4f0ff] text-[#7c3aed]"
          />
          <GlowTile
            onClick={() => fileRef.current?.click()}
            icon={<FolderOpen className="w-4 h-4" />}
            title="Load saved"
            subtitle="Résumé from local file"
            glow="rgba(5, 150, 105, 0.16)"
            iconTint="bg-[#ecfdf5] text-[#059669]"
          />
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

        <div className="flex items-center gap-3.5 mt-[22px] pt-[18px] border-t border-(--line-soft) text-xs text-(--ink-4) flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <UserRoundCheck className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" /> No sign-up
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-(--ink-6)" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-medium">
            <EyeOff className="w-3.5 h-3.5 text-[#7c3aed]" aria-hidden="true" /> No tracking
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-(--ink-6)" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-(--brand)" aria-hidden="true" /> Local-first
          </span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-[7px] px-3 py-1.5 rounded-lg border border-(--line) bg-(--surface) text-(--ink-2) font-medium no-underline transition-[border-color,box-shadow,transform,background] duration-150 hover:border-(--ink-3) hover:bg-(--surface-2) hover:text-(--ink-1) hover:shadow-(--sh-sm) hover:-translate-y-px [&_svg]:text-(--ink-1)"
            aria-label="View CloakResume on GitHub"
          >
            <GithubMark className="w-3.5 h-3.5" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
