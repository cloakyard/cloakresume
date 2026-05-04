// ReloadPrompt.tsx — PWA service-worker update banner.
//
// Renders a frosted-glass card pinned to the bottom-right of the
// viewport when one of two things happens:
//
//   • A new service-worker version becomes available — shows an
//     "Update" CTA that triggers `updateServiceWorker(true)` and
//     reloads the page so the new bundle takes over.
//   • The app first becomes installable for offline use — shows a
//     self-dismissing "Ready offline" toast for 4 s.
//
// Polls the SW URL every 10 minutes (skipping the poll when the
// user is offline or another install is already in flight) so a
// long-lived editor session can pick up an update without a full
// reload from the user.

import { RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_FALLBACK_MS = 1500;

export function ReloadPrompt() {
  // Stash the SW update interval so the unmount cleanup can clear it.
  // `useRegisterSW`'s onRegisteredSW callback fires once outside React's
  // lifecycle, so we need our own ref to plumb the timer ID back out.
  const updateIntervalRef = useRef<number | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      if (updateIntervalRef.current !== null) {
        window.clearInterval(updateIntervalRef.current);
      }
      updateIntervalRef.current = window.setInterval(async () => {
        if (registration.installing || !navigator) return;
        if ("connection" in navigator && !navigator.onLine) return;
        try {
          const resp = await fetch(swUrl, { cache: "no-store" });
          if (resp.status === 200) await registration.update();
        } catch {
          // Network blip — try again next interval.
        }
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current !== null) {
        window.clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);

  // Edge cases on freshly-launched origins can drop workbox-window's
  // controlling event. Fall back to an explicit reload so the Update
  // button is never a no-op.
  const handleUpdate = useCallback(() => {
    void updateServiceWorker(true);
    setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);
  }, [updateServiceWorker]);

  const close = useCallback(() => {
    setOfflineReady(false);
    setNeedRefresh(false);
  }, [setOfflineReady, setNeedRefresh]);

  useEffect(() => {
    if (!offlineReady) return;
    const id = setTimeout(close, 4000);
    return () => clearTimeout(id);
  }, [offlineReady, close]);

  if (!offlineReady && !needRefresh) return null;

  const Icon = needRefresh ? RefreshCw : ShieldCheck;
  const title = needRefresh ? "Update available" : "Ready offline";
  const body = needRefresh
    ? "A new version of CloakResume is ready to install."
    : "CloakResume is now installed for offline use.";

  return (
    <div
      className="fixed right-4 bottom-4 left-4 z-100 flex justify-center sm:right-6 sm:bottom-6 sm:left-auto sm:justify-end print:hidden"
      role="status"
      aria-live="polite"
    >
      <div
        className="surface-glass relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl p-4 sm:w-auto sm:min-w-80"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-(--brand-50) text-(--brand)">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[13px] font-semibold tracking-tight text-(--ink-1)">{title}</p>
          <p className="mt-0.5 text-[12px] leading-[1.45] text-(--ink-4)">{body}</p>
          {needRefresh && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button type="button" onClick={close} className="tb ghost h-8! min-h-8! lg:h-8!">
                Later
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="tb primary h-8! min-h-8! lg:h-8!"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Update
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="-mt-1 -mr-1 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-(--ink-4) transition-colors hover:bg-[color-mix(in_oklab,var(--ink-1)_6%,transparent)] hover:text-(--ink-1)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
