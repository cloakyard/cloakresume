/** Local report, honest engine progress and the four review panes. */
import { RefreshCw } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AtsReport, ResumeData } from "../types.ts";
import { scoreBand } from "../utils/ats.ts";
import { AtsInsightsPane } from "./ats/AtsInsightsPane.tsx";
import { AtsKeywordsPane } from "./ats/AtsKeywordsPane.tsx";
import { AtsOverviewPane } from "./ats/AtsOverviewPane.tsx";
import { AtsParsePreview } from "./ats/AtsParsePreview.tsx";
import { AtsScoreRing } from "./ats/AtsScoreRing.tsx";

interface Props {
  report: AtsReport;
  resume: ResumeData;
  hasJobDescription: boolean;
  onOpenJdEditor: () => void;
  grammarScanning: boolean;
  grammarError: string | null;
  engineReady: boolean;
  /** Null means the download total is unknown; 1 means bytes are received. */
  engineProgress: number | null;
  scannedAt: number | null;
  onRescan: () => void;
  onJumpToField: (segmentId: string) => void;
}
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "keywords", label: "Keywords" },
  { id: "insights", label: "Insights" },
  { id: "parse", label: "Parse" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const PERCENT_FORMATTER = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

export function AtsReviewContent({
  report,
  resume,
  hasJobDescription,
  onOpenJdEditor,
  grammarScanning,
  grammarError,
  engineReady,
  engineProgress,
  scannedAt,
  onRescan,
  onJumpToField,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabAnchorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const id = useId();
  const atsBand = scoreBand(report.atsScore);
  const writingBand = scoreBand(report.writingScore);
  const issueCount = report.issues.length;
  const kwTotal = report.keywords.matched.length + report.keywords.missing.length;
  const downloading = !engineReady && engineProgress !== 1;
  const progress =
    downloading && engineProgress !== null ? Math.max(0, Math.min(1, engineProgress)) : null;
  const status = grammarScanning
    ? engineReady
      ? "Reviewing writing…"
      : downloading
        ? "Loading writing engine…"
        : "Preparing writing engine…"
    : grammarError
      ? "Writing review unavailable"
      : "Review complete";

  function revealTab() {
    const scroll = scrollRef.current;
    const anchor = tabAnchorRef.current;
    if (scroll && anchor)
      scroll.scrollTop += anchor.getBoundingClientRect().top - scroll.getBoundingClientRect().top;
  }
  useLayoutEffect(() => {
    if (tabRefs.current[tab] === document.activeElement) revealTab();
  }, [tab]);
  function selectTab(next: TabId) {
    if (next === tab) revealTab();
    else setTab(next);
  }
  function onTabKeyDown(event: KeyboardEvent, current: TabId) {
    const index = TABS.findIndex((t) => t.id === current);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % TABS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index + TABS.length - 1) % TABS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = TABS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus({ preventScroll: true });
  }
  return (
    <div ref={scrollRef} className="resume-review-body">
      <p className="resume-review-description">
        Feedback stays on your device. Scores are guidance; actual hiring-system results may differ.
      </p>
      <div className="resume-review-toolbar">
        <div>
          <p role="status" aria-atomic="true">
            {status}
          </p>
          {scannedAt !== null && (
            <p className="resume-review-meta">
              Reviewed{" "}
              <time dateTime={new Date(scannedAt).toISOString()}>
                {TIMESTAMP_FORMATTER.format(scannedAt)}
              </time>
            </p>
          )}
        </div>
        <button
          type="button"
          className="air-button"
          aria-disabled={grammarScanning}
          aria-busy={grammarScanning}
          aria-label={grammarScanning ? "Scanning résumé" : "Re-scan"}
          onClick={(event) => {
            if (grammarScanning) return;
            event.currentTarget.focus();
            onRescan();
          }}
        >
          <RefreshCw size={18} strokeWidth={1.6} aria-hidden="true" />
          <span className="air-action-labels" aria-hidden="true">
            <span data-active={!grammarScanning || undefined}>Re-scan</span>
            <span data-active={grammarScanning || undefined}>Scanning…</span>
          </span>
        </button>
      </div>
      {grammarScanning ? (
        <div className="resume-review-progress" aria-busy="true">
          <p>
            {engineReady
              ? "Checking spelling, grammar, style and readability."
              : "Language assets may download when needed. Your résumé and job description stay in this browser."}
          </p>
          <div
            className="air-file-progress"
            role="progressbar"
            aria-label={downloading ? "Writing engine download" : "Writing review"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress === null ? undefined : Math.round(progress * 100)}
            aria-valuetext={progress === null ? undefined : PERCENT_FORMATTER.format(progress)}
          >
            {progress !== null && <span style={{ transform: `scaleX(${progress})` }} />}
          </div>
          {progress !== null && (
            <p className="resume-review-meta">{PERCENT_FORMATTER.format(progress)} downloaded</p>
          )}
          <p className="resume-review-meta">
            You can close this review and keep editing while it finishes.
          </p>
        </div>
      ) : (
        <>
          {grammarError && (
            <p role="alert" className="air-help air-help--error">
              {grammarError}
            </p>
          )}
          <header className="resume-review-summary">
            <div>
              <h3>
                Résumé scored{" "}
                <span style={{ color: atsBand.color }}>{atsBand.label.toLowerCase()}</span> on ATS
                {report.writingReady && (
                  <>
                    ,{" "}
                    <span style={{ color: writingBand.color }}>
                      {writingBand.label.toLowerCase()}
                    </span>{" "}
                    on writing
                  </>
                )}
                .
              </h3>
              <p>
                {report.atsScore >= 85
                  ? "The résumé has clear structure for automated parsing."
                  : report.atsScore >= 55
                    ? "Review the suggestions to improve structure and coverage."
                    : "Review the fundamentals of structure, content and coverage."}{" "}
                {issueCount > 0 ? (
                  <>
                    {issueCount} issue{issueCount === 1 ? "" : "s"} to review.
                  </>
                ) : (
                  "No blocking issues detected."
                )}
              </p>
            </div>
            <div className="resume-review-scores">
              <Score label="ATS" value={report.atsScore} band={atsBand} />
              <Score
                label="Writing"
                value={report.writingReady ? report.writingScore : null}
                band={writingBand}
                pending={grammarError ? "Unavailable" : report.grammar ? "Add text" : "Pending"}
              />
            </div>
          </header>
          <div ref={tabAnchorRef} className="resume-review-tabs-anchor">
            <div
              className="air-segments resume-review-tabs"
              role="tablist"
              aria-label="ATS review sections"
            >
              {TABS.map(({ id: key, label }) => {
                const count =
                  key === "keywords" && hasJobDescription && kwTotal > 0
                    ? `${report.keywords.matched.length}/${kwTotal}`
                    : key === "insights" && report.wins.length + issueCount > 0
                      ? String(report.wins.length + issueCount)
                      : null;
                return (
                  <button
                    key={key}
                    ref={(el) => {
                      tabRefs.current[key] = el;
                    }}
                    type="button"
                    id={`${id}-tab-${key}`}
                    role="tab"
                    aria-controls={`${id}-panel-${key}`}
                    aria-selected={tab === key}
                    tabIndex={tab === key ? 0 : -1}
                    onClick={(event) => {
                      event.currentTarget.focus({ preventScroll: true });
                      selectTab(key);
                    }}
                    onKeyDown={(event) => onTabKeyDown(event, key)}
                  >
                    {label}
                    {count !== null && <span className="resume-review-tab-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {TABS.map(({ id: key }) => (
            <div
              key={key}
              id={`${id}-panel-${key}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${key}`}
              tabIndex={tab === key ? 0 : -1}
              hidden={tab !== key}
              className="resume-review-pane"
            >
              {tab === key &&
                (key === "overview" ? (
                  <AtsOverviewPane
                    report={report}
                    hasJobDescription={hasJobDescription}
                    grammarError={grammarError}
                  />
                ) : key === "keywords" ? (
                  <AtsKeywordsPane
                    report={report}
                    resume={resume}
                    hasJobDescription={hasJobDescription}
                    onOpenJdEditor={onOpenJdEditor}
                  />
                ) : key === "insights" ? (
                  <AtsInsightsPane report={report} onJumpToField={onJumpToField} />
                ) : (
                  <AtsParsePreview resume={resume} />
                ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Score({
  label,
  value,
  band,
  pending,
}: {
  label: string;
  value: number | null;
  band: ReturnType<typeof scoreBand>;
  pending?: string;
}) {
  return (
    <div className="resume-review-score">
      <span>{label}</span>
      <AtsScoreRing score={value} color={value === null ? "var(--air-ink-muted)" : band.color} />
      <span className="resume-review-meta">{value === null ? pending : band.label}</span>
    </div>
  );
}
