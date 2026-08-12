/**
 * ATS review modal — bottom sheet on mobile, centred modal on tablet+.
 *
 * This file is intentionally thin: it owns the surrounding chrome
 * (backdrop, drag-to-dismiss handle, header, hero strip, tab strip) and
 * routes to one of four self-contained panes in `./ats/`. Each pane
 * manages its own data derivation so changes to one tab don't ripple
 * across the others.
 */

import { AlertTriangle, FileText, Hash, LayoutGrid, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { AtsReport, ResumeData } from "../types.ts";
import { scoreBand } from "../utils/ats.ts";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";
import { AtsInsightsPane } from "./ats/AtsInsightsPane.tsx";
import { AtsKeywordsPane } from "./ats/AtsKeywordsPane.tsx";
import { AtsOverviewPane } from "./ats/AtsOverviewPane.tsx";
import { AtsParsePreview } from "./ats/AtsParsePreview.tsx";
import { AtsScoreRing } from "./ats/AtsScoreRing.tsx";

interface AtsReviewModalProps {
  open: boolean;
  onClose: () => void;
  report: AtsReport;
  resume: ResumeData;
  hasJobDescription: boolean;
  onOpenJdEditor: () => void;
  /** True while the Harper worker is linting the current résumé. */
  grammarScanning: boolean;
  /** True after Harper's WASM has been downloaded and instantiated. */
  engineReady: boolean;
  /** 0…1 progress of the Harper WASM download (only meaningful before `engineReady`). */
  engineProgress: number;
  /** Re-runs the grammar pass and restarts the local spinner. */
  onRescan: () => void;
  /** Tap-to-fix: jump the editor to the field a grammar finding came from. */
  onJumpToField?: (segmentId: string) => void;
}

type TabId = "overview" | "keywords" | "insights" | "parse";
const TAB_ORDER: TabId[] = ["overview", "keywords", "insights", "parse"];
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const PERCENT_FORMATTER = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

function formatTimestamp(d: Date): string {
  return TIMESTAMP_FORMATTER.format(d).toLocaleUpperCase();
}

export function AtsReviewModal({
  open,
  onClose,
  report,
  resume,
  hasJobDescription,
  onOpenJdEditor,
  grammarScanning,
  engineReady,
  engineProgress,
  onRescan,
  onJumpToField,
}: AtsReviewModalProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const [scannedAt, setScannedAt] = useState<Date | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const tabAnchorRef = useRef<HTMLSpanElement>(null);
  const tabPanelScrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    overview: null,
    keywords: null,
    insights: null,
    parse: null,
  });
  const titleId = useId();
  const summaryId = useId();
  const scanningStatusId = useId();
  const tabSetId = useId();
  const presence = useAnimatedPresence(open);
  const sheetRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose,
    initialFocusRef: closeRef,
  });
  const swipeHandlers = useSwipeToDismiss(sheetRef, onClose);

  const selectTab = useCallback((nextTab: TabId) => {
    setTab(nextTab);
    if (tabPanelScrollRef.current) tabPanelScrollRef.current.scrollTop = 0;

    if (window.matchMedia("(max-width: 39.9375rem)").matches) {
      const resultsScroller = resultsScrollRef.current;
      const tabAnchor = tabAnchorRef.current;
      if (resultsScroller && tabAnchor) resultsScroller.scrollTop = tabAnchor.offsetTop;
    }
  }, []);

  // Keep the "Scanning locally…" hero visible for a brief minimum so the
  // UI doesn't flash on fast scans, but always wait for grammar before
  // showing the real scorecard so the Writing dimension is populated.
  useEffect(() => {
    if (!open) return;
    setMinDelayPassed(false);
    setTab("overview");
    if (resultsScrollRef.current) resultsScrollRef.current.scrollTop = 0;
    if (tabPanelScrollRef.current) tabPanelScrollRef.current.scrollTop = 0;
    setScannedAt(new Date());
    const t = window.setTimeout(() => setMinDelayPassed(true), 900);
    return () => window.clearTimeout(t);
  }, [open]);

  const scanning = !minDelayPassed || grammarScanning;

  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent, currentTab: TabId) => {
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      let nextIndex: number | null = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % TAB_ORDER.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = TAB_ORDER.length - 1;
      }

      if (nextIndex == null) return;
      event.preventDefault();
      const nextTab = TAB_ORDER[nextIndex];
      selectTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    },
    [selectTab],
  );

  const atsBand = useMemo(() => scoreBand(report.atsScore), [report.atsScore]);
  const writingBand = useMemo(() => scoreBand(report.writingScore), [report.writingScore]);
  // Match the "Top fixes" list below — every entry in report.issues is a
  // surfaced fix (any severity), so the header should count the same set.
  const issueCount = report.issues.length;
  const kwTotal = report.keywords.matched.length + report.keywords.missing.length;
  const downloadingEngine = !engineReady && engineProgress > 0;
  const boundedEngineProgress = Math.min(1, Math.max(0, engineProgress));
  const progressPct = Math.round(boundedEngineProgress * 100);
  const progressLabel = PERCENT_FORMATTER.format(boundedEngineProgress);
  const timestamp = scannedAt ? formatTimestamp(scannedAt) : "";
  const timestampIso = scannedAt?.toISOString() ?? "";

  if (!presence.mounted) return null;

  return (
    <div
      className="cr-overlay fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6 print:hidden"
      data-state={presence.state}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="cr-dialog cr-dialog-wide cr-sheet relative flex h-[var(--sheet-max-block-size)] w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] min-[640px]:h-[min(51.25rem,var(--dialog-max-block-size))] min-[640px]:!w-[min(var(--dialog-wide-max),calc(100vw-3rem))] min-[640px]:pb-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={scanning ? scanningStatusId : summaryId}
        tabIndex={-1}
      >
        <div
          {...swipeHandlers}
          className="grid place-items-center pt-2 pb-1 cursor-grab touch-none sm:hidden"
        >
          <span aria-hidden="true" className="w-10 h-1 rounded-full bg-(--ink-6)" />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 border-b border-(--line-soft) shrink-0 sm:px-6 sm:py-3 sm:border-(--line)">
          <div className="flex items-baseline gap-2">
            <h2
              id={titleId}
              className="m-0 text-[15px] font-semibold leading-none tracking-[-0.005em] text-(--ink-1)"
            >
              Résumé review
            </h2>
            <span
              aria-hidden="true"
              className="hidden sm:inline-block w-1 h-1 rounded-full bg-(--ink-6) -translate-y-0.5"
            />
            <time
              dateTime={timestampIso}
              className="hidden sm:inline font-mono text-[10.5px] leading-none text-(--ink-5) tracking-[0.03em]"
            >
              {timestamp}
            </time>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close ATS review"
            className="grid h-11 w-11 place-items-center rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-160 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {scanning ? (
          <div
            id={scanningStatusId}
            className="flex-1 grid place-items-center p-10"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-busy="true"
          >
            <div className="text-center">
              <div
                aria-hidden="true"
                className="w-16 h-16 rounded-full border-[3px] border-(--line) border-t-(--brand) animate-spin mx-auto mb-5 sm:w-20 sm:h-20"
              />
              <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-(--ink-1) mb-1.5 sm:text-[20px]">
                {downloadingEngine ? (
                  <>
                    Downloading writing engine{" "}
                    <span className="font-bold text-(--brand)">locally</span>…
                  </>
                ) : (
                  <>
                    Analysing résumé <span className="font-bold text-(--brand)">locally</span>…
                  </>
                )}
              </h3>
              <div className="mx-auto max-w-[400px] text-sm leading-normal text-(--ink-4)">
                {downloadingEngine
                  ? "Grammar check runs entirely in your browser. The ~7 MB WASM engine downloads once, then caches for every future scan."
                  : "Checking keywords, structure, parseability, and writing quality. Nothing leaves your browser."}
              </div>
              {downloadingEngine && (
                <div className="mt-5 mx-auto max-w-[320px]">
                  <div
                    className="h-1.5 bg-(--line-soft) rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label="Writing engine download"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPct}
                    aria-valuetext={progressLabel}
                  >
                    <div
                      className="h-full origin-left bg-(--color-accent)"
                      style={{ transform: `scaleX(${progressPct / 100})` }}
                    />
                  </div>
                  <div className="mt-1.5 font-mono text-[10.5px] text-(--ink-5) tabular-nums text-right tracking-[0.02em]">
                    {progressLabel}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            ref={resultsScrollRef}
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain cr-scroll min-[640px]:overflow-hidden"
          >
            <header className="flex flex-col gap-3 px-4 pt-3 pb-3 shrink-0 border-b border-(--line) sm:gap-5 sm:px-6 sm:py-5 min-[900px]:px-9 min-[900px]:py-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3
                    id={summaryId}
                    className="text-[18px] font-bold tracking-[-0.025em] leading-[1.2] text-(--ink-1) m-0 sm:text-[22px] sm:mb-0.5 min-[900px]:text-[26px]"
                  >
                    Résumé scored{" "}
                    <span className="font-extrabold" style={{ color: atsBand.color }}>
                      {atsBand.label.toLowerCase()}
                    </span>
                    {report.writingReady && (
                      <>
                        {" "}
                        on ATS,{" "}
                        <span className="font-extrabold" style={{ color: writingBand.color }}>
                          {writingBand.label.toLowerCase()}
                        </span>{" "}
                        on writing
                      </>
                    )}
                    .
                  </h3>
                  <p className="m-0 text-sm leading-[1.5] text-(--ink-3)">
                    {report.atsScore >= 85
                      ? "Passes Workday, Greenhouse, and Lever."
                      : report.atsScore >= 55
                        ? "Parses reliably — a few tweaks will push it into the green."
                        : "Fundamentals need work before most ATS pipelines will rank this well."}{" "}
                    {issueCount > 0 ? (
                      <>
                        Fix{" "}
                        <strong className="text-(--ink-1) font-semibold">
                          {issueCount} issue{issueCount === 1 ? "" : "s"}
                        </strong>{" "}
                        to lift both scores.
                      </>
                    ) : (
                      <>No blocking issues detected.</>
                    )}
                  </p>
                  <div className="flex gap-1.5 mt-2 sm:mt-2 sm:gap-2">
                    <button
                      type="button"
                      className="tb primary"
                      onClick={() => {
                        setMinDelayPassed(false);
                        window.setTimeout(() => setMinDelayPassed(true), 900);
                        onRescan();
                      }}
                      aria-label="Re-scan"
                    >
                      <RefreshCw aria-hidden="true" className="w-3.5 h-3.5" />
                      <span>Re-scan</span>
                    </button>
                  </div>
                </div>
                <ScoreDuo
                  atsScore={report.atsScore}
                  atsBand={atsBand}
                  writingScore={report.writingScore}
                  writingBand={writingBand}
                  writingReady={report.writingReady}
                />
              </div>
            </header>

            <span ref={tabAnchorRef} aria-hidden="true" className="block h-0 shrink-0" />
            <div
              className="sticky top-0 z-10 mx-3 my-2 flex shrink-0 items-stretch rounded-(--radius-card) border border-(--line) bg-(--surface-raised) p-0.5 sm:static sm:mx-0 sm:my-0 sm:rounded-none sm:border-0 sm:border-y sm:border-(--line) sm:bg-transparent sm:px-4 sm:p-0 min-[900px]:px-9"
              role="tablist"
              aria-label="ATS review sections"
            >
              <TabButton
                id={`${tabSetId}-tab-overview`}
                panelId={`${tabSetId}-panel-overview`}
                buttonRef={(element) => {
                  tabRefs.current.overview = element;
                }}
                active={tab === "overview"}
                onClick={() => selectTab("overview")}
                onKeyDown={(event) => onTabKeyDown(event, "overview")}
                icon={<LayoutGrid aria-hidden="true" className="w-4 h-4" />}
                label="Overview"
              />
              <TabButton
                id={`${tabSetId}-tab-keywords`}
                panelId={`${tabSetId}-panel-keywords`}
                buttonRef={(element) => {
                  tabRefs.current.keywords = element;
                }}
                active={tab === "keywords"}
                onClick={() => selectTab("keywords")}
                onKeyDown={(event) => onTabKeyDown(event, "keywords")}
                icon={<Hash aria-hidden="true" className="w-4 h-4" />}
                label="Keywords"
                count={
                  hasJobDescription && kwTotal > 0
                    ? `${report.keywords.matched.length}/${kwTotal}`
                    : undefined
                }
              />
              <TabButton
                id={`${tabSetId}-tab-insights`}
                panelId={`${tabSetId}-panel-insights`}
                buttonRef={(element) => {
                  tabRefs.current.insights = element;
                }}
                active={tab === "insights"}
                onClick={() => selectTab("insights")}
                onKeyDown={(event) => onTabKeyDown(event, "insights")}
                icon={<AlertTriangle aria-hidden="true" className="w-4 h-4" />}
                label="Insights"
                count={
                  report.wins.length + report.issues.length > 0
                    ? String(report.wins.length + report.issues.length)
                    : undefined
                }
              />
              <TabButton
                id={`${tabSetId}-tab-parse`}
                panelId={`${tabSetId}-panel-parse`}
                buttonRef={(element) => {
                  tabRefs.current.parse = element;
                }}
                active={tab === "parse"}
                onClick={() => selectTab("parse")}
                onKeyDown={(event) => onTabKeyDown(event, "parse")}
                icon={<FileText aria-hidden="true" className="w-4 h-4" />}
                label="Parse"
              />
            </div>

            <div
              ref={tabPanelScrollRef}
              className="shrink-0 overflow-visible px-3 py-3 min-[640px]:min-h-0 min-[640px]:flex-1 min-[640px]:shrink min-[640px]:overflow-y-auto min-[640px]:overflow-x-hidden min-[640px]:overscroll-contain min-[640px]:cr-scroll sm:px-6 sm:py-5 sm:[scrollbar-gutter:stable] min-[900px]:px-9 min-[900px]:py-6"
            >
              <div
                id={`${tabSetId}-panel-overview`}
                role="tabpanel"
                aria-labelledby={`${tabSetId}-tab-overview`}
                tabIndex={tab === "overview" ? 0 : -1}
                hidden={tab !== "overview"}
              >
                {tab === "overview" ? (
                  <AtsOverviewPane report={report} hasJobDescription={hasJobDescription} />
                ) : null}
              </div>
              <div
                id={`${tabSetId}-panel-keywords`}
                role="tabpanel"
                aria-labelledby={`${tabSetId}-tab-keywords`}
                tabIndex={tab === "keywords" ? 0 : -1}
                hidden={tab !== "keywords"}
              >
                {tab === "keywords" ? (
                  <AtsKeywordsPane
                    report={report}
                    resume={resume}
                    hasJobDescription={hasJobDescription}
                    onOpenJdEditor={onOpenJdEditor}
                  />
                ) : null}
              </div>
              <div
                id={`${tabSetId}-panel-insights`}
                role="tabpanel"
                aria-labelledby={`${tabSetId}-tab-insights`}
                tabIndex={tab === "insights" ? 0 : -1}
                hidden={tab !== "insights"}
              >
                {tab === "insights" ? (
                  <AtsInsightsPane report={report} onJumpToField={onJumpToField} />
                ) : null}
              </div>
              <div
                id={`${tabSetId}-panel-parse`}
                role="tabpanel"
                aria-labelledby={`${tabSetId}-tab-parse`}
                tabIndex={tab === "parse" ? 0 : -1}
                hidden={tab !== "parse"}
              >
                {tab === "parse" ? <AtsParsePreview resume={resume} /> : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Band = { label: string; color: string; bg: string; border: string };

/**
 * Pair of score rings rendered as a single unified card. Combining them
 * reads as one scorecard with two metrics rather than two floating widgets,
 * and lets the rings share consistent padding + a hairline divider.
 */
function ScoreDuo({
  atsScore,
  atsBand,
  writingScore,
  writingBand,
  writingReady,
}: {
  atsScore: number;
  atsBand: Band;
  writingScore: number;
  writingBand: Band;
  writingReady: boolean;
}) {
  return (
    <div className="self-stretch w-full flex items-stretch rounded-lg border border-(--line) bg-(--surface-raised) overflow-hidden sm:shrink-0 sm:self-start sm:w-auto sm:inline-flex">
      <ScoreCell label="ATS" score={atsScore} band={atsBand} />
      <div aria-hidden="true" className="w-px bg-(--line-soft)" />
      <ScoreCell label="Writing" score={writingScore} band={writingBand} muted={!writingReady} />
    </div>
  );
}

function ScoreCell({
  label,
  score,
  band,
  muted = false,
}: {
  label: string;
  score: number;
  band: Band;
  muted?: boolean;
}) {
  const displayColor = muted ? "var(--ink-5)" : band.color;
  return (
    <div className="flex-1 basis-0 flex flex-col items-center gap-1.5 px-3 py-3 sm:flex-none sm:min-w-[112px] sm:px-4 sm:py-3.5 sm:gap-2 min-[900px]:min-w-[120px] min-[900px]:py-4">
      <span className="font-mono text-[9.5px] font-semibold text-(--ink-5) tracking-[0.1em] uppercase leading-none">
        {label}
      </span>
      <AtsScoreRing score={muted ? 0 : score} color={displayColor} size={64} />
      <span
        className="font-mono text-[9px] font-bold tracking-[0.08em] px-2 py-0.5 rounded-full border uppercase leading-none sm:text-[9.5px] sm:px-2.5"
        style={
          muted
            ? { color: "var(--ink-4)", background: "var(--surface-2)", borderColor: "var(--line)" }
            : { color: band.color, background: band.bg, borderColor: band.border }
        }
      >
        {muted ? "Pending" : band.label}
      </span>
    </div>
  );
}

function TabButton({
  id,
  panelId,
  buttonRef,
  active,
  onClick,
  onKeyDown,
  icon,
  label,
  count,
}: {
  id: string;
  panelId: string;
  buttonRef: (element: HTMLButtonElement | null) => void;
  active: boolean;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  label: string;
  count?: string;
}) {
  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      className={[
        "flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 text-[10px] font-medium rounded-md cursor-pointer transition-[background-color,border-color,color] duration-160 min-h-11",
        "sm:flex-none sm:flex-row sm:gap-1.5 sm:py-3 sm:px-3 sm:text-[13px] sm:rounded-none sm:border-b-2 sm:-mb-px",
        active
          ? "bg-(--surface) text-(--brand) sm:bg-transparent sm:border-b-(--brand)"
          : "text-(--ink-4) hover:text-(--ink-1) hover:bg-(--surface) sm:border-b-transparent sm:hover:bg-transparent",
      ].join(" ")}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {icon}
      {label}
      {count != null && (
        <span
          className={[
            "hidden sm:inline font-mono text-[10.5px] font-medium px-1.5 py-px rounded-md border tracking-[0.02em]",
            active
              ? "text-(--brand) bg-(--brand-50) border-(--brand-200)"
              : "text-(--ink-5) bg-(--surface-2) border-(--line)",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}
