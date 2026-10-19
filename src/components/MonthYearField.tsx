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
  disabled?: boolean;
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

const POPOVER_H_EST = 364;
const SAFE_EDGE = 16;
const POPOVER_GAP = 8;

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
  disabled = false,
}: MonthYearFieldProps) {
  const [open, setOpen] = useState(false);
  const presence = useAnimatedPresence(open && !disabled);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const labelId = useId();
  const dialogId = useId();
  const valueId = useId();
  const helpId = useId();
  const yearButtonRef = useRef<HTMLButtonElement>(null);
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
    placement: "above" | "below";
  } | null>(null);

  const parsed = useMemo(() => parseValue(value), [value]);
  const todayYear = new Date().getFullYear();

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

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
    const preferredWidth = 20 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const width = Math.min(preferredWidth, Math.max(0, viewportWidth - SAFE_EDGE * 2));
    const viewportContentTop = viewportTop + SAFE_EDGE;
    const viewportContentBottom = viewportBottom - SAFE_EDGE;
    const belowTop = Math.max(viewportContentTop, rect.bottom + POPOVER_GAP);
    const aboveBottom = Math.min(viewportContentBottom, rect.top - POPOVER_GAP);
    const spaceBelow = Math.max(0, viewportContentBottom - belowTop);
    const spaceAbove = Math.max(0, aboveBottom - viewportContentTop);
    const desiredHeight = popoverRef.current ? popoverRef.current.scrollHeight + 2 : POPOVER_H_EST;
    const flip = spaceBelow < Math.min(desiredHeight, POPOVER_H_EST) && spaceAbove > spaceBelow;
    // On short viewports use the available surface instead of a tiny anchored strip.
    const useViewport = Math.max(spaceAbove, spaceBelow) < Math.min(desiredHeight, 360);
    const maxHeight = useViewport ? viewportHeight - SAFE_EDGE * 2 : flip ? spaceAbove : spaceBelow;
    const renderedHeight = Math.min(desiredHeight, maxHeight);
    const top = useViewport
      ? viewportContentTop
      : flip
        ? Math.max(viewportContentTop, aboveBottom - renderedHeight)
        : belowTop;
    const left = Math.max(
      viewportLeft + SAFE_EDGE,
      Math.min(rect.left, viewportRight - width - SAFE_EDGE),
    );
    setCoords({ top, left, width, maxHeight, placement: flip ? "above" : "below" });
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
    function outside(e: Event) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  useEffect(() => {
    if (!showYearPicker) return;
    selectedYearRef.current?.focus({ preventScroll: true });
    selectedYearRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
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
      popoverRef.current?.focus({ preventScroll: true });
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
    if (!out.includes(yearCursor)) out.push(yearCursor);
    return out.sort((a, b) => b - a);
  }, [todayYear, yearCursor]);

  return (
    <div className="resume-date-field">
      <span id={labelId} className="air-label">
        {label}
      </span>
      <div className="resume-date-value">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={(event) => {
            event.currentTarget.focus();
            setOpen((v) => !v);
          }}
          aria-haspopup="dialog"
          aria-expanded={open && !disabled}
          aria-controls={open && !disabled ? dialogId : undefined}
          aria-labelledby={`${labelId} ${valueId}`}
          className="air-field resume-date-trigger"
        >
          <Calendar aria-hidden="true" />
          <span id={valueId} data-placeholder={!hasValue || undefined}>
            {displayLabel}
          </span>
        </button>
        {hasValue && !disabled && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onChange("");
              closeAndReturnFocus();
            }}
            className="air-icon-button air-button--quiet"
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {presence.mounted &&
        !disabled &&
        coords &&
        createPortal(
          <div
            id={dialogId}
            ref={popoverRef}
            data-state={presence.state}
            data-placement={coords.placement}
            role="dialog"
            aria-labelledby={labelId}
            aria-describedby={helpId}
            aria-hidden={!open || undefined}
            inert={!open}
            tabIndex={-1}
            className="cr-popover air-popover resume-date-picker"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                if (showYearPicker) {
                  setShowYearPicker(false);
                  yearButtonRef.current?.focus();
                } else closeAndReturnFocus();
              }
              if (event.key !== "Tab") return;
              const buttons = [
                ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
              ];
              if (
                event.shiftKey &&
                (event.target === event.currentTarget || event.target === buttons[0])
              ) {
                event.preventDefault();
                closeAndReturnFocus();
              } else if (!event.shiftKey && event.target === buttons.at(-1)) {
                event.preventDefault();
                const controls = [
                  ...document.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
                  ),
                ].filter(
                  (el) =>
                    !popoverRef.current?.contains(el) &&
                    !el.closest("[inert]") &&
                    el.getClientRects().length,
                );
                const next = controls[controls.indexOf(buttonRef.current!) + 1];
                setOpen(false);
                (next ?? buttonRef.current)?.focus();
              }
            }}
          >
            <p id={helpId} className="resume-date-help">
              Choose a month and year, or a year only.
            </p>
            {allowPresent && (
              <div className="air-segments">
                <button
                  type="button"
                  aria-pressed={parsed.isPresent}
                  onClick={() => {
                    commit({ isPresent: true });
                    closeAndReturnFocus();
                  }}
                >
                  Present
                </button>
              </div>
            )}
            <div className="resume-date-navigation">
              <button
                type="button"
                onClick={() => setYearCursor((y) => y - 1)}
                disabled={showYearPicker}
                aria-label="Previous year"
                className="air-icon-button air-button--quiet"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                ref={yearButtonRef}
                type="button"
                onClick={(event) => {
                  event.currentTarget.focus();
                  setShowYearPicker((v) => !v);
                }}
                aria-expanded={showYearPicker}
                aria-label="Select year"
                className="air-button air-button--quiet"
              >
                <span aria-live="polite">{yearCursor}</span>
                <ChevronDown aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setYearCursor((y) => y + 1)}
                disabled={showYearPicker}
                aria-label="Next year"
                className="air-icon-button air-button--quiet"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
            {showYearPicker ? (
              <div
                className="air-segments cr-scroll resume-date-grid resume-year-grid"
                aria-label="Years"
              >
                {yearList.map((year) => (
                  <button
                    key={year}
                    ref={year === yearCursor ? selectedYearRef : undefined}
                    type="button"
                    aria-pressed={year === yearCursor}
                    aria-current={year === todayYear ? "date" : undefined}
                    onClick={() => {
                      setYearCursor(year);
                      setShowYearPicker(false);
                      yearButtonRef.current?.focus();
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            ) : (
              <div className="air-segments resume-date-grid" aria-label="Months">
                {MONTHS.map((month, i) => (
                  <button
                    type="button"
                    key={month}
                    aria-pressed={
                      !parsed.isPresent && parsed.month === i && parsed.year === yearCursor
                    }
                    onClick={() => {
                      commit({ month: i, year: yearCursor, isPresent: false });
                      closeAndReturnFocus();
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
            <div className="resume-date-actions">
              <button
                type="button"
                className="air-button air-button--quiet"
                onClick={() => {
                  onChange("");
                  closeAndReturnFocus();
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="air-button air-button--quiet"
                onClick={() => {
                  commit({ month: null, year: yearCursor, isPresent: false });
                  closeAndReturnFocus();
                }}
              >
                Year only
              </button>
              <button
                type="button"
                className="air-button air-button--primary"
                onClick={closeAndReturnFocus}
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
