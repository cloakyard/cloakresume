/** Explicit PWA updates: save current work before activation and again before reload. */
import { CircleAlert, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
type ReloadNoticeState = "offline" | "update" | "updating" | "error";

export function ReloadPromptView({
  state,
  error,
  onClose,
  onUpdate,
  onPause,
}: {
  state: ReloadNoticeState;
  error?: string;
  onClose: () => void;
  onUpdate: () => void;
  onPause: (paused: boolean) => void;
}) {
  const titleId = useId();
  const root = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const busy = state === "updating";
  const title =
    state === "offline"
      ? "Ready offline"
      : busy
        ? "Updating CloakResume"
        : state === "error"
          ? "Update paused"
          : "Update ready";
  const body =
    state === "offline"
      ? "The app is cached. Fonts and language tools may still need a connection."
      : busy
        ? "Activating the new version. Your latest changes will be saved before reloading."
        : state === "error"
          ? error
          : "A new version is ready. Your draft will be saved before reloading.";
  const Icon = state === "error" ? CircleAlert : state === "offline" ? ShieldCheck : RefreshCw;
  const label = busy ? "Updating…" : state === "error" ? "Try again" : "Update and reload";

  useLayoutEffect(() => {
    const node = root.current;
    const remember = () => {
      if (document.activeElement instanceof HTMLElement && !node?.contains(document.activeElement))
        previousFocus.current = document.activeElement;
    };
    remember();
    document.addEventListener("focusin", remember);
    const resize = new ResizeObserver(() => {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && node?.contains(focused))
        focused.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    if (node) {
      resize.observe(node);
      if (node.firstElementChild) resize.observe(node.firstElementChild);
    }
    return () => {
      document.removeEventListener("focusin", remember);
      resize.disconnect();
      if (node?.contains(document.activeElement) && previousFocus.current?.isConnected)
        previousFocus.current.focus({ preventScroll: true });
    };
  }, []);

  return (
    <section
      ref={root}
      className="resume-update"
      data-state={state}
      aria-labelledby={titleId}
      onPointerEnter={() => onPause(true)}
      onPointerLeave={() => onPause(Boolean(root.current?.contains(document.activeElement)))}
      onFocusCapture={() => onPause(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          onPause(event.currentTarget.matches(":hover"));
      }}
    >
      <div className="resume-update-content">
        <Icon aria-hidden="true" size={20} strokeWidth={1.6} />
        <div
          className="resume-update-copy"
          role={state === "error" ? "alert" : "status"}
          aria-atomic="true"
        >
          <h2 id={titleId}>{title}</h2>
          <p>{body}</p>
        </div>
        <div className="resume-update-actions">
          {state !== "offline" && (
            <>
              <button
                type="button"
                className="air-button air-button--quiet"
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  event.currentTarget.focus();
                  if (!busy) onClose();
                }}
              >
                Later
              </button>
              <button
                type="button"
                className="air-button air-button--primary"
                aria-label={label}
                aria-disabled={busy || undefined}
                aria-busy={busy || undefined}
                onClick={(event) => {
                  event.currentTarget.focus();
                  if (!busy) onUpdate();
                }}
              >
                <span className="air-action-labels">
                  {["Update and reload", "Updating…", "Try again"].map((text) => (
                    <span
                      key={text}
                      data-active={label === text || undefined}
                      aria-hidden={label !== text || undefined}
                    >
                      {text}
                    </span>
                  ))}
                </span>
              </button>
            </>
          )}
          <button
            type="button"
            className="air-icon-button air-button--quiet"
            aria-label="Dismiss update notice"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              event.currentTarget.focus();
              if (!busy) onClose();
            }}
          >
            <X aria-hidden="true" size={18} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function ReloadPrompt({ beforeReload }: { beforeReload: () => string | null }) {
  const interval = useRef<number | null>(null);
  const stopWatching = useRef<(() => void) | undefined>(undefined);
  const stopRegistrationWatch = useRef<(() => void) | undefined>(undefined);
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const inFlight = useRef(false);
  const activated = useRef(false);
  const reloadStarted = useRef(false);
  const mounted = useRef(true);
  const [state, setState] = useState<ReloadNoticeState>("update");
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);

  const fail = useCallback((message: string) => {
    stopWatching.current?.();
    inFlight.current = false;
    setError(message);
    setState("error");
  }, []);
  const reloadSafely = useCallback(() => {
    if (!mounted.current || !inFlight.current || reloadStarted.current) return;
    if (registration.current?.active?.state !== "activated") return;
    const blocked = beforeReload();
    if (blocked) {
      fail(blocked);
      return;
    }
    reloadStarted.current = true;
    stopWatching.current?.();
    window.location.reload();
  }, [beforeReload, fail]);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onNeedRefresh() {
      activated.current = false;
    },
    onNeedReload() {
      if (!mounted.current) return;
      activated.current = true;
      // A different tab may activate an update. This tab still requires consent.
      if (inFlight.current) reloadSafely();
      else setNeedRefresh(true);
    },
    onRegisteredSW(swUrl, nextRegistration) {
      if (!nextRegistration || !mounted.current) return;
      registration.current = nextRegistration;
      // Workbox stops observing updatefound after a later/external install. Keep
      // subsequent updates discoverable, including recovery after a failed install.
      stopRegistrationWatch.current?.();
      const workers = new Map<ServiceWorker, () => void>();
      const watchInstall = () => {
        const worker = nextRegistration.installing;
        if (!worker || workers.has(worker)) return;
        const changed = () => {
          if (
            worker.state === "installed" &&
            nextRegistration.active &&
            nextRegistration.waiting === worker &&
            !inFlight.current
          ) {
            activated.current = false;
            setState("update");
            setNeedRefresh(true);
          }
          if (worker.state === "installed" || worker.state === "redundant") {
            worker.removeEventListener("statechange", changed);
            workers.delete(worker);
          }
        };
        workers.set(worker, changed);
        worker.addEventListener("statechange", changed);
      };
      nextRegistration.addEventListener("updatefound", watchInstall);
      watchInstall();
      stopRegistrationWatch.current = () => {
        nextRegistration.removeEventListener("updatefound", watchInstall);
        for (const [worker, changed] of workers) worker.removeEventListener("statechange", changed);
      };
      if (interval.current !== null) window.clearInterval(interval.current);
      let checking = false;
      interval.current = window.setInterval(async () => {
        if (checking || nextRegistration.installing || !navigator.onLine) return;
        checking = true;
        try {
          const response = await fetch(swUrl, { cache: "no-store" });
          if (response.status === 200 && mounted.current) await nextRegistration.update();
        } catch {
          /* A transient network failure can wait for the next check. */
        } finally {
          checking = false;
        }
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  useEffect(() => {
    const container = navigator.serviceWorker;
    if (!container) return;
    let controller = container.controller;
    const onControllerChange = () => {
      const next = container.controller;
      const wasControlled = controller !== null;
      const changed = next !== controller;
      controller = next;
      if (!wasControlled || !changed || !next) return;
      activated.current = true;
      if (inFlight.current) reloadSafely();
      else setNeedRefresh(true);
    };
    container.addEventListener("controllerchange", onControllerChange);
    return () => container.removeEventListener("controllerchange", onControllerChange);
  }, [reloadSafely, setNeedRefresh]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (interval.current !== null) window.clearInterval(interval.current);
      stopWatching.current?.();
      stopRegistrationWatch.current?.();
    };
  }, []);

  const handleUpdate = () => {
    if (inFlight.current) return;
    const blocked = beforeReload();
    if (blocked) {
      fail(blocked);
      return;
    }
    inFlight.current = true;
    setState("updating");
    const worker = activated.current ? registration.current?.active : registration.current?.waiting;
    if (!worker) {
      fail(
        "The update is no longer waiting. Keep working and try again when a new version is ready.",
      );
      return;
    }
    const checkWorker = () => {
      if (!mounted.current || !inFlight.current) return;
      if (worker.state === "activated") {
        activated.current = true;
        reloadSafely();
      } else if (worker.state === "redundant") {
        fail(
          "The update didn’t finish. Your draft stays here. Check your connection, then try again.",
        );
      }
    };
    worker.addEventListener("statechange", checkWorker);
    stopWatching.current = () => worker.removeEventListener("statechange", checkWorker);
    try {
      // Workbox's helper discards the message promise; send to the known waiting
      // worker directly so a synchronous delivery failure remains recoverable.
      if (worker.state === "installed") worker.postMessage({ type: "SKIP_WAITING" });
      // The worker's actual activation also covers a missed Workbox controlling event.
      checkWorker();
    } catch {
      if (mounted.current)
        fail(
          "The update didn’t finish. Your draft stays here. Check your connection, then try again.",
        );
    }
  };
  const close = () => {
    if (inFlight.current) return;
    setState("update");
    setOfflineReady(false);
    setNeedRefresh(false);
  };
  useEffect(() => {
    if (!offlineReady || needRefresh || paused) return;
    const timer = window.setTimeout(() => setOfflineReady(false), 4000);
    return () => window.clearTimeout(timer);
  }, [offlineReady, needRefresh, paused, setOfflineReady]);

  return needRefresh || offlineReady ? (
    <ReloadPromptView
      state={needRefresh ? state : "offline"}
      error={error}
      onClose={close}
      onUpdate={handleUpdate}
      onPause={setPaused}
    />
  ) : null;
}
