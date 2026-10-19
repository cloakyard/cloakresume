/**
 * Header logo picker — searches a curated Lucide icon set.
 *
 * Stores the chosen icon as a stable string `name` on the profile so
 * templates can look the component up at render time. This keeps the
 * persisted JSON portable (no React elements) and keeps the picker from
 * loading the entire 3000-icon Lucide set into the bundle.
 */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { usePickerPosition } from "../utils/usePickerPosition.ts";
import { LOGO_ICONS, findLogoIcon, searchLogoIcons } from "../utils/logoIcons.ts";

interface LogoPickerProps {
  value?: string;
  onChange: (name: string | undefined) => void;
}

export function LogoPicker({ value, onChange }: LogoPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pointerType = useRef("");
  const searchOnOpen = useRef(true);
  const didFocus = useRef(false);
  const coords = usePickerPosition(open, buttonRef, popoverRef, query);
  const selected = findLogoIcon(value);
  const results = searchLogoIcons(query).slice(0, 80);

  useEffect(() => {
    if (!open) {
      didFocus.current = false;
      return;
    }
    if (!coords || didFocus.current) return;
    const frame = requestAnimationFrame(() => {
      didFocus.current = true;
      // Touch opens a readable surface without summoning the software keyboard.
      (searchOnOpen.current ? searchRef.current : popoverRef.current)?.focus({
        preventScroll: true,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, coords]);

  useEffect(() => {
    if (!open) return;
    function outside(event: Event) {
      const target = event.target as Node;
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

  const closeAndReturnFocus = () => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  return (
    <>
      <div className="resume-logo-value">
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={(event) => {
            pointerType.current = event.pointerType;
          }}
          onClick={(event) => {
            searchOnOpen.current = event.detail === 0 || pointerType.current !== "touch";
            event.currentTarget.focus();
            setOpen((value) => !value);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-label={`Logo icon: ${value || "none"}`}
          className="air-field resume-logo-trigger"
        >
          {selected ? <selected.Icon aria-hidden="true" /> : <span aria-hidden="true">—</span>}
          <span data-placeholder={!value || undefined}>{value || "Choose logo icon…"}</span>
          <ChevronDown aria-hidden="true" />
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              closeAndReturnFocus();
            }}
            className="air-icon-button air-button--quiet"
            aria-label="Clear logo"
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {open &&
        coords &&
        createPortal(
          <div
            id={dialogId}
            ref={popoverRef}
            data-placement={coords.placement}
            role="dialog"
            aria-label="Choose a logo icon"
            tabIndex={-1}
            className="air-popover resume-logo-picker"
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
                closeAndReturnFocus();
              }
              if (event.key !== "Tab") return;
              const controls = [
                ...event.currentTarget.querySelectorAll<HTMLElement>("input, button"),
              ];
              if (
                event.shiftKey &&
                (event.target === event.currentTarget || event.target === controls[0])
              ) {
                event.preventDefault();
                closeAndReturnFocus();
              } else if (!event.shiftKey && event.target === controls.at(-1)) {
                event.preventDefault();
                const outside = [
                  ...document.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
                  ),
                ].filter(
                  (el) =>
                    !popoverRef.current?.contains(el) &&
                    !el.closest("[inert]") &&
                    el.getClientRects().length,
                );
                setOpen(false);
                (outside[outside.indexOf(buttonRef.current!) + 1] ?? buttonRef.current)?.focus();
              }
            }}
          >
            <div className="air-field-group resume-logo-search">
              <Search aria-hidden="true" />
              <input
                ref={searchRef}
                name="logo-icon-search"
                autoComplete="off"
                aria-label="Search logo icons"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search icons…"
                className="air-field"
              />
            </div>
            <div className="resume-logo-grid cr-scroll">
              {results.map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => {
                    onChange(entry.name);
                    setQuery("");
                    closeAndReturnFocus();
                  }}
                  title={entry.name}
                  aria-label={entry.name}
                  aria-pressed={entry.name === value}
                  className="air-icon-button air-button--quiet"
                >
                  <entry.Icon aria-hidden="true" />
                </button>
              ))}
              {results.length === 0 && (
                <p className="resume-logo-empty">No icons match “{query}”.</p>
              )}
            </div>
            <p className="air-help resume-logo-count" role="status">
              {results.length} of {LOGO_ICONS.length} icons
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
