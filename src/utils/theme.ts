/**
 * Central theme binding.
 *
 * Turns the current `PrimaryPalette` into CSS custom properties on the
 * document root so every Tailwind `*-primary-<shade>` class (and any
 * `var(--color-primary-*)` inline style) follows the user-selected
 * colour. Templates that take `palette` as a prop continue to compose
 * their own CSS; the hook only drives the editor/chrome theming.
 */

import { useEffect } from "react";
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
