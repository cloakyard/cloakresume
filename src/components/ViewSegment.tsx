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
    <fieldset className="cr-view-segment m-0 inline-flex h-11 min-w-0 shrink-0 items-center rounded-md bg-(--surface-2) p-0">
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
        "grid h-11 min-h-11 min-w-11 place-items-center appearance-none border-0 bg-transparent",
        "rounded-md px-2.5 cursor-pointer",
        "transition-[background-color,color] duration-160",
        active ? "bg-(--brand-50) text-(--brand)" : "text-(--ink-4) hover:text-(--ink-1)",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
