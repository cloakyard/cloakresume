/**
 * Month + year picker used for experience / education date ranges.
 *
 * The stored value is a free-form string ("Mar 2020", "2010", "Present"
 * or empty) because that's what templates already render and what users
 * exported before. This component just provides a friendlier way of
 * producing one. "Present" is surfaced as a dedicated toggle on the end
 * date so the user doesn't have to remember the exact spelling.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

interface MonthYearFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** When true, a "Present" chip is shown inside the popover. */
  allowPresent?: boolean;
  placeholder?: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// Year picker range — wide enough to cover resume history and expected
// graduation dates a few years out.
const YEAR_RANGE_BACK = 60;
const YEAR_RANGE_FORWARD = 10;

interface Parsed {
  month: number | null; // 0–11, null means no month set
  year: number | null;
  isPresent: boolean;
}

function parseValue(raw: string): Parsed {
  const trimmed = raw.trim();
  if (!trimmed) return { month: null, year: null, isPresent: false };
  if (/^present$/i.test(trimmed)) return { month: null, year: null, isPresent: true };

  // "Mar 2020", "March 2020", "Mar, 2020"
  const monthYear = trimmed.match(/^([A-Za-z]{3,9})[,\s]+(\d{4})$/);
  if (monthYear) {
    const idx = MONTHS.findIndex((m) => m.toLowerCase() === monthYear[1].slice(0, 3).toLowerCase());
    return { month: idx >= 0 ? idx : null, year: Number(monthYear[2]), isPresent: false };
  }
  // "2020"
  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) return { month: null, year: Number(yearOnly[1]), isPresent: false };

  return { month: null, year: null, isPresent: false };
}

function formatValue(p: Parsed): string {
  if (p.isPresent) return "Present";
  if (p.year === null) return "";
  if (p.month === null) return String(p.year);
  return `${MONTHS[p.month]} ${p.year}`;
}

