/**
 * Segmented switch toggling A4 ↔ Letter. Rendered in the desktop toolbar
 * and in the mobile overflow sheet. The `md` fieldset has an exact 40px
 * outer box so it aligns with every other desktop toolbar control; `lg`
 * preserves 44px touch targets in the bottom sheet.
 */

import { PAPER_SIZES, type PaperSize } from "../utils/paperSize.ts";

interface Props {
  value: PaperSize;
  onChange: (next: PaperSize) => void;
  /**
   * md = exact 40px desktop toolbar control.
   * lg = bottom-sheet control with 44px button targets.
   */
  size?: "md" | "lg";
}

const OPTIONS: PaperSize[] = ["a4", "letter"];

export function PaperSizeToggle({ value, onChange, size = "md" }: Props) {
  const pad = size === "lg" ? "p-1" : "p-0.5";
  const fieldsetHeight = size === "lg" ? "" : "h-10";
  const btnHeight = size === "lg" ? "min-h-11" : "h-[34px] min-h-0";
  const btnPadding = size === "lg" ? "px-4" : "px-2.5";
  const btnText = size === "lg" ? "text-[13px]" : "text-[12.5px]";

  return (
    <fieldset
      data-paper-size-control={size}
      className={[
        "box-border inline-flex items-stretch border border-(--line) bg-(--surface-2)",
        "rounded-md m-0 min-w-0 shrink-0",
        fieldsetHeight,
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
              "cr-segment-button appearance-none border-0 cursor-pointer rounded-md min-w-11 md:min-w-10",
              "font-semibold tabular-nums",
              "transition-[background-color,color] duration-160",
              btnHeight,
              btnPadding,
              btnText,
              active
                ? "bg-(--brand-50) text-(--brand)"
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
