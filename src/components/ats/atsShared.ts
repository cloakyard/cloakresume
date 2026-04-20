/**
 * Pure helpers shared across the ATS review panes.
 *   • `toneColor` — maps a 0–100 percent to the brand traffic-light palette.
 *   • `pct` — safe percent calculation that treats 0-max as 0.
 */

export function toneColor(percent: number): string {
  if (percent >= 85) return "var(--ok)";
  if (percent >= 55) return "var(--warn)";
  return "var(--danger)";
}

export function pct(earned: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((earned / max) * 100);
}
