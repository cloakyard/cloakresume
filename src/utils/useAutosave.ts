import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Debounce normal writes, but flush the latest committed edit before leaving the page. */
export function useAutosave<T extends object>(key: string, value: T, enabled: boolean) {
  const latest = useRef(value);
  const dirty = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string>();

  useLayoutEffect(() => {
    if (!enabled) return;
    latest.current = value;
    dirty.current = true;
  }, [value, enabled]);

  const flush = useCallback(() => {
    if (!dirty.current) return true;
    try {
      const timestamp = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify({ ...latest.current, savedAt: timestamp }));
      dirty.current = false;
      setSavedAt(timestamp);
      setError(null);
      return true;
    } catch {
      setError(
        "Your browser could not save this draft locally. Use Save to download a JSON copy before closing this page. You can also remove a large photo or free browser storage and try again.",
      );
      return false;
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) {
      flush();
      return;
    }
    const timeout = window.setTimeout(flush, 300);
    return () => window.clearTimeout(timeout);
  }, [value, enabled, flush]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!flush()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [flush]);

  return { error, savedAt };
}
