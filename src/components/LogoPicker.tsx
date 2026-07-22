/**
 * Header logo picker — searches a curated Lucide icon set.
 *
 * Stores the chosen icon as a stable string `name` on the profile so
 * templates can look the component up at render time. This keeps the
 * persisted JSON portable (no React elements) and keeps the picker from
 * loading the entire 3000-icon Lucide set into the bundle.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { LOGO_ICONS, findLogoIcon, searchLogoIcons } from "../utils/logoIcons.ts";

interface LogoPickerProps {
  value?: string;
  onChange: (name: string | undefined) => void;
}

const POPOVER_W = 320;
const POPOVER_H_EST = 364;
const SAFE_EDGE = 16;
const POPOVER_GAP = 6;

type PopoverPlacement = "above" | "below";

export function LogoPicker({ value, onChange }: LogoPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogId = useId();
  const searchId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: PopoverPlacement;
  } | null>(null);
  const selected = findLogoIcon(value);
  const results = searchLogoIcons(query).slice(0, 80);

  const updateCoords = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const width = Math.min(POPOVER_W, Math.max(0, viewportWidth - SAFE_EDGE * 2));
    const safeTop = viewportTop + SAFE_EDGE;
    const safeBottom = viewportBottom - SAFE_EDGE;
    const belowTop = Math.max(safeTop, Math.min(rect.bottom + POPOVER_GAP, safeBottom));
    const aboveBottom = Math.max(safeTop, Math.min(rect.top - POPOVER_GAP, safeBottom));
    const availableBelow = Math.max(0, safeBottom - belowTop);
    const availableAbove = Math.max(0, aboveBottom - safeTop);
    const placement: PopoverPlacement =
      availableBelow < POPOVER_H_EST && availableAbove > availableBelow ? "above" : "below";
    const top = placement === "above" ? aboveBottom : belowTop;
    const minLeft = viewportLeft + SAFE_EDGE;
    const maxLeft = Math.max(minLeft, viewportRight - width - SAFE_EDGE);
    const left = Math.max(minLeft, Math.min(rect.left, maxLeft));
    const maxHeight = placement === "above" ? availableAbove : availableBelow;
    setCoords({ top, left, width, maxHeight, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    window.visualViewport?.addEventListener("resize", updateCoords);
    window.visualViewport?.addEventListener("scroll", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
      window.visualViewport?.removeEventListener("resize", updateCoords);
      window.visualViewport?.removeEventListener("scroll", updateCoords);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
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
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="flex items-stretch gap-1 w-full">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-label={`Logo icon: ${selected?.name ?? "none"}`}
          className="min-w-0 flex-1 min-h-11 md:min-h-10 flex items-center gap-2 px-3 text-sm border border-(--line) rounded-md bg-(--surface) hover:border-(--color-rule-strong) transition-colors"
        >
          <span className="w-6 h-6 flex items-center justify-center text-(--brand) shrink-0">
            {selected ? (
              <selected.Icon className="w-4 h-4" />
            ) : (
              <span className="text-[10px] font-bold text-(--ink-5)">—</span>
            )}
          </span>
          <span className="flex-1 truncate text-left text-(--ink-2)">
            {selected ? selected.name : "Choose logo icon…"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-(--ink-5) shrink-0" />
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="min-w-11 min-h-11 md:min-w-10 md:min-h-10 grid place-items-center rounded-md text-(--ink-5) hover:text-(--color-status-danger) hover:bg-(--color-status-danger-soft) transition-colors"
            aria-label="Clear logo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            id={dialogId}
            ref={popoverRef}
            role="dialog"
            aria-label="Choose a logo icon"
            className="cr-popover popover fixed overscroll-contain"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              transform: coords.placement === "above" ? "translateY(-100%)" : undefined,
              overflowY: "auto",
            }}
          >
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-(--ink-5) absolute top-1/2 -translate-y-1/2 left-2.5" />
              {/* oxlint-disable-next-line jsx/no-autofocus */}
              <input
                id={searchId}
                name="logo-icon-search"
                autoComplete="off"
                aria-label="Search logo icons"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons…"
                className="w-full min-h-11 md:min-h-10 pl-8 pr-3 text-sm border border-(--line) rounded-md bg-(--surface) text-(--ink-1) placeholder:text-(--ink-5) focus:border-(--brand) transition-colors"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-5 min-[360px]:grid-cols-6 gap-1 max-h-65 overflow-y-auto overscroll-contain cr-scroll">
              {results.map((e) => {
                const active = e.name === value;
                return (
                  <button
                    key={e.name}
                    type="button"
                    onClick={() => {
                      onChange(e.name);
                      setOpen(false);
                      setQuery("");
                      requestAnimationFrame(() => buttonRef.current?.focus());
                    }}
                    title={e.name}
                    aria-label={e.name}
                    aria-pressed={active}
                    className={`aspect-square min-h-11 md:min-h-10 flex items-center justify-center rounded-md transition-colors ${
                      active
                        ? "bg-(--brand-100) text-(--brand-700) ring-1 ring-(--brand-300)"
                        : "text-(--ink-3) hover:bg-(--ink-1)/5"
                    }`}
                  >
                    <e.Icon className="w-4 h-4" />
                  </button>
                );
              })}
              {results.length === 0 && (
                <div className="col-span-5 min-[360px]:col-span-6 py-6 text-center text-xs text-(--ink-5)">
                  No icons match “{query}”.
                </div>
              )}
            </div>
            <div className="text-[10px] text-(--ink-5) mt-2 text-center">
              {results.length} of {LOGO_ICONS.length} icons
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
