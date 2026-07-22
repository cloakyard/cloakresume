import { useEffect, useState } from "react";

export type PresenceState = "open" | "closing";

/**
 * Keeps transient UI mounted just long enough for its exit animation.
 * Reduced-motion users skip the delay and receive the final state immediately.
 */
export function useAnimatedPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<PresenceState>("open");

  useEffect(() => {
    if (open) {
      setMounted(true);
      setState("open");
      return;
    }

    if (!mounted) return;
    setState("closing");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setMounted(false), reduceMotion ? 0 : 180);
    return () => window.clearTimeout(timeout);
  }, [mounted, open]);

  return { mounted, state } as const;
}
