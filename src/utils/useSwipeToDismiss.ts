import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

const DISMISS_DISTANCE_PX = 120;
const DISMISS_VELOCITY_PX_PER_MS = 0.11;
const REVERSE_DRAG_DAMPING = 0.08;

interface SwipeGesture {
  pointerId: number;
  startY: number;
  startTime: number;
  distance: number;
}

/**
 * Shared, compositor-only swipe-to-dismiss behavior for mobile sheets.
 * Pointer capture preserves the gesture outside the handle, a small reverse
 * damping avoids an invisible hard stop, and velocity lets a short flick count.
 */
export function useSwipeToDismiss<T extends HTMLElement>(
  surfaceRef: RefObject<T | null>,
  onDismiss: () => void,
) {
  const gestureRef = useRef<SwipeGesture | null>(null);

  const settle = useCallback(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    surface.style.transition = "";
    window.requestAnimationFrame(() => {
      if (surfaceRef.current === surface) surface.style.transform = "";
    });
  }, [surfaceRef]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!event.isPrimary || event.button !== 0 || gestureRef.current) return;
      const surface = surfaceRef.current;
      if (!surface) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      surface.style.transition = "none";
      gestureRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startTime: performance.now(),
        distance: 0,
      };
    },
    [surfaceRef],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      const surface = surfaceRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId || !surface) return;

      const rawDistance = event.clientY - gesture.startY;
      const renderedDistance = rawDistance >= 0 ? rawDistance : rawDistance * REVERSE_DRAG_DAMPING;
      gesture.distance = Math.max(0, rawDistance);
      surface.style.transform = `translateY(${renderedDistance}px)`;
    },
    [surfaceRef],
  );

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLElement>, cancelled = false) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gestureRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const elapsed = Math.max(1, performance.now() - gesture.startTime);
      const velocity = gesture.distance / elapsed;
      if (
        !cancelled &&
        (gesture.distance >= DISMISS_DISTANCE_PX || velocity > DISMISS_VELOCITY_PX_PER_MS)
      ) {
        onDismiss();
        return;
      }

      settle();
    },
    [onDismiss, settle],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => finish(event),
    [finish],
  );
  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => finish(event, true),
    [finish],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } as const;
}
