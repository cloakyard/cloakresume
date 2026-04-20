/**
 * Colour utilities for template theming.
 *
 * A resume template takes a single `primary` hex colour and derives a
 * handful of paired tokens (lighter tints for backgrounds, darker shades
 * for hovers, an ink-safe text colour, etc.) so that every template gets
 * a visually coherent palette without the user having to pick each one.
 */

export interface PrimaryPalette {
  primary: string;
  primaryText: string; // text colour to use ON the primary background
  primary50: string; // very light tint — surface highlights
  primary100: string; // chip backgrounds
  primary200: string; // borders
  primary300: string; // soft accents & focus borders
  primary400: string; // mid tint
  primary500: string; // base-minus
  primary600: string; // body accents (base primary)
  primary700: string; // hover / links
  primary800: string; // deep
  primary900: string; // deep accent for strong emphasis
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(hex: string, target: string, weight: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(
    a.r + (b.r - a.r) * weight,
    a.g + (b.g - a.g) * weight,
    a.b + (b.b - a.b) * weight,
  );
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function derivePalette(primary: string): PrimaryPalette {
  const lum = luminance(primary);
  const onPrimary = lum > 0.55 ? "#111827" : "#ffffff";
  return {
    primary,
    primaryText: onPrimary,
    primary50: mix(primary, "#ffffff", 0.92),
    primary100: mix(primary, "#ffffff", 0.82),
    primary200: mix(primary, "#ffffff", 0.65),
    primary300: mix(primary, "#ffffff", 0.45),
    primary400: mix(primary, "#ffffff", 0.22),
    primary500: mix(primary, "#000000", 0.06),
    primary600: primary,
    primary700: mix(primary, "#000000", 0.18),
    primary800: mix(primary, "#000000", 0.32),
    primary900: mix(primary, "#000000", 0.45),
  };
}

export const PRESET_COLORS: { name: string; value: string }[] = [
  { name: "Ocean", value: "#2563EB" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#E11D48" },
  { name: "Amber", value: "#D97706" },
  { name: "Slate", value: "#334155" },
  { name: "Teal", value: "#0D9488" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Crimson", value: "#B91C1C" },
  { name: "Graphite", value: "#111827" },
];
