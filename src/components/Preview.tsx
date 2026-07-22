/**
 * Preview pane rendering the selected template.
 *
 * Wraps the template in a `.resume-root` container so the print styles
 * defined in index.css correctly isolate the resume from application
 * chrome when window.print() is invoked.
 *
 * Zoom starts at a fit-to-width factor calculated from the scroll
 * container's available width (A4 = 210mm ≈ 794px at 96dpi, plus
 * breathing room). The fit factor keeps the preview readable on
 * phones; users can fine-tune via the compact dock or — on touch —
 * by pinching directly on the preview. The gesture writes into the same `zoom` state the
 * dock controls, so dock and pinch stay in sync. Print styles reset
 * the transform so the PDF always prints at 1:1 A4.
 */

import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { PaperSizeContext } from "./PaginatedCanvas.tsx";
import type { TemplateProps } from "../templates/index.ts";
import type { ResumeData } from "../types.ts";
import { clamp, type PrimaryPalette } from "../utils/colors.ts";
import { PAPER_SIZES, type PaperSize } from "../utils/paperSize.ts";

interface PreviewProps {
  resume: ResumeData;
  palette: PrimaryPalette;
  paperSize: PaperSize;
  TemplateComponent: ComponentType<TemplateProps>;
}

/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;
const FIT_PADDING = 32;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.5;

function clampZoom(z: number): number {
  return clamp(Number(z.toFixed(2)), MIN_ZOOM, MAX_ZOOM);
}

function TemplateLoadingPage() {
  return (
    <div className="resume-page grid place-items-center bg-(--color-proof-paper)">
      <span className="font-mono text-xs text-(--color-proof-ink-2)" role="status">
        Preparing document…
      </span>
    </div>
  );
}

function ReadyTemplate({
  TemplateComponent,
  resume,
  palette,
  onReady,
}: Pick<PreviewProps, "TemplateComponent" | "resume" | "palette"> & { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return <TemplateComponent resume={resume} palette={palette} />;
}

export function Preview({ resume, palette, paperSize, TemplateComponent }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);
  const [readyTemplate, setReadyTemplate] = useState<ComponentType<TemplateProps> | null>(null);
  /** Unscaled layout height of the resume — used to size the outer frame so
   *  vertical scroll reflects the *visual* height, not the layout height. */
  const [innerHeight, setInnerHeight] = useState(0);
  /** Remembered fit-to-width scale — the dock's "Fit" button snaps to this. */
  const fitZoomRef = useRef(0.75);
  /** True until the user manually changes the zoom, then we stop auto-fitting. */
  const userOverrodeRef = useRef(false);
  /** Mirror of `zoom` so the touch listeners (registered once with
   *  `{ passive: false }`) can read the latest value without
   *  re-binding on every render. */
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const markTemplateReady = useCallback(
    () => setReadyTemplate(() => TemplateComponent),
    [TemplateComponent],
  );

  const { widthMm: pageWidthMm, heightMm: pageHeightMm } = PAPER_SIZES[paperSize];
  const pageWidthPx = pageWidthMm * PX_PER_MM;

  const computeFitZoom = useCallback(
    (containerWidth: number): number => {
      const available = Math.max(200, containerWidth - FIT_PADDING);
      const raw = available / pageWidthPx;
      // Desktop users get up to 100 % but never more; mobile clamps to MIN_ZOOM.
      return clampZoom(Math.min(1, raw));
    },
    [pageWidthPx],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth;
      const next = computeFitZoom(width);
      fitZoomRef.current = next;
      if (!userOverrodeRef.current) setZoom(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [computeFitZoom]);

  /** Track the unscaled layout height of the inner resume so we can size
   *  the visual frame proportionally (scale alone doesn't affect layout). */
  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      setInnerHeight(entries[0]?.contentRect.height ?? el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** Two-finger document zoom on the proof surface. Browser page zoom
   *  remains available elsewhere; this gesture drives the same scale as
   *  the dock so the rendered document and percentage stay in sync. We
   *  attach via `addEventListener` (not the React handler) so we can
   *  pass `{ passive: false }` and `preventDefault` the move while two
   *  fingers are down — otherwise iOS will hijack the gesture into a
   *  two-finger scroll that fights the zoom transform. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let pinch: { startDist: number; startZoom: number } | null = null;

    const distance = (touches: TouchList): number => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch = { startDist: distance(e.touches), startZoom: zoomRef.current };
        userOverrodeRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length < 2) return;
      e.preventDefault();
      const ratio = distance(e.touches) / Math.max(1, pinch.startDist);
      setZoom(clampZoom(pinch.startZoom * ratio));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const onZoomOut = () => {
    userOverrodeRef.current = true;
    setZoom((z) => clampZoom(z - 0.1));
  };
  const onZoomIn = () => {
    userOverrodeRef.current = true;
    setZoom((z) => clampZoom(z + 0.1));
  };
  const onReset = () => {
    userOverrodeRef.current = true;
    setZoom(1);
  };
  const onFit = () => {
    userOverrodeRef.current = false;
    setZoom(fitZoomRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="cr-preview-scroll relative flex-1 min-w-0 min-h-0 overflow-auto cr-scroll [touch-action:pan-x_pan-y_pinch-zoom]"
    >
      {/* Outer frame sizes the scroll box to the *scaled* page so the
          transform actually affects layout dimensions — otherwise the
          layout box stays at the paper width and forces horizontal scroll
          on phones. Height tracks the measured inner height × zoom. */}
      <div
        className="mx-auto"
        style={{
          width: `calc(${pageWidthMm}mm * ${zoom})`,
          height: innerHeight > 0 ? `${innerHeight * zoom}px` : undefined,
        }}
      >
        <div
          ref={innerRef}
          className="resume-root"
          data-template-ready={readyTemplate === TemplateComponent ? "true" : undefined}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${pageWidthMm}mm`,
            // Published as CSS vars so `.resume-page` + print styles can
            // size themselves off the same source of truth.
            ["--resume-page-w" as string]: `${pageWidthMm}mm`,
            ["--resume-page-h" as string]: `${pageHeightMm}mm`,
          }}
        >
          <PaperSizeContext.Provider value={paperSize}>
            <Suspense fallback={<TemplateLoadingPage />}>
              <ReadyTemplate
                TemplateComponent={TemplateComponent}
                resume={resume}
                palette={palette}
                onReady={markTemplateReady}
              />
            </Suspense>
          </PaperSizeContext.Provider>
        </div>
      </div>

      <div className="print-hide sticky bottom-5 z-30 w-fit mx-auto">
        <div className="cr-preview-tools inline-flex items-center gap-0.5 rounded-md p-1">
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-(--color-night-muted) transition-colors duration-160 hover:bg-(--color-night-2) hover:text-(--color-night-ink)"
          >
            <ZoomOut aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label={`Reset zoom to 100 percent. Current zoom ${Math.round(zoom * 100)} percent`}
            title="Reset to 100%"
            className="min-h-10 min-w-12 cursor-pointer rounded-md border-0 bg-transparent px-1 text-center font-mono text-xs font-medium tabular-nums text-(--color-night-ink) hover:bg-(--color-night-2)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-(--color-night-muted) transition-colors duration-160 hover:bg-(--color-night-2) hover:text-(--color-night-ink)"
          >
            <ZoomIn aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-(--color-night-rule)" aria-hidden="true" />
          <button
            type="button"
            onClick={onFit}
            aria-label="Fit preview"
            title="Fit preview"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-(--color-night-muted) transition-colors duration-160 hover:bg-(--color-night-2) hover:text-(--color-night-ink)"
          >
            <Maximize2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
