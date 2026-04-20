/**
 * Compact segmented toggle in the mobile header — switches the single
 * visible region between the editor panel and the live preview.
 */

import { Edit3, Eye } from "lucide-react";
import type { ReactNode } from "react";

export type MobileView = "panel" | "preview";

interface ViewSegmentProps {
  view: MobileView;
  onChange: (next: MobileView) => void;
}

export function ViewSegment({ view, onChange }: ViewSegmentProps) {
  return (
    <fieldset className="inline-flex items-stretch border border-(--line) bg-(--surface-2) rounded-md p-0.5 m-0 min-w-0 shrink-0">
      <legend className="sr-only">View</legend>
      <SegmentButton
        active={view === "panel"}
        onClick={() => onChange("panel")}
        ariaLabel="Show editor"
      >
        <Edit3 className="w-3.5 h-3.5" strokeWidth={2} />
      </SegmentButton>
      <SegmentButton
        active={view === "preview"}
        onClick={() => onChange("preview")}
        ariaLabel="Show preview"
      >
        <Eye className="w-3.5 h-3.5" strokeWidth={2} />
      </SegmentButton>
    </fieldset>
  );
}

function SegmentButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={[
        "grid place-items-center appearance-none bg-transparent border-0",
        "rounded-[6px] px-2.5 min-h-[30px] min-w-[36px] cursor-pointer",
        "transition-[background-color,color] duration-100",
        active
          ? "bg-(--surface) text-(--brand) shadow-(--sh-xs)"
          : "text-(--ink-4) hover:text-(--ink-1)",
        "focus-visible:outline-none focus-visible:shadow-(--sh-focus)",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
