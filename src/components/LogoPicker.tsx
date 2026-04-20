/**
 * Header logo picker — searches a curated Lucide icon set.
 *
 * Stores the chosen icon as a stable string `name` on the profile so
 * templates can look the component up at render time. This keeps the
 * persisted JSON portable (no React elements) and keeps the picker from
 * loading the entire 3000-icon Lucide set into the bundle.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { LOGO_ICONS, findLogoIcon, searchLogoIcons } from "../utils/logoIcons.ts";

interface LogoPickerProps {
  value?: string;
  onChange: (name: string | undefined) => void;
}

const POPOVER_W = 320;
const POPOVER_H_EST = 340;

export function LogoPicker({ value, onChange }: LogoPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const selected = findLogoIcon(value);
  const results = searchLogoIcons(query).slice(0, 80);

  const updateCoords = useCallback(() => {
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
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
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
      if (e.key === "Escape") setOpen(false);
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
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-(--line) rounded-md bg-(--surface) hover:border-[#d6dadf] transition-colors"
      >
        <span className="w-7 h-7 rounded-md bg-gradient-to-br from-(--brand-600) to-(--brand-700) flex items-center justify-center text-white shrink-0">
          {selected ? (
            <selected.Icon className="w-4 h-4" />
          ) : (
            <span className="text-[10px] font-bold">—</span>
          )}
        </span>
        <span className="flex-1 text-left text-(--ink-2)">
          {selected ? selected.name : "Choose logo icon…"}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange(undefined);
              }
            }}
            className="text-(--ink-5) hover:text-(--danger) cursor-pointer transition-colors"
            aria-label="Clear logo"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-(--ink-5)" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            className="popover fixed z-80 w-80 animate-scale-in"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-(--ink-5) absolute top-1/2 -translate-y-1/2 left-2.5" />
              {/* oxlint-disable-next-line jsx/no-autofocus */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-(--line) rounded-md bg-white/60 text-(--ink-1) placeholder:text-(--ink-5) focus:outline-none focus:border-(--brand) focus:shadow-(--sh-focus) transition-[border-color,box-shadow]"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-8 gap-1 max-h-65 overflow-y-auto cr-scroll">
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
                    }}
                    title={e.name}
                    className={`aspect-square flex items-center justify-center rounded-md transition-colors ${
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
                <div className="col-span-8 py-6 text-center text-xs text-(--ink-5)">
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
