/**
 * Month + year picker used for experience / education date ranges.
 *
 * The stored value is a free-form string ("Mar 2020", "2010", "Present"
 * or empty) because that's what templates already render and what users
 * exported before. This component just provides a friendlier way of
 * producing one. "Present" is surfaced as a dedicated toggle on the end
 * date so the user doesn't have to remember the exact spelling.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";

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
const POPOVER_W = 288;
const POPOVER_H_EST = 364;
const SAFE_EDGE = 16;
const POPOVER_GAP = 6;

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
  const presence = useAnimatedPresence(open);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const labelId = useId();
  const dialogId = useId();
  const valueId = useId();
  const [yearCursor, setYearCursor] = useState<number>(() => {
    const p = parseValue(value);
    return p.year ?? new Date().getFullYear();
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const didFocusPopoverRef = useRef(false);
  const selectedYearRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const parsed = useMemo(() => parseValue(value), [value]);
  const todayYear = new Date().getFullYear();

  // Keep the cursor in sync when the stored value changes externally
  // (e.g. user clears, or parent seeds a value).
  useEffect(() => {
    if (parsed.year !== null) setYearCursor(parsed.year);
  }, [parsed.year]);

  // Compute popover position relative to the trigger button using fixed
  // coords — the popover is portaled out of any scroll container so it
  // no longer gets clipped. visualViewport offsets keep it inside the
  // actually visible area when a software keyboard or browser zoom shifts
  // that viewport away from the layout viewport origin.
  const updateCoords = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const width = Math.min(POPOVER_W, Math.max(0, viewportWidth - SAFE_EDGE * 2));
    const viewportContentTop = viewportTop + SAFE_EDGE;
    const viewportContentBottom = viewportBottom - SAFE_EDGE;
    const belowTop = Math.max(viewportContentTop, rect.bottom + POPOVER_GAP);
    const aboveBottom = Math.min(viewportContentBottom, rect.top - POPOVER_GAP);
    const spaceBelow = Math.max(0, viewportContentBottom - belowTop);
    const spaceAbove = Math.max(0, aboveBottom - viewportContentTop);
    const desiredHeight = popoverRef.current?.scrollHeight ?? POPOVER_H_EST;
    const flip = spaceBelow < Math.min(desiredHeight, POPOVER_H_EST) && spaceAbove > spaceBelow;
    const maxHeight = flip ? spaceAbove : spaceBelow;
    const renderedHeight = Math.min(desiredHeight, maxHeight);
    const top = flip ? Math.max(viewportContentTop, aboveBottom - renderedHeight) : belowTop;
    const left = Math.max(
      viewportLeft + SAFE_EDGE,
      Math.min(rect.left, viewportRight - width - SAFE_EDGE),
    );
    setCoords({ top, left, width, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    // The first pass mounts the portal; the second can use its real scroll
    // height instead of the conservative pre-mount estimate.
    const frame = requestAnimationFrame(updateCoords);
    return () => cancelAnimationFrame(frame);
  }, [open, showYearPicker, updateCoords]);

  useEffect(() => {
    if (!open) return;
    // Capture-phase scroll listener catches any ancestor scroll container.
    const visualViewport = window.visualViewport;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    visualViewport?.addEventListener("scroll", updateCoords);
    visualViewport?.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
      visualViewport?.removeEventListener("scroll", updateCoords);
      visualViewport?.removeEventListener("resize", updateCoords);
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
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
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
    if (!presence.mounted) {
      setShowYearPicker(false);
      setCoords(null);
    }
  }, [presence.mounted]);

  useEffect(() => {
    if (!open || !coords || didFocusPopoverRef.current) return;
    didFocusPopoverRef.current = true;
    requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    });
  }, [open, coords]);

  useEffect(() => {
    if (!open) didFocusPopoverRef.current = false;
  }, [open]);

  const commit = (patch: Partial<Parsed>) => {
    const next: Parsed = { ...parsed, ...patch };
    if (patch.isPresent === true) {
      next.month = null;
      next.year = null;
    }
    onChange(formatValue(next));
  };

  const closeAndReturnFocus = () => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
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
      <span id={labelId} className="cr-field-label">
        {label}
      </span>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-labelledby={`${labelId} ${valueId}`}
          className={`cr-input min-h-11 md:min-h-10 flex items-center gap-2 text-left ${hasValue ? "pr-12" : ""} ${
            open ? "border-(--brand)! shadow-(--sh-focus)!" : ""
          }`}
        >
          <Calendar className="w-4 h-4 text-(--brand) shrink-0" />
          <span
            id={valueId}
            className={`flex-1 truncate ${hasValue ? "text-(--ink-1)" : "text-(--ink-5)"}`}
          >
            {displayLabel}
          </span>
        </button>
        {hasValue && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute top-1/2 right-0 -translate-y-1/2 min-w-11 min-h-11 md:min-w-10 md:min-h-10 grid place-items-center rounded-md text-(--ink-5) hover:text-(--color-status-danger) hover:bg-(--color-status-danger-soft) transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {presence.mounted &&
        coords &&
        createPortal(
          <div
            id={dialogId}
            ref={popoverRef}
            data-state={presence.state}
            role="dialog"
            aria-labelledby={labelId}
            className="cr-popover popover fixed space-y-2 overscroll-contain"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              overflowY: "auto",
            }}
          >
            {allowPresent && (
              <button
                type="button"
                onClick={() => {
                  commit({ isPresent: true });
                  closeAndReturnFocus();
                }}
                className={`w-full min-h-11 md:min-h-10 px-3 rounded-md text-xs font-semibold transition-colors ${
                  parsed.isPresent
                    ? "bg-(--color-accent) text-(--color-accent-ink)"
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
                className={`min-w-11 min-h-11 md:min-w-10 md:min-h-10 grid place-items-center rounded-md transition-colors ${
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
                className={`min-h-11 md:min-h-10 flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums rounded-md px-3 transition-colors select-none ${
                  showYearPicker
                    ? "bg-(--brand-50) text-(--brand)"
                    : "text-(--ink-2) hover:bg-(--ink-1)/5"
                }`}
              >
                {yearCursor}
                <span
                  aria-hidden="true"
                  className={`inline-flex transition-transform ${showYearPicker ? "rotate-180" : ""}`}
                >
                  <ChevronDown className="h-3 w-3" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setYearCursor((y) => y + 1)}
                disabled={showYearPicker}
                aria-label="Next year"
                className={`min-w-11 min-h-11 md:min-w-10 md:min-h-10 grid place-items-center rounded-md transition-colors ${
                  showYearPicker
                    ? "text-(--ink-6) cursor-not-allowed"
                    : "text-(--ink-4) hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {showYearPicker ? (
              <div className="cr-scroll grid grid-cols-4 gap-1 max-h-44 overflow-y-auto overscroll-contain py-0.5 pr-1">
                {yearList.map((year) => (
                  <button
                    key={year}
                    ref={year === yearCursor ? selectedYearRef : undefined}
                    type="button"
                    onClick={() => {
                      setYearCursor(year);
                      setShowYearPicker(false);
                    }}
                    className={`min-h-11 md:min-h-10 px-1 rounded-md font-mono text-xs font-medium tabular-nums transition-colors ${
                      year === yearCursor
                        ? "bg-(--color-accent) text-(--color-accent-ink)"
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
                        closeAndReturnFocus();
                      }}
                      aria-pressed={active}
                      className={`min-h-11 md:min-h-10 px-2 text-xs font-medium rounded-md transition-colors ${
                        active
                          ? "bg-(--color-accent) text-(--color-accent-ink)"
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
                  closeAndReturnFocus();
                }}
                className="min-h-11 md:min-h-10 px-2 rounded-md text-xs text-(--ink-4) hover:text-(--color-status-danger) transition-colors"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    commit({ month: null, year: yearCursor, isPresent: false });
                    closeAndReturnFocus();
                  }}
                  className="min-h-11 md:min-h-10 px-2 rounded-md text-xs text-(--brand) hover:text-(--brand-700) transition-colors"
                >
                  Year only
                </button>
                <button
                  type="button"
                  onClick={closeAndReturnFocus}
                  className="min-h-11 rounded-md bg-(--color-accent) px-3 text-xs font-semibold text-(--color-accent-ink) transition-colors hover:bg-(--brand-hover) md:min-h-10"
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
