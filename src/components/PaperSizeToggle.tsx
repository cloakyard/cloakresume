/**
 * Segmented switch toggling A4 ↔ Letter. Rendered in the desktop toolbar
 * and in the mobile overflow sheet; the `size` variant matches the host
 * chrome ("md" for toolbar chips, "lg" for the touch-height bottom sheet
 * row).
 */

import { PAPER_SIZES, type PaperSize } from "../utils/paperSize.ts";

interface Props {
  value: PaperSize;
  onChange: (next: PaperSize) => void;
  /**
   * md = toolbar-chip height (~28px inner).
   * lg = bottom-sheet touch height (~34px inner).
   */
  size?: "md" | "lg";
}

const OPTIONS: PaperSize[] = ["a4", "letter"];

export function PaperSizeToggle({ value, onChange, size = "md" }: Props) {
  const pad = size === "lg" ? "p-1" : "p-0.5";
  const btnHeight = size === "lg" ? "min-h-8" : "min-h-6.5";
  const btnPadding = size === "lg" ? "px-4" : "px-2.5";
  const btnText = size === "lg" ? "text-[13px]" : "text-[12.5px]";

  return (
    <fieldset
      className={[
        "inline-flex items-stretch border border-(--line) bg-(--surface-2)",
        "rounded-full m-0 min-w-0 shrink-0",
        pad,
      ].join(" ")}
    >
      <legend className="sr-only">Paper size</legend>
      {OPTIONS.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={[
              "appearance-none border-0 cursor-pointer rounded-full",
              "font-semibold tabular-nums",
              "transition-[background-color,color,box-shadow] duration-120",
              "focus-visible:outline-none focus-visible:shadow-(--sh-focus)",
              btnHeight,
              btnPadding,
              btnText,
              active
                ? "bg-(--surface) text-(--brand) shadow-(--sh-xs)"
                : "bg-transparent text-(--ink-4) hover:text-(--ink-1)",
            ].join(" ")}
          >
            {PAPER_SIZES[opt].label}
          </button>
        );
      })}
    </fieldset>
  );
}
