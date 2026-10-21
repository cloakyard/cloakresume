import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

const POPOVER_H_EST = 364;
const SAFE_EDGE = 16;
const POPOVER_GAP = 8;

/** Shared viewport placement for the date, logo and colour portals, including short screens. */
export function usePickerPosition(
  open: boolean,
  triggerRef: RefObject<HTMLButtonElement | null>,
  surfaceRef: RefObject<HTMLDivElement | null>,
  contentKey: unknown,
) {
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: "above" | "below";
  } | null>(null);
  // Compute popover position relative to the trigger button using fixed
  // coords — the popover is portaled out of any scroll container so it
  // no longer gets clipped. visualViewport offsets keep it inside the
  // actually visible area when a software keyboard or browser zoom shifts
  // that viewport away from the layout viewport origin.
  const updateCoords = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const preferredWidth = 20 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const width = Math.min(preferredWidth, Math.max(0, viewportWidth - SAFE_EDGE * 2));
    const viewportContentTop = viewportTop + SAFE_EDGE;
    const viewportContentBottom = viewportBottom - SAFE_EDGE;
    const belowTop = Math.max(viewportContentTop, rect.bottom + POPOVER_GAP);
    const aboveBottom = Math.min(viewportContentBottom, rect.top - POPOVER_GAP);
    const spaceBelow = Math.max(0, viewportContentBottom - belowTop);
    const spaceAbove = Math.max(0, aboveBottom - viewportContentTop);
    const desiredHeight = surfaceRef.current ? surfaceRef.current.scrollHeight + 2 : POPOVER_H_EST;
    const flip = spaceBelow < Math.min(desiredHeight, POPOVER_H_EST) && spaceAbove > spaceBelow;
    // On short viewports use the available surface instead of a tiny anchored strip.
    const useViewport = Math.max(spaceAbove, spaceBelow) < Math.min(desiredHeight, 360);
    const maxHeight = useViewport ? viewportHeight - SAFE_EDGE * 2 : flip ? spaceAbove : spaceBelow;
    const renderedHeight = Math.min(desiredHeight, maxHeight);
    const top = useViewport
      ? viewportContentTop
      : flip
        ? Math.max(viewportContentTop, aboveBottom - renderedHeight)
        : belowTop;
    const left = Math.max(
      viewportLeft + SAFE_EDGE,
      Math.min(rect.left, viewportRight - width - SAFE_EDGE),
    );
    setCoords({ top, left, width, maxHeight, placement: flip ? "above" : "below" });
  }, [triggerRef, surfaceRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    // The first pass mounts the portal; the second can use its real scroll
    // height instead of the conservative pre-mount estimate.
    const frame = requestAnimationFrame(updateCoords);
    return () => cancelAnimationFrame(frame);
  }, [open, contentKey, updateCoords]);

  useEffect(() => {
    if (!open) return;
    // Capture-phase scroll listener catches any ancestor scroll container.
    const visualViewport = window.visualViewport;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    visualViewport?.addEventListener("scroll", updateCoords);
    visualViewport?.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
      visualViewport?.removeEventListener("scroll", updateCoords);
      visualViewport?.removeEventListener("resize", updateCoords);
    };
  }, [open, updateCoords]);

  return coords;
}
