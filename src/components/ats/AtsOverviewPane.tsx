/**
 * Overview tab of the résumé review modal.
 *
 * Renders two scorecards side-by-side (stacked on mobile): one for ATS
 * parseability dimensions, one for writing-polish dimensions. A top-3
 * fix list sits alongside them. The two scorecards are intentionally
 * separate so the ATS dimensions can't be dragged down by writing
 * findings (which is what recruiters / ATS pipelines care about).
 */

import { ShieldCheck } from "lucide-react";
import type { AtsReport } from "../../types.ts";
import { Card, CardHead } from "./AtsCard.tsx";
import { pct, toneColor } from "./atsShared.ts";

interface Dimension {
  label: string;
  percent: number;
  caption: string;
  tone: string;
}

function buildAtsDimensions(report: AtsReport, hasJd: boolean): Dimension[] {
  const find = (cat: string) => report.atsBreakdown.find((b) => b.category === cat);
  const summary = find("Professional summary");
  const bullets = find("Experience bullets");
  const impact = find("Quantifiable impact");
  const contact = find("Contact details");
  const edu = find("Education");
  const skills = find("Skills coverage");
  const projects = find("Projects");
  const length = find("Overall length");
  const keyword = find("Keyword match");

  const contentEarned = (summary?.earned ?? 0) + (bullets?.earned ?? 0) + (length?.earned ?? 0);
  const contentMax = (summary?.max ?? 0) + (bullets?.max ?? 0) + (length?.max ?? 0);
  const formatEarned =
    (contact?.earned ?? 0) + (edu?.earned ?? 0) + (skills?.earned ?? 0) + (projects?.earned ?? 0);
  const formatMax =
    (contact?.max ?? 0) + (edu?.max ?? 0) + (skills?.max ?? 0) + (projects?.max ?? 0);

  const contentPct = pct(contentEarned, contentMax);
  const formatPct = pct(formatEarned, formatMax);
  const impactPct = pct(impact?.earned ?? 0, impact?.max ?? 0);
  const keywordPct = hasJd ? pct(keyword?.earned ?? 0, keyword?.max ?? 0) : 0;

  return [
    {
      label: "Content quality",
      percent: contentPct,
      caption: bullets?.note ?? summary?.note ?? "",
      tone: toneColor(contentPct),
    },
    {
      label: "Formatting",
      percent: formatPct,
      caption: contact?.earned === contact?.max ? "Clean structure" : (contact?.note ?? ""),
      tone: toneColor(formatPct),
    },
    {
      label: "Keyword coverage",
      percent: keywordPct,
      caption: hasJd ? (keyword?.note ?? "") : "Add a job description",
      tone: hasJd ? toneColor(keywordPct) : "var(--air-ink-secondary)",
    },
    {
      label: "Impact & metrics",
      percent: impactPct,
      caption: impact?.note ?? "",
      tone: toneColor(impactPct),
    },
  ];
}

function buildWritingDimensions(report: AtsReport): Dimension[] {
  return report.writingBreakdown.map((b) => {
    const p = pct(b.earned, b.max);
    return { label: b.category, percent: p, caption: b.note, tone: toneColor(p) };
  });
}

interface AtsOverviewPaneProps {
  report: AtsReport;
  hasJobDescription: boolean;
  grammarError?: string | null;
}

export function AtsOverviewPane({ report, hasJobDescription, grammarError }: AtsOverviewPaneProps) {
  const atsDimensions = buildAtsDimensions(report, hasJobDescription);
  const writingDimensions = buildWritingDimensions(report);
  const topFixes = report.issues.slice(0, 3);
  const hasFixes = topFixes.length > 0;
  return (
    <div className="resume-review-groups">
      <div className="resume-review-scorecards">
        <Card>
          <CardHead title="ATS scorecard" sub={`${atsDimensions.length} dimensions`} />
          <DimensionList dimensions={atsDimensions} />
        </Card>

        <Card>
          <CardHead
            title="Writing scorecard"
            sub={
              report.writingReady
                ? `${writingDimensions.length} dimensions`
                : grammarError
                  ? "scan unavailable"
                  : report.grammar
                    ? `${report.grammar.wordsChecked} words checked`
                    : "waiting for scan…"
            }
          />
          {report.writingReady ? (
            <DimensionList dimensions={writingDimensions} />
          ) : (
            <div className="resume-review-description">
              {grammarError
                ? "Choose Re-scan to retry the writing review."
                : report.grammar
                  ? "Scan complete. Add at least 20 words of summary, bullets, or other prose to receive a writing score."
                  : "Writing analysis hasn't completed yet. Once the scan finishes, spelling, grammar, style, and readability each get their own score."}
            </div>
          )}
        </Card>
      </div>

      {hasFixes && (
        <Card>
          <CardHead
            title="Top fixes"
            sub={`${topFixes.length} change${topFixes.length === 1 ? "" : "s"}`}
          />
          <ol className="resume-review-fixes">
            {topFixes.map((issue, i) => {
              return (
                <li key={issue.message} className="resume-review-fix">
                  <span className="resume-review-meta">{i + 1}.</span>
                  <div className="resume-review-fix-copy">
                    <div className="resume-review-fix-title">{issue.message}</div>
                    {issue.suggestion && (
                      <div className="resume-review-description">{issue.suggestion}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {!hasFixes && (
        <div className="resume-review-empty">
          <ShieldCheck
            aria-hidden="true"
            size={20}
            strokeWidth={1.6}
            className="resume-review-success"
          />
          <div>
            <div className="resume-review-fix-title">All clear</div>
            <div className="resume-review-description">
              No blocking issues detected — your résumé is in great shape.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DimensionList({ dimensions }: { dimensions: Dimension[] }) {
  return (
    <div className="resume-review-dimensions">
      {dimensions.map((d) => (
        <div key={d.label} className="resume-review-dimension">
          <div className="resume-review-dimension-heading">
            <span>{d.label}</span>
            <span className="resume-review-number" style={{ color: d.tone }}>
              {d.percent}
              <span className="resume-review-meta"> /100</span>
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={d.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={d.percent}
            className="air-file-progress"
          >
            <span style={{ transform: `scaleX(${d.percent / 100})`, background: d.tone }} />
          </div>
          <p className="resume-review-meta">{d.caption}</p>
        </div>
      ))}
    </div>
  );
}
