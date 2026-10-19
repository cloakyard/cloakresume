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
    <fieldset className="air-segments resume-view-segment">
      <legend className="sr-only">View</legend>
      <SegmentButton
        active={view === "panel"}
        onClick={() => onChange("panel")}
        ariaLabel="Show editor"
      >
        <Edit3 size={18} strokeWidth={1.6} aria-hidden="true" />
      </SegmentButton>
      <SegmentButton
        active={view === "preview"}
        onClick={() => onChange("preview")}
        ariaLabel="Show preview"
      >
        <Eye size={18} strokeWidth={1.6} aria-hidden="true" />
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
      className="resume-view-button"
    >
      {children}
    </button>
  );
}
