/**
 * Reactive media-query hook. Returns `true` when the query matches the
 * current viewport and updates on resize/orientation change.
 *
 * Consumers pass a raw media-query string (e.g. "(max-width: 1023px)")
 * so the breakpoints stay co-located with the component that needs them
 * rather than hiding behind a shared constants file.
 */

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const getMatch = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Shared breakpoint tokens so callers don't drift. */
export const BP = {
  /** `true` below 1024px — collapses the desktop 3-column shell. */
  mobile: "(max-width: 1023px)",
  /** `true` below 768px — stacks onboarding tiles, compresses header. */
  narrow: "(max-width: 767px)",
  /** `true` below 480px — drops non-essential labels. */
  tiny: "(max-width: 479px)",
} as const;
