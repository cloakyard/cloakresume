/* Hallmark · component: PWA update notice · genre: modern-minimal · theme: CloakResume
 * states: default · hover · focus · active · disabled · loading · error · success
 * pre-emit critique: P5 H5 E5 S5 R5 V4 · contrast: pass (40–41) */
// ReloadPrompt.tsx — PWA service-worker update banner.
//
// Renders a solid token-based card pinned to the bottom-right of the
// viewport when one of two things happens:
//
//   • A new service-worker version becomes available — shows an
//     explicit "Update & Reload" CTA, plus progress and retry states.
//   • The current version finishes caching — shows a self-dismissing
//     "Ready offline" toast for 4 s without implying OS installation.
//
// Polls the SW URL every 10 minutes (skipping the poll when the
// user is offline or another install is already in flight) so a
// long-lived editor session can pick up an update without a full
// reload from the user.

import { CircleAlert, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_FALLBACK_MS = 1500;

type ReloadNoticeState = "offline" | "update" | "updating" | "error";

type ReloadPromptViewProps = {
  state: ReloadNoticeState;
  onClose: () => void;
  onUpdate: () => void;
};

export function ReloadPromptView({ state, onClose, onUpdate }: ReloadPromptViewProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isUpdating = state === "updating";
  const isError = state === "error";
  const isUpdateNotice = state !== "offline";
  const Icon = isError ? CircleAlert : state === "offline" ? ShieldCheck : RefreshCw;
  const title =
    state === "offline"
      ? "Ready Offline"
      : isUpdating
        ? "Updating CloakResume"
        : isError
          ? "Update Didn’t Finish"
          : "Update Ready";
  const body =
    state === "offline"
      ? "This version is cached and ready to use offline."
      : isUpdating
        ? "Installing the latest version and reloading…"
        : isError
          ? "Check your connection, then try again."
          : "A new version is ready. Update now to reload CloakResume.";

  return (
    <div
      className="fixed right-4 bottom-4 left-4 flex justify-center sm:right-6 sm:bottom-6 sm:left-auto sm:justify-end print:hidden"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      style={{ zIndex: "var(--z-toast)" }}
    >
      <div
        className="cr-popover cr-toast relative flex w-full max-w-sm flex-col overflow-hidden rounded-md p-4 sm:w-auto sm:min-w-80"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-1 grid h-5 w-5 shrink-0 place-items-center ${
              isError ? "text-(--danger)" : "text-(--brand)"
            }`}
          >
            <Icon
              aria-hidden="true"
              className={`h-4 w-4 ${isUpdating ? "motion-safe:animate-spin" : ""}`}
            />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              id={titleId}
              className="text-sm font-semibold tracking-tight text-pretty text-(--ink-1)"
            >
              {title}
            </p>
            <p
              id={descriptionId}
              className="mt-0.5 text-sm leading-[1.5] text-pretty text-(--ink-4)"
            >
              {body}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            aria-label={`Dismiss ${title.toLowerCase()} notice`}
            className="-mt-2 -mr-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-(--ink-4) transition-colors hover:bg-(--surface-2) hover:text-(--ink-1)"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
        {isUpdateNotice && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="tb ghost h-11! min-h-11! whitespace-nowrap min-[640px]:h-10! min-[640px]:min-h-10!"
            >
              Later
            </button>
            <button
              type="button"
              onClick={onUpdate}
              disabled={isUpdating}
              aria-busy={isUpdating || undefined}
              className="tb primary h-11! min-h-11! whitespace-nowrap min-[640px]:h-10! min-[640px]:min-h-10!"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${isUpdating ? "motion-safe:animate-spin" : ""}`}
              />
              {isUpdating ? "Updating…" : isError ? "Try Again" : "Update & Reload"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReloadPrompt() {
  // Stash the SW update interval so the unmount cleanup can clear it.
  // `useRegisterSW`'s onRegisteredSW callback fires once outside React's
  // lifecycle, so we need our own ref to plumb the timer ID back out.
  const updateIntervalRef = useRef<number | null>(null);
  const reloadFallbackRef = useRef<number | null>(null);
  const updateInFlightRef = useRef(false);
  const [updateState, setUpdateState] =
    useState<Extract<ReloadNoticeState, "update" | "updating" | "error">>("update");

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
        if (registration.installing) return;
        if (!navigator.onLine) return;
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
      if (reloadFallbackRef.current !== null) {
        window.clearTimeout(reloadFallbackRef.current);
        reloadFallbackRef.current = null;
      }
    };
  }, []);

  // Edge cases on freshly-launched origins can drop workbox-window's
  // controlling event. Fall back to an explicit reload so the Update
  // button is never a no-op.
  const handleUpdate = useCallback(async () => {
    if (updateInFlightRef.current) return;
    updateInFlightRef.current = true;
    setUpdateState("updating");
    reloadFallbackRef.current = window.setTimeout(
      () => window.location.reload(),
      RELOAD_FALLBACK_MS,
    );
    try {
      await updateServiceWorker(true);
    } catch {
      if (reloadFallbackRef.current !== null) {
        window.clearTimeout(reloadFallbackRef.current);
        reloadFallbackRef.current = null;
      }
      updateInFlightRef.current = false;
      setUpdateState("error");
    }
  }, [updateServiceWorker]);

  const close = useCallback(() => {
    if (updateInFlightRef.current) return;
    setUpdateState("update");
    setOfflineReady(false);
    setNeedRefresh(false);
  }, [setOfflineReady, setNeedRefresh]);

  useEffect(() => {
    if (!offlineReady) return;
    const id = setTimeout(close, 4000);
    return () => clearTimeout(id);
  }, [offlineReady, close]);

  if (!offlineReady && !needRefresh) return null;

  const state: ReloadNoticeState = needRefresh ? updateState : "offline";

  return <ReloadPromptView state={state} onClose={close} onUpdate={handleUpdate} />;
}
