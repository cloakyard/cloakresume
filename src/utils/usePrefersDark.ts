// Tiny hook: tracks `prefers-color-scheme: dark` so components that
// can't read CSS tokens (e.g. WebGL shader uniforms) stay in sync with
// the rest of the chrome. The app itself follows the OS — no manual
// toggle — so this is a one-way mirror of the media query.

import { useEffect, useState } from "react";

const MQ = "(prefers-color-scheme: dark)";

export function usePrefersDark(): boolean {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(MQ).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(MQ);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return dark;
}
