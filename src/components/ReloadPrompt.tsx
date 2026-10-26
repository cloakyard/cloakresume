/** Explicit PWA updates: save current work before activation and again before reload. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AirUpdateNotice, type UpdateNoticeState } from "../../docs/air/update-notice.tsx";

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;

export function ReloadPrompt({ beforeReload }: { beforeReload: () => string | null }) {
  const interval = useRef<number | null>(null);
  const stopWatching = useRef<(() => void) | undefined>(undefined);
  const stopRegistrationWatch = useRef<(() => void) | undefined>(undefined);
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const inFlight = useRef(false);
  const activated = useRef(false);
  const reloadStarted = useRef(false);
  const mounted = useRef(true);
  const [state, setState] = useState<UpdateNoticeState>("update");
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
    <AirUpdateNotice
      state={needRefresh ? state : "offline"}
      detail={state === "error" ? error : undefined}
      onClose={close}
      onUpdate={handleUpdate}
      onPause={setPaused}
    />
  ) : null;
}
