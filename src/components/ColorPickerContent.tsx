/**
 * Body of the colour picker — presets grid + custom HSL wheel.
 *
 * Rendered inside the desktop popover (anchored to the toolbar trigger)
 * and inside the mobile bottom-sheet overflow menu. Extracting the body
 * keeps both surfaces in lock-step as the palette evolves.
 */

import { Check } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { PRESET_COLORS } from "../utils/colors.ts";

interface Props {
  primary: string;
  onChange: (hex: string) => void;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const v = hex.replace("#", "");
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = (((h % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 1) [r, g, b] = [c, x, 0];
  else if (hue < 2) [r, g, b] = [x, c, 0];
  else if (hue < 3) [r, g, b] = [0, c, x];
  else if (hue < 4) [r, g, b] = [0, x, c];
  else if (hue < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ColorPickerContent({ primary, onChange }: Props) {
  const { h, s, l } = hexToHsl(primary);
  const wheelRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lRef = useRef(l);
  lRef.current = l;

  const applyFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = clientX - rect.left - cx;
      const dy = clientY - rect.top - cy;
      const r = Math.min(1, Math.hypot(dx, dy) / cx);
      const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
      // Clamp lightness into a band where hue changes remain visible.
      const safeL = Math.max(0.2, Math.min(0.8, lRef.current));
      onChange(hslToHex(angle, r, safeL));
    },
    [onChange],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingRef.current) applyFromPointer(e.clientX, e.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyFromPointer]);

  const thumbAngleRad = (h * Math.PI) / 180 - Math.PI / 2;
  const thumbX = 50 + Math.cos(thumbAngleRad) * s * 48;
  const thumbY = 50 + Math.sin(thumbAngleRad) * s * 48;

  const lightnessTrack = `linear-gradient(to right, #000, ${hslToHex(h, Math.max(s, 0.0001), 0.5)}, #fff)`;

  return (
    <>
      <div className="font-mono text-[10.5px] font-semibold text-(--ink-4) uppercase tracking-wider mb-2">
        Presets
      </div>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {PRESET_COLORS.map((c) => {
          const active = c.value.toLowerCase() === primary.toLowerCase();
          return (
            <button
              type="button"
              key={c.value}
              onClick={() => onChange(c.value)}
              className="relative aspect-square rounded-lg transition-transform hover:scale-105"
              style={{
                background: c.value,
                border: active ? "2px solid var(--ink-1)" : "2px solid transparent",
                boxShadow: active ? "inset 0 0 0 2px white" : "0 0 0 1px var(--line)",
                minHeight: 44,
              }}
              title={c.name}
              aria-label={`Set primary colour to ${c.name}`}
            >
              {active && (
                <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow" />
              )}
            </button>
          );
        })}
      </div>

      <div className="font-mono text-[10.5px] font-semibold text-(--ink-4) uppercase tracking-wider mb-2">
        Custom
      </div>

      <div className="flex flex-col items-center gap-3">
        <div
          ref={wheelRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            draggingRef.current = true;
            applyFromPointer(e.clientX, e.clientY);
          }}
          title="Drag to pick hue and saturation"
          className="relative w-36 h-36 rounded-full cursor-crosshair touch-none select-none"
          style={{
            background:
              "radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 70%), " +
              "conic-gradient(from -90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute w-4 h-4 rounded-full pointer-events-none"
            style={{
              left: `calc(${thumbX}% - 8px)`,
              top: `calc(${thumbY}% - 8px)`,
              background: primary,
              border: "2px solid #fff",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.35), 0 1px 3px rgba(15,23,42,0.25)",
            }}
          />
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10.5px] font-semibold text-(--ink-4) uppercase tracking-wider">
              Lightness
            </span>
            <span className="text-[10.5px] font-mono text-(--ink-5) tabular-nums">
              {Math.round(l * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(l * 100)}
            onChange={(e) => onChange(hslToHex(h, s, Number(e.target.value) / 100))}
            aria-label="Lightness"
            className="color-lightness-slider w-full"
            style={{ background: lightnessTrack }}
          />
        </div>

        <div className="flex items-center gap-2 w-full min-w-0">
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full shrink-0"
            style={{
              background: primary,
              boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.08)",
            }}
          />
          <input
            type="text"
            value={primary}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) onChange(v);
            }}
            placeholder="#2563EB"
            aria-label="Hex colour value"
            className="min-w-0 flex-1 px-3 h-10 text-sm font-mono rounded-md border border-(--line) bg-white/60 text-(--ink-1) placeholder:text-(--ink-5) transition-[border-color,box-shadow] duration-100 focus:outline-none focus:border-(--brand) focus:shadow-(--sh-focus)"
          />
        </div>
      </div>
    </>
  );
}
