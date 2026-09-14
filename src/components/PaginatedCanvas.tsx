/**
 * Paper-sized pages shared by every template. Normal atoms pack together;
 * long paragraphs, bullets and grids split at measured text-line boundaries.
 * Both columns paginate independently with measured continuation headers.
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
import { paginateMeasured, pageFragmentsEqual, type PageFragment } from "../utils/pagination.ts";
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
   * fit below the header. Its actual rendered height is also measured,
   * so long names/titles can increase this reserve.
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

function renderFragment(fragment: PageFragment, blocks: ReactNode[], key: string): ReactNode {
  return fragment.html === undefined ? (
    <div
      key={key}
      data-pagination-atom
      data-pagination-source-index={fragment.index}
      style={{ display: "flow-root" }}
    >
      {blocks[fragment.index]}
    </div>
  ) : (
    <div
      key={key}
      data-pagination-atom
      data-pagination-fragment
      data-pagination-source-index={fragment.index}
      style={{ display: "flow-root" }}
      dangerouslySetInnerHTML={{ __html: fragment.html }}
    />
  );
}

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
  const continuationMeasureRef = useRef<HTMLDivElement>(null);
  const [pageGroups, setPageGroups] = useState<PageFragment[][]>([[]]);
  const [sidebarGroups, setSidebarGroups] = useState<PageFragment[][]>([]);
  const pageGroupsRef = useRef(pageGroups);
  const sidebarGroupsRef = useRef(sidebarGroups);

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
    const groups = paginateMeasured(
      container,
      (pageIndex) => budgetPx - (pageIndex ? 6 * PX_PER_MM : 0) - 2,
    );
    if (!pageFragmentsEqual(pageGroupsRef.current, groups)) {
      pageGroupsRef.current = groups;
      setPageGroups(groups);
    }
  }, [budgetPx]);

  const measureSidebar = useCallback(() => {
    const container = sidebarMeasureRef.current;
    if (!container || sidebarBlocks.length === 0) {
      if (sidebarGroupsRef.current.length) {
        sidebarGroupsRef.current = [];
        setSidebarGroups([]);
      }
      return;
    }
    const continuation = Math.max(
      sidebarContinuationReserveMm * PX_PER_MM,
      continuationMeasureRef.current?.offsetHeight ?? 0,
    );
    const groups = paginateMeasured(
      container,
      (pageIndex) =>
        sidebarBudgetPx - sidebarBottomBufferMm * PX_PER_MM - (pageIndex ? continuation : 0) - 2,
    );
    if (!pageFragmentsEqual(sidebarGroupsRef.current, groups)) {
      sidebarGroupsRef.current = groups;
      setSidebarGroups(groups);
    }
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
    if (continuationMeasureRef.current) ro.observe(continuationMeasureRef.current);
    return () => ro.disconnect();
  }, [measure, measureSidebar]);

  const totalPages = Math.max(pageGroups.length, sidebarGroups.length, 1);

  const renderSidebarFor = (pageIndex: number, pageCount: number): ReactNode => {
    if (typeof sidebar === "function") {
      const atomsForPage =
        sidebarGroups[pageIndex]?.map((fragment, i) =>
          renderFragment(fragment, sidebarBlocks, `sb-${fragment.index}-${i}`),
        ) ?? [];
      return sidebar(pageIndex, pageCount, atomsForPage);
    }
    return sidebar ?? null;
  };

  const renderMainFor = (pageIndex: number, group: PageFragment[]) => (
    <>
      {pageIndex > 0 && !group[0]?.hasHeading && group[0]?.contextLabel && (
        <div
          data-pagination-continuation-label
          style={{
            height: "6mm",
            fontSize: "7.5pt",
            lineHeight: 1.3,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {group[0].contextLabel.length > 48
            ? `${group[0].contextLabel.slice(0, 45)}…`
            : group[0].contextLabel}{" "}
          · continued
        </div>
      )}
      {group.map((fragment, i) => renderFragment(fragment, blocks, `${fragment.index}-${i}`))}
    </>
  );

  // Every template uses exact paper dimensions. Content is actually split
  // into semantic fragments; no overflow rule is used to hide a bad break.
  const pageHeightStyle = { height: `${pageHeightMm}mm`, boxSizing: "border-box" } as const;

  return (
    <>
      <style>{`.resume-root li[data-pagination-continuation] { list-style-type: none; } .resume-root li[data-pagination-continuation]::before { display: none; }`}</style>
      {/* Hidden measurement container. Position off-screen so it doesn't
          contribute to layout but keeps layout parity with the visible pages.
          Each atom is wrapped in a `display: flow-root` div so the atom's
          vertical margins are contained inside the wrapper — that way
          `wrapper.offsetHeight` equals the atom's full margin-box height and
          the packer doesn't underestimate by the margin gaps. */}
      <div
        ref={measureRef}
        data-pagination-measure="main"
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
          <div key={i} data-pagination-atom style={{ display: "flow-root" }}>
            {block}
          </div>
        ))}
      </div>

      {typeof sidebar === "function" && sidebarBlocks.length > 0 && (
        <div
          ref={continuationMeasureRef}
          aria-hidden="true"
          className={`${pageClassName ?? ""} ${sidebarClassName ?? ""}`}
          style={{
            position: "absolute",
            left: -99999,
            top: 0,
            width: sidebarMeasureWidthPx,
            visibility: "hidden",
            display: "flow-root",
            pointerEvents: "none",
          }}
        >
          {sidebar(1, 2, [<div key="measurement-sentinel" />])}
        </div>
      )}
      {sidebarBlocks.length > 0 && (
        <div
          ref={sidebarMeasureRef}
          data-pagination-measure="sidebar"
          aria-hidden="true"
          className={`${pageClassName ?? ""} ${sidebarClassName ?? ""}`}
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
            <div key={i} data-pagination-atom style={{ display: "flow-root" }}>
              {block}
            </div>
          ))}
        </div>
      )}

      {Array.from({ length: totalPages }).map((_, pageIndex) => {
        const group = pageGroups[pageIndex] ?? [];
        return (
          <div
            className="resume-page"
            key={pageIndex}
            data-paper-size={paperSize}
            style={pageHeightStyle}
          >
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
                    minWidth: 0,
                  }}
                >
                  {renderSidebarFor(pageIndex, totalPages)}
                </aside>
                <main
                  style={{
                    padding: `${topPadMm}mm ${xPadMm}mm`,
                    minWidth: 0,
                  }}
                >
                  {renderMainFor(pageIndex, group)}
                </main>
              </div>
            ) : (
              <div
                className={pageClassName}
                style={{ padding: `${topPadMm}mm ${xPadMm}mm`, ...pageHeightStyle }}
              >
                {renderMainFor(pageIndex, group)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
