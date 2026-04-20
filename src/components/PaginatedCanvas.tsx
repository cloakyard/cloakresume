/**
 * Auto-paginating A4 canvas.
 *
 * Accepts a sequence of top-level section blocks and packs them into as
 * many A4 pages as needed. Each block is treated as atomic — if it fits
 * in the remaining space on the current page it stays there, otherwise
 * a new page is started. Sections that are themselves taller than an
 * A4 page are allowed to spill (the print engine + CSS
 * `break-inside: auto` on over-tall atoms handles that gracefully).
 *
 * `sidebar` can be either a ReactNode (repeated on every page) or a
 * render function `(pageIndex, pageCount) => ReactNode` so callers like
 * Classic Sidebar can split their sidebar content across pages (e.g.
 * contact+skills on page 1; certifications, awards, etc. from page 2
 * onwards).
 */

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SidebarRenderer = ReactNode | ((pageIndex: number, pageCount: number) => ReactNode);

interface PaginatedCanvasProps {
  /** Sidebar content — same on every page, or a function to vary it. */
  sidebar?: SidebarRenderer;
  sidebarWidthMm?: number;
  sidebarBackground?: string;
  /** Padding [top/bottom, left/right] for the main column, in mm. */
  mainPaddingMm?: [number, number];
  /** Padding inside the sidebar column, in mm. */
  sidebarPaddingMm?: [number, number];
  /** Per-page inner class applied to the flex grid — template styling hook. */
  pageClassName?: string;
  /** Each top-level block is a pagination atom. */
  children: ReactNode;
}

/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;
const A4_H_PX = 297 * PX_PER_MM;
const A4_W_PX = 210 * PX_PER_MM;

export function PaginatedCanvas({
  sidebar,
  sidebarWidthMm = 0,
  sidebarBackground,
  mainPaddingMm = [10, 10],
  sidebarPaddingMm = [10, 7],
  pageClassName,
  children,
}: PaginatedCanvasProps) {
  const blocks = useMemo(() => Children.toArray(children), [children]);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageGroups, setPageGroups] = useState<number[][]>([blocks.map((_, i) => i)]);

  const [topPadMm, xPadMm] = mainPaddingMm;
  const budgetPx = A4_H_PX - topPadMm * 2 * PX_PER_MM;
  const mainWidthPx = sidebar
    ? A4_W_PX - (sidebarWidthMm + xPadMm * 2) * PX_PER_MM
    : A4_W_PX - xPadMm * 2 * PX_PER_MM;

  const measure = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const heights = children.map((el) => el.getBoundingClientRect().height);
    const groups: number[][] = [];
    let current: number[] = [];
    let used = 0;
    heights.forEach((h, idx) => {
      if (current.length > 0 && used + h > budgetPx) {
        groups.push(current);
        current = [idx];
        used = h;
      } else {
        current.push(idx);
        used += h;
      }
    });
    if (current.length > 0) groups.push(current);
    if (groups.length === 0) groups.push([]);
    setPageGroups((prev) => (groupsEqual(prev, groups) ? prev : groups));
  }, [budgetPx]);

  useLayoutEffect(() => {
    void blocks;
    void mainWidthPx;
    measure();
    if (typeof document !== "undefined" && "fonts" in document) {
      const fonts = document.fonts as unknown as { ready: Promise<void> };
      fonts.ready.then(measure).catch(() => undefined);
    }
  }, [measure, blocks, mainWidthPx]);

  useEffect(() => {
    const ro = new ResizeObserver(() => measure());
    if (measureRef.current) ro.observe(measureRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const renderSidebar = (pageIndex: number, pageCount: number): ReactNode => {
    if (typeof sidebar === "function") return sidebar(pageIndex, pageCount);
    return sidebar ?? null;
  };

  return (
    <>
      {/* Hidden measurement container. Position off-screen so it doesn't
          contribute to layout but keeps layout parity with the visible pages. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={pageClassName}
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: `${mainWidthPx}px`,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {blocks}
      </div>

      {pageGroups.map((group, pageIndex) => (
        <div className="resume-page" key={pageIndex}>
          {sidebar ? (
            <div
              className={pageClassName}
              style={{
                display: "grid",
                gridTemplateColumns: `${sidebarWidthMm}mm 1fr`,
                minHeight: "297mm",
              }}
            >
              <aside
                style={{
                  background: sidebarBackground,
                  padding: `${sidebarPaddingMm[0]}mm ${sidebarPaddingMm[1]}mm`,
                }}
              >
                {renderSidebar(pageIndex, pageGroups.length)}
              </aside>
              <main style={{ padding: `${topPadMm}mm ${xPadMm}mm` }}>
                {group.map((idx) => (
                  <div key={idx} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                    {blocks[idx]}
                  </div>
                ))}
              </main>
            </div>
          ) : (
            <div
              className={pageClassName}
              style={{ padding: `${topPadMm}mm ${xPadMm}mm`, minHeight: "297mm" }}
            >
              {group.map((idx) => (
                <div key={idx} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  {blocks[idx]}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function groupsEqual(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) if (a[i][j] !== b[i][j]) return false;
  }
  return true;
}
