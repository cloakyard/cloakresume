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
 * render function. When `sidebarAtoms` is supplied, the function signature
 * is `(pageIndex, pageCount, atomsForPage) => ReactNode` and sidebar
 * content is paginated independently of the main column so sections that
 * overflow page 1's sidebar continue onto later pages rather than being
 * hidden or pushing the page past A4.
 *
 * IMPORTANT: Heights are read from `offsetHeight`, NOT
 * `getBoundingClientRect().height`. The preview wraps this canvas in a
 * `transform: scale(zoom)` container, and `getBoundingClientRect` would
 * return the *visually scaled* height — causing more content to appear
 * to fit per page at lower zooms and fewer at higher ones. `offsetHeight`
 * returns the unscaled layout box height, so pagination stays identical
 * across all zoom levels and matches print output.
 *
 * KEEP-WITH-NEXT: an atom whose root element carries
 * `data-keep-with-next="true"` is treated as "must not end a page" —
 * the packer evicts it onto the next page alongside whatever would have
 * caused the overflow. Templates use this on section headings (H2s) so
 * that a heading like "Experience" can never be orphaned at the bottom
 * of a page with its first item on the next. Multiple consecutive
 * keep-with-next atoms are all evicted together. A safety rail prevents
 * evicting every atom off a page (we always keep at least one).
 *
 * PAGE HEIGHT: when sidebar pagination is active (`sidebarAtoms`
 * provided), each rendered page is exactly 297mm with `overflow: hidden`
 * so a dense sidebar can never stretch the page past A4. Without sidebar
 * atoms the page uses `min-height: 297mm` so normal templates render
 * identically to before.
 */

import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PAPER_SIZE, PAPER_SIZES, type PaperSize } from "../utils/paperSize.ts";

/**
 * Paper size context — Preview / exporters provide the selected size so
 * every PaginatedCanvas in the tree paginates against the matching
 * dimensions without each template having to thread the prop manually.
 */
export const PaperSizeContext = createContext<PaperSize>(DEFAULT_PAPER_SIZE);

type SidebarRenderer =
  | ReactNode
  | ((pageIndex: number, pageCount: number, atomsForPage: ReactNode[]) => ReactNode);

interface PaginatedCanvasProps {
  /**
   * Sidebar content. Either a static ReactNode repeated on every page,
   * or a render function. When `sidebarAtoms` is supplied, the render
   * function receives the paginated atoms for the current page as its
   * third argument.
   */
  sidebar?: SidebarRenderer;
  /**
   * Paginable sidebar content. When provided, each atom is measured and
   * packed into sidebar-column pages the same way main atoms are packed
   * into main-column pages. If the sidebar needs more pages than the
   * main column (or vice-versa), the shorter column renders empty on
   * the extra pages. The total page count is `max(mainPages, sidebarPages)`.
   *
   * The first atom is typically an identity block (photo + name +
   * title); because the packer measures it directly, there is no need
   * for a fragile "reserve height" heuristic.
   */
  sidebarAtoms?: ReactNode[];
  /**
   * Effective content width (mm) for sidebar atom measurement. Defaults
   * to `sidebarWidthMm`. Templates whose sidebar CSS applies internal
   * padding should pass `sidebarWidthMm − 2 × internalPadding` so atoms
   * measure at their real rendered width.
   */
  sidebarContentWidthMm?: number;
  /** Optional CSS class applied to the sidebar `<aside>` element. */
  sidebarClassName?: string;
  sidebarWidthMm?: number;
  sidebarBackground?: string;
  /** Padding [top/bottom, left/right] for the main column, in mm. */
  mainPaddingMm?: [number, number];
  /** Padding inside the sidebar column, in mm. */
  sidebarPaddingMm?: [number, number];
  /**
   * mm reserved at the top of sidebar pages 2+ for a continuation header
   * (e.g. "Name — ctd.") rendered above the atoms on those pages only.
   * The packer reduces the budget for pages 2+ by this amount so atoms
   * don't overflow past the header when the page's `overflow: hidden`
   * clips them. Leave at 0 if the template has no continuation header.
   */
  sidebarContinuationReserveMm?: number;
  /**
   * mm of safety buffer reserved at the bottom of every sidebar page.
   * The packer shrinks the budget by this amount so atoms never sit
   * flush against the bottom edge. Useful for visually consistent
   * breathing room on continuation pages.
   */
  sidebarBottomBufferMm?: number;
  /** Per-page inner class applied to the flex grid — template styling hook. */
  pageClassName?: string;
  /** Each top-level block is a pagination atom. */
  children: ReactNode;
}

/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;

