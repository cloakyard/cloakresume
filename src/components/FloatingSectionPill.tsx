/**
 * Floating section pill — mobile-only shell affordance.
 *
 * Shown pinned to the bottom of the viewport when the user is in edit
 * mode. Displays the currently active section's label and opens the
 * section drawer when tapped. Intentionally minimal (one control) so
 * the mobile chrome doesn't compete with the editor form for space.
 */

import { ChevronUp, type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function FloatingSectionPill({ icon: Icon, label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`Change section — currently ${label}`}
      className={[
        "surface-glass-dark",
        "absolute left-1/2 -translate-x-1/2 z-40 print:hidden",
        "bottom-[calc(16px+env(safe-area-inset-bottom,0px))]",
        "inline-flex items-center gap-2.5 py-2 pl-2.5 pr-3.5 rounded-full",
        "max-w-[calc(100vw-32px)]",
        "text-sm font-medium tracking-[-0.005em]",
        "appearance-none border-0 cursor-pointer",
        "transition-[transform,box-shadow] duration-100",
        "active:translate-x-[-50%] active:translate-y-px",
        "focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(37,99,235,0.45),0_18px_40px_-10px_rgba(15,23,42,0.45)]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="grid place-items-center w-7 h-7 rounded-full shrink-0 bg-primary-500 text-white"
      >
        <Icon className="w-4 h-4" strokeWidth={2.25} />
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
        Section
      </span>
      <span className="font-semibold max-w-45 truncate">{label}</span>
      <ChevronUp className="w-4 h-4 opacity-80" aria-hidden="true" />
    </button>
  );
}
