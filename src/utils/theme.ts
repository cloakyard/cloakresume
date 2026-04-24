/**
 * Central theme binding.
 *
 * Turns the current `PrimaryPalette` into CSS custom properties on the
 * document root so every Tailwind `*-primary-<shade>` class (and any
 * `var(--color-primary-*)` inline style) follows the user-selected
 * colour. Templates that take `palette` as a prop continue to compose
 * their own CSS; the hook only drives the editor/chrome theming.
 */

import { useEffect, useState } from "react";
import type { PrimaryPalette } from "./colors.ts";

const VAR_BINDINGS: Array<[keyof PrimaryPalette, string]> = [
  ["primary50", "--color-primary-50"],
  ["primary100", "--color-primary-100"],
  ["primary200", "--color-primary-200"],
  ["primary300", "--color-primary-300"],
  ["primary400", "--color-primary-400"],
  ["primary500", "--color-primary-500"],
  ["primary600", "--color-primary-600"],
  ["primary700", "--color-primary-700"],
  ["primary800", "--color-primary-800"],
  ["primary900", "--color-primary-900"],
  ["primary", "--color-primary"],
  ["primaryText", "--color-on-primary"],
];

export function useApplyTheme(palette: PrimaryPalette): void {
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, cssVar] of VAR_BINDINGS) {
      root.style.setProperty(cssVar, palette[key]);
    }
  }, [palette]);
}

/** True if the OS/browser currently prefers dark mode. */
export function prefersDarkOs(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Tracks the OS `prefers-color-scheme: dark` media query reactively so the
 * app can transition when the user flips their system appearance (macOS
 * light/dark auto-schedule, Windows theme swap, etc.) without a reload.
 */
export function useSystemDarkMode(): boolean {
  const [dark, setDark] = useState<boolean>(prefersDarkOs);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return dark;
}