export function PaginatedCanvas({
  sidebar,
  sidebarAtoms,
  sidebarContentWidthMm,
  sidebarClassName,
  sidebarWidthMm = 0,
  sidebarBackground,
  mainPaddingMm = [10, 10],
  sidebarPaddingMm = [10, 7],
  sidebarContinuationReserveMm = 0,
  sidebarBottomBufferMm = 0,
  pageClassName,
  children,
}: PaginatedCanvasProps) {
  const paperSize = useContext(PaperSizeContext);
  const { widthMm: pageWidthMm, heightMm: pageHeightMm } = PAPER_SIZES[paperSize];
  const pageWidthPx = pageWidthMm * PX_PER_MM;
  const pageHeightPx = pageHeightMm * PX_PER_MM;

  const blocks = useMemo(() => Children.toArray(children), [children]);
  const sidebarBlocks = useMemo(
    () => (sidebarAtoms ? Children.toArray(sidebarAtoms) : []),
    [sidebarAtoms],
  );
  const measureRef = useRef<HTMLDivElement>(null);
  const sidebarMeasureRef = useRef<HTMLDivElement>(null);
  const [pageGroups, setPageGroups] = useState<number[][]>(() => [blocks.map((_, i) => i)]);
  const [sidebarGroups, setSidebarGroups] = useState<number[][]>(() =>
    sidebarBlocks.length > 0 ? [sidebarBlocks.map((_, i) => i)] : [],
  );

  const [topPadMm, xPadMm] = mainPaddingMm;
  const [sidebarTopPadMm, sidebarXPadMm] = sidebarPaddingMm;
  const budgetPx = pageHeightPx - topPadMm * 2 * PX_PER_MM;
  const sidebarBudgetPx = pageHeightPx - sidebarTopPadMm * 2 * PX_PER_MM;
  const mainWidthPx = sidebar
    ? pageWidthPx - (sidebarWidthMm + xPadMm * 2) * PX_PER_MM
    : pageWidthPx - xPadMm * 2 * PX_PER_MM;
  const sidebarMeasureWidthPx =
    (sidebarContentWidthMm ?? Math.max(sidebarWidthMm - sidebarXPadMm * 2, 0)) * PX_PER_MM;

  const measure = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const heights = children.map((el) => el.offsetHeight);
    const total = heights.reduce((a, b) => a + b, 0);
    if (total === 0 && heights.length > 0) return;
    // Each child is a flow-root wrapper around the actual atom. Check
    // the wrapper's first element child for the keep-with-next flag (the
    // atom's root carries the attribute).
    const keep = children.map((el) => {
      const atom = el.firstElementChild as HTMLElement | null;
      return atom?.dataset.keepWithNext === "true";
    });
    const groups: number[][] = [];
    let current: number[] = [];
    let used = 0;
    const closePage = () => {
      const carry: number[] = [];
      while (current.length > 1 && keep[current[current.length - 1] as number]) {
        const popped = current.pop() as number;
        carry.unshift(popped);
      }
      groups.push(current);
      current = carry;
      used = carry.reduce((sum, i) => sum + heights[i], 0);
    };
    heights.forEach((h, idx) => {
      if (current.length > 0 && used + h > budgetPx) {
        closePage();
      }
      current.push(idx);
      used += h;
    });
    if (current.length > 0) groups.push(current);
    if (groups.length === 0) groups.push([]);
    setPageGroups((prev) => (groupsEqual(prev, groups) ? prev : groups));
  }, [budgetPx]);

  const measureSidebar = useCallback(() => {
    if (sidebarBlocks.length === 0) {
      setSidebarGroups((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const container = sidebarMeasureRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const heights = children.map((el) => el.offsetHeight);
    const total = heights.reduce((a, b) => a + b, 0);
    if (total === 0 && heights.length > 0) return;
    // Sidebar atoms don't use keep-with-next — section headers are
    // embedded inside each atom alongside their content, so there's no
    // orphaned-header risk to guard against.
    //
    // Per-page budget: page 0 uses the full budget minus the optional
    // bottom buffer. Pages 1+ additionally subtract the continuation-
    // header reserve because those pages render a header (e.g. "Name —
    // ctd.") above the atoms that isn't measured as an atom itself.
    const bottomBufferPx = sidebarBottomBufferMm * PX_PER_MM;
    const continuationReservePx = sidebarContinuationReserveMm * PX_PER_MM;
    const budgetForPage = (pageIdx: number) =>
      sidebarBudgetPx - bottomBufferPx - (pageIdx > 0 ? continuationReservePx : 0);
    const groups: number[][] = [];
    let current: number[] = [];
    let used = 0;
    heights.forEach((h, idx) => {
      if (current.length > 0 && used + h > budgetForPage(groups.length)) {
        groups.push(current);
        current = [];
        used = 0;
      }
      current.push(idx);
      used += h;
    });
    if (current.length > 0) groups.push(current);
    setSidebarGroups((prev) => (groupsEqual(prev, groups) ? prev : groups));
  }, [sidebarBlocks, sidebarBudgetPx, sidebarContinuationReserveMm, sidebarBottomBufferMm]);

  useLayoutEffect(() => {
    void blocks;
    void mainWidthPx;
    void sidebarBlocks;
    void sidebarMeasureWidthPx;
    measure();
    measureSidebar();
    if (typeof document !== "undefined" && "fonts" in document) {
      const fonts = document.fonts as unknown as { ready: Promise<void> };
      fonts.ready
        .then(() => {
          measure();
          measureSidebar();
        })
        .catch(() => undefined);
    }
  }, [measure, measureSidebar, blocks, mainWidthPx, sidebarBlocks, sidebarMeasureWidthPx]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      measure();
      measureSidebar();
    });
    if (measureRef.current) ro.observe(measureRef.current);
    if (sidebarMeasureRef.current) ro.observe(sidebarMeasureRef.current);
    return () => ro.disconnect();
  }, [measure, measureSidebar]);

  const totalPages = Math.max(pageGroups.length, sidebarGroups.length, 1);

  const renderSidebarFor = (pageIndex: number, pageCount: number): ReactNode => {
    if (typeof sidebar === "function") {
      // Pre-wrap each sidebar atom in a flow-root div so its measured
      // height and its rendered height match (margins contained). The
      // template's renderer just slots these wrappers into the aside.
      const atomsForPage =
        sidebarGroups[pageIndex]?.map((i) => (
          <div key={`sb-${i}`} style={{ display: "flow-root" }}>
            {sidebarBlocks[i] as ReactNode}
          </div>
        )) ?? [];
      return sidebar(pageIndex, pageCount, atomsForPage);
    }
    return sidebar ?? null;
  };

  // Strict page-height mode is active when the sidebar is paginated;
  // each .resume-page is locked to the paper height with overflow hidden
  // so a dense sidebar cannot stretch the page past its nominal size.
  // Otherwise we fall back to min-height so existing single-column
  // templates render unchanged.
  const strictPageHeight = sidebarBlocks.length > 0;
  const pageHeightStyle = strictPageHeight
    ? ({ height: `${pageHeightMm}mm`, overflow: "hidden" } as const)
    : ({ minHeight: `${pageHeightMm}mm` } as const);

  return (
    <>
      {/* Hidden measurement container. Position off-screen so it doesn't
          contribute to layout but keeps layout parity with the visible pages.
          Each atom is wrapped in a `display: flow-root` div so the atom's
          vertical margins are contained inside the wrapper — that way
          `wrapper.offsetHeight` equals the atom's full margin-box height and
          the packer doesn't underestimate by the margin gaps. */}
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
        {blocks.map((block, i) => (
          // oxlint-disable-next-line jsx/no-array-index-key
          <div key={i} style={{ display: "flow-root" }}>
            {block}
          </div>
        ))}
      </div>

      {sidebarBlocks.length > 0 && (
        <div
          ref={sidebarMeasureRef}
          aria-hidden="true"
          className={pageClassName}
          style={{
            position: "absolute",
            left: -99999,
            top: 0,
            width: `${sidebarMeasureWidthPx}px`,
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          {sidebarBlocks.map((block, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <div key={i} style={{ display: "flow-root" }}>
              {block}
            </div>
          ))}
        </div>
      )}

      {Array.from({ length: totalPages }).map((_, pageIndex) => {
        const group = pageGroups[pageIndex] ?? [];
        return (
          <div className="resume-page" key={pageIndex}>
            {sidebar ? (
              <div
                className={pageClassName}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${sidebarWidthMm}mm 1fr`,
                  ...pageHeightStyle,
                }}
              >
                <aside
                  className={sidebarClassName}
                  style={{
                    background: sidebarBackground,
                    padding: `${sidebarPaddingMm[0]}mm ${sidebarPaddingMm[1]}mm`,
                    ...(strictPageHeight ? { overflow: "hidden" } : null),
                  }}
                >
                  {renderSidebarFor(pageIndex, totalPages)}
                </aside>
                <main
                  style={{
                    padding: `${topPadMm}mm ${xPadMm}mm`,
                    ...(strictPageHeight ? { overflow: "hidden" } : null),
                  }}
                >
                  {group.map((idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flow-root",
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                      }}
                    >
                      {blocks[idx]}
                    </div>
                  ))}
                </main>
              </div>
            ) : (
              <div
                className={pageClassName}
                style={{ padding: `${topPadMm}mm ${xPadMm}mm`, ...pageHeightStyle }}
              >
                {group.map((idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flow-root",
                      pageBreakInside: "avoid",
                      breakInside: "avoid",
                    }}
                  >
                    {blocks[idx]}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
