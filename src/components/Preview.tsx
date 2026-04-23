/**
 * Preview pane rendering the selected template.
 *
 * Wraps the template in a `.resume-root` container so the print styles
 * defined in index.css correctly isolate the resume from application
 * chrome when window.print() is invoked.
 *
 * Zoom starts at a fit-to-width factor calculated from the scroll
 * container's available width (A4 = 210mm ≈ 794px at 96dpi, plus
 * breathing room). This keeps the preview readable on phones without
 * requiring a pinch-zoom, while still allowing users to zoom in/out
 * with the floating dock. Print styles reset the transform so the PDF
 * always prints at 1:1 A4.
 */

import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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

export function Preview({ resume, palette, paperSize, TemplateComponent }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);
  /** Unscaled layout height of the resume — used to size the outer frame so
   *  vertical scroll reflects the *visual* height, not the layout height. */
  const [innerHeight, setInnerHeight] = useState(0);
  /** Remembered fit-to-width scale — the dock's "Fit" button snaps to this. */
  const fitZoomRef = useRef(0.75);
  /** True until the user manually changes the zoom, then we stop auto-fitting. */
  const userOverrodeRef = useRef(false);

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
      className="cr-preview-scroll relative flex-1 min-w-0 min-h-0 overflow-auto cr-scroll"
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
            <TemplateComponent resume={resume} palette={palette} />
          </PaperSizeContext.Provider>
        </div>
      </div>

      <div className="print-hide sticky bottom-5 z-30 w-fit mx-auto">
        <div className="surface-glass-dark rounded-full p-1.25 inline-flex items-center gap-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="w-9 h-9 sm:w-7.5 sm:h-7.5 rounded-full grid place-items-center text-white/80 bg-transparent border-0 cursor-pointer transition-colors duration-120 hover:bg-white/10 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Reset to 100%"
            className="min-w-11.5 text-center font-mono text-[12.5px] font-medium text-white tabular-nums px-1 bg-transparent border-0 cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="w-9 h-9 sm:w-7.5 sm:h-7.5 rounded-full grid place-items-center text-white/80 bg-transparent border-0 cursor-pointer transition-colors duration-120 hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="w-px h-4.5 bg-white/15 mx-0.5" aria-hidden="true" />
          <button
            type="button"
            onClick={onFit}
            aria-label="Fit preview"
            title="Fit preview"
            className="w-9 h-9 sm:w-7.5 sm:h-7.5 rounded-full grid place-items-center text-white/80 bg-transparent border-0 cursor-pointer transition-colors duration-120 hover:bg-white/10 hover:text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