export function MonthYearField({
  label,
  value,
  onChange,
  allowPresent = false,
  placeholder,
}: MonthYearFieldProps) {
  const [open, setOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearCursor, setYearCursor] = useState<number>(() => {
    const p = parseValue(value);
    return p.year ?? new Date().getFullYear();
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const parsed = useMemo(() => parseValue(value), [value]);
  const todayYear = new Date().getFullYear();

  // Keep the cursor in sync when the stored value changes externally
  // (e.g. user clears, or parent seeds a value).
  useEffect(() => {
    if (parsed.year !== null) setYearCursor(parsed.year);
  }, [parsed.year]);

  // Compute popover position relative to the trigger button using fixed
  // coords — the popover is portaled out of any scroll container so it
  // no longer gets clipped.
  const updateCoords = useCallback(() => {
    const POPOVER_W = 288; // matches w-72 (18rem)
    const POPOVER_H_EST = 300; // rough — enough to decide flip above vs below
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;
    const flip = spaceBelow < POPOVER_H_EST + 12 && spaceAbove > spaceBelow;
    const top = flip ? Math.max(8, rect.top - POPOVER_H_EST - 6) : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.left, viewportW - POPOVER_W - 8));
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    // Capture-phase scroll listener catches any ancestor scroll container.
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Center the year picker on the currently-selected year when it opens.
  useEffect(() => {
    if (showYearPicker && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [showYearPicker]);

  // Reset internal picker state whenever the popover closes.
  useEffect(() => {
    if (!open) setShowYearPicker(false);
  }, [open]);

  const commit = (patch: Partial<Parsed>) => {
    const next: Parsed = { ...parsed, ...patch };
    if (patch.isPresent === true) {
      next.month = null;
      next.year = null;
    }
    onChange(formatValue(next));
  };

  const displayLabel = value.trim() || placeholder || "Select…";
  const hasValue = value.trim().length > 0;

  // Descending list so most-recent years appear first in the picker.
  const yearList = useMemo(() => {
    const start = todayYear + YEAR_RANGE_FORWARD;
    const end = todayYear - YEAR_RANGE_BACK;
    const out: number[] = [];
    for (let y = start; y >= end; y--) out.push(y);
    return out;
  }, [todayYear]);

  return (
    <div className="cr-field">
      <span className="cr-field-label">{label}</span>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`cr-input flex items-center gap-2 text-left ${hasValue ? "pr-9" : ""} ${
            open ? "border-(--brand)! shadow-(--sh-focus)!" : ""
          }`}
        >
          <Calendar className="w-4 h-4 text-(--brand) shrink-0" />
          <span className={`flex-1 truncate ${hasValue ? "text-(--ink-1)" : "text-(--ink-5)"}`}>
            {displayLabel}
          </span>
        </button>
        {hasValue && (
          <button
            type="button"
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded text-(--ink-5) hover:text-(--danger) hover:bg-(--danger-bg) transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Select month and year"
            className="popover fixed z-80 w-72 space-y-2 animate-scale-in"
            style={{ top: coords.top, left: coords.left }}
          >
            {allowPresent && (
              <button
                type="button"
                onClick={() => {
                  commit({ isPresent: true });
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  parsed.isPresent
                    ? "bg-(--brand) text-white"
                    : "bg-(--brand-50) text-(--brand-700) hover:bg-(--brand-100)"
                }`}
              >
                Present
              </button>
            )}

            {/* Year navigation header — chevrons step the cursor year, the
                center label toggles a full year-picker grid. */}
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => setYearCursor((y) => y - 1)}
                disabled={showYearPicker}
                aria-label="Previous year"
                className={`p-1 rounded-md transition-[color,background-color,transform] active:scale-90 ${
                  showYearPicker
                    ? "text-(--ink-6) cursor-not-allowed"
                    : "text-(--ink-4) hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowYearPicker((v) => !v)}
                aria-expanded={showYearPicker}
                aria-label="Select year"
                className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums rounded-md px-2 py-0.5 transition-colors select-none ${
                  showYearPicker
                    ? "bg-(--brand-50) text-(--brand)"
                    : "text-(--ink-2) hover:bg-(--ink-1)/5"
                }`}
              >
                {yearCursor}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showYearPicker ? "rotate-180" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setYearCursor((y) => y + 1)}
                disabled={showYearPicker}
                aria-label="Next year"
                className={`p-1 rounded-md transition-[color,background-color,transform] active:scale-90 ${
                  showYearPicker
                    ? "text-(--ink-6) cursor-not-allowed"
                    : "text-(--ink-4) hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {showYearPicker ? (
              <div className="cr-scroll grid grid-cols-4 gap-1 max-h-44 overflow-y-auto py-0.5 pr-1">
                {yearList.map((year) => (
                  <button
                    key={year}
                    ref={year === yearCursor ? selectedYearRef : undefined}
                    type="button"
                    onClick={() => {
                      setYearCursor(year);
                      setShowYearPicker(false);
                    }}
                    className={`py-1.5 rounded-md font-mono text-xs font-medium tabular-nums transition-colors ${
                      year === yearCursor
                        ? "bg-(--brand) text-white"
                        : year === parsed.year
                          ? "border border-(--brand-300) text-(--brand-700) hover:bg-(--brand-50)"
                          : year === todayYear
                            ? "border border-(--line) text-(--ink-2) hover:bg-(--ink-1)/5"
                            : "text-(--ink-2) hover:bg-(--ink-1)/5"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map((m, i) => {
                  const active =
                    !parsed.isPresent && parsed.month === i && parsed.year === yearCursor;
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => {
                        commit({ month: i, year: yearCursor, isPresent: false });
                        setOpen(false);
                      }}
                      aria-pressed={active}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        active
                          ? "bg-(--brand) text-white"
                          : "text-(--ink-2) hover:bg-(--brand-50) hover:text-(--brand-700)"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-(--line-soft)/70">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-(--ink-4) hover:text-(--danger) transition-colors"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    commit({ month: null, year: yearCursor, isPresent: false });
                    setOpen(false);
                  }}
                  className="text-xs text-(--brand) hover:text-(--brand-700) transition-colors"
                >
                  Year only
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs font-semibold text-white bg-(--brand) hover:bg-(--brand-hover) px-3 py-1 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
