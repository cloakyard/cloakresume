/**
 * Reactive media-query hook. Returns `true` when the query matches the
 * current viewport and updates on resize/orientation change.
 *
 * Consumers pass a raw media-query string (e.g. "(max-width: 1023px)")
 * so the breakpoints stay co-located with the component that needs them
 * rather than hiding behind a shared constants file.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const media = useMemo(
    () =>
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia(query)
        : null,
    [query],
  );
  const subscribe = useCallback(
    (notify: () => void) => {
      media?.addEventListener("change", notify);
      return () => media?.removeEventListener("change", notify);
    },
    [media],
  );
  // Read the current viewport during render, even before the browser delivers
  // its change event. Closing a modal must not restore an obsolete toolbar.
  return useSyncExternalStore(
    subscribe,
    () => media?.matches ?? false,
    () => false,
  );
}

/** Shared breakpoint tokens so callers don't drift. */
export const BP = {
  /** `true` below 1024px — collapses the desktop 3-column shell. */
  mobile: "(max-width: 1023px)",
} as const;
