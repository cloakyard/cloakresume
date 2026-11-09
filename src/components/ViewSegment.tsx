/** One explicit switch between editing and the full preview. */
import { Edit3, Eye } from "lucide-react";
export type MobileView = "panel" | "preview";
export function ViewSegment({
  view,
  onChange,
}: {
  view: MobileView;
  onChange: (next: MobileView) => void;
}) {
  const editing = view === "panel";
  const Icon = editing ? Eye : Edit3;
  return (
    <button
      type="button"
      className="air-button air-button--quiet resume-view-button"
      aria-label={editing ? "Show preview" : "Show editor"}
      onClick={() => onChange(editing ? "preview" : "panel")}
    >
      <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
      {editing ? "Preview" : "Edit"}
    </button>
  );
}
