/**
 * Insights tab — merges wins (positive signals) and issues (regressions)
 * into a single ordered feed. Metadata helpers (`winMeta`, `issueTitle`,
 * `issueIcon`) translate raw report strings into a friendlier label + icon.
 */

import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import { useId } from "react";
import type { AtsReport, GrammarIssue, GrammarIssueKind } from "../../types.ts";

type InsightIcon = "check" | "alert" | "chart" | "shield";
type InsightTone = "ok" | "warn" | "err";

function winMeta(win: string): { title: string; icon: "check" | "shield" } {
  const w = win.toLowerCase();
  if (w.includes("action verb")) return { title: "Strong action verbs", icon: "check" };
  if (w.includes("contact")) return { title: "Complete contact details", icon: "check" };
  if (w.includes("summary length")) return { title: "Healthy summary length", icon: "check" };
  if (w.includes("metric")) return { title: "Quantified impact", icon: "check" };
  if (w.includes("skills")) return { title: "Strong skills coverage", icon: "check" };
  if (w.includes("optimal") || w.includes("word range"))
    return { title: "Optimal résumé length", icon: "check" };
  if (w.includes("keyword")) return { title: "Strong keyword match", icon: "check" };
  if (w.includes("writing is clean")) return { title: "Clean writing", icon: "check" };
  if (w.includes("parse") || w.includes("ats"))
    return { title: "Parseable by ATS", icon: "shield" };
  return { title: win, icon: "check" };
}

function issueTitle(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("missing") && m.includes("contact")) return "Missing contact info";
  if (m.includes("summary is empty")) return "Add a professional summary";
  if (m.includes("summary is shorter")) return "Summary too short";
  if (m.includes("summary runs")) return "Summary too long";
  if (m.includes("too few") && m.includes("experience bullets"))
    return "Add more experience bullets";
  if (m.includes("resume body is empty")) return "Résumé body is empty";
  if (m.includes("don't start with strong action") || m.includes("strong action verbs"))
    return "Use stronger action verbs";
  if (m.includes("measurable outcomes") || m.includes("metric")) return "Add one more metric";
  if (m.includes("skills section is light")) return "Expand your skills section";
  if (m.includes("no education")) return "Add an education entry";
  if (m.includes("body is on the short")) return "Résumé body is short";
  if (m.includes("body is long") || m.includes("runs a bit long")) return "Résumé body is long";
  if (m.includes("less than half") && m.includes("keyword")) return "Keyword coverage is low";
  if (m.includes("spelling issue")) return "Possible spelling issues";
  if (m.includes("grammar finding")) return "Grammar findings";
  if (m.includes("stylistic issue") || m.includes("style")) return "Stylistic issues";
  if (m.includes("hard-to-scan")) return "Long, hard-to-scan sentences";
  return message;
}

function issueIcon(message: string): "alert" | "chart" {
  const m = message.toLowerCase();
  if (m.includes("metric") || m.includes("quantif") || m.includes("measurable")) return "chart";
  return "alert";
}

interface AtsInsightsPaneProps {
  report: AtsReport;
  /** Tap-to-fix: jump the editor to the field a grammar finding originated from. */
  onJumpToField?: (segmentId: string) => void;
}

export function AtsInsightsPane({ report, onJumpToField }: AtsInsightsPaneProps) {
  const severityRank: Record<string, number> = { fail: 0, warn: 1, info: 2 };
  const orderedIssues = [...report.issues].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
  const items: Array<{
    key: string;
    tone: InsightTone;
    icon: InsightIcon;
    title: string;
    body: string;
  }> = [
    ...report.wins.map((w, i) => {
      const meta = winMeta(w);
      return { key: `w-${i}`, tone: "ok" as const, icon: meta.icon, title: meta.title, body: w };
    }),
    ...orderedIssues.map((issue, i) => ({
      key: `i-${i}`,
      tone: (issue.severity === "fail" ? "err" : issue.severity === "warn" ? "warn" : "ok") as
        | "ok"
        | "warn"
        | "err",
      icon: issueIcon(issue.message),
      title: issueTitle(issue.message),
      body: issue.suggestion ?? issue.message,
    })),
  ];

  if (items.length === 0) {
    return (
      <section className="resume-review-guidance">
        <h3 className="resume-review-fix-title">No insights yet</h3>
        <p className="resume-review-description">
          Add résumé content to get personalised wins and suggestions.
        </p>
      </section>
    );
  }

  return (
    <div className="resume-review-insights">
      {items.map((it) => (
        <InsightCard key={it.key} tone={it.tone} icon={it.icon} title={it.title} body={it.body} />
      ))}
      {report.grammar && report.grammar.issues.length > 0 && (
        <WritingDetails issues={report.grammar.issues} onJumpToField={onJumpToField} />
      )}
    </div>
  );
}

const KIND_LABEL: Record<GrammarIssueKind, string> = {
  spelling: "Spelling",
  grammar: "Grammar",
  style: "Style",
  readability: "Long sentence",
};

/**
 * Per-word writing details. Capped at 25 entries so a typo-heavy résumé
 * doesn't turn the pane into a wall of cards — the aggregate counts in
 * the Insights feed already convey scale.
 */
function WritingDetails({
  issues,
  onJumpToField,
}: {
  issues: GrammarIssue[];
  onJumpToField?: (segmentId: string) => void;
}) {
  const capped = issues.slice(0, 25);
  const overflow = issues.length - capped.length;
  const counts = new Map<string, number>();
  const keyed = capped.map((issue) => {
    const base = `${issue.segmentId}-${issue.kind}-${issue.actual}`;
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    return { key: `${base}-${n}`, issue };
  });
  return (
    <section className="resume-review-section">
      <div className="resume-review-section-heading">
        <PencilLine aria-hidden="true" size={18} strokeWidth={1.6} />
        <h3 className="resume-review-fix-title">Writing details</h3>
        <span className="resume-review-meta">
          {issues.length} finding{issues.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="resume-review-findings">
        {keyed.map(({ key, issue }) => (
          <WritingDetailRow key={key} issue={issue} onJumpToField={onJumpToField} />
        ))}
      </ul>
      {overflow > 0 && (
        <div className="resume-review-meta">+{overflow} more — fix the ones above and re-scan.</div>
      )}
    </section>
  );
}

function WritingDetailRow({
  issue,
  onJumpToField,
}: {
  issue: GrammarIssue;
  onJumpToField?: (segmentId: string) => void;
}) {
  const detailId = useId();
  const content = (
    <>
      <span className="resume-review-kind">{KIND_LABEL[issue.kind]}</span>
      <div id={detailId} className="resume-review-finding-copy">
        <p>
          <mark>{issue.actual}</mark>
          {issue.suggestions.length > 0 && (
            <> → {issue.suggestions.map((s) => `“${s}”`).join(", ")}</>
          )}
        </p>
        <p className="resume-review-description">{issue.reason}</p>
        <p className="resume-review-meta">{issue.segmentLabel}</p>
      </div>
      {onJumpToField && <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.6} />}
    </>
  );
  return (
    <li>
      {onJumpToField ? (
        <button
          type="button"
          className="resume-review-finding"
          onClick={() => onJumpToField(issue.segmentId)}
          aria-label={`Jump to ${issue.segmentLabel}`}
          aria-describedby={detailId}
        >
          {content}
        </button>
      ) : (
        <div className="resume-review-finding">{content}</div>
      )}
    </li>
  );
}

function InsightCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: InsightTone;
  icon: InsightIcon;
  title: string;
  body: string;
}) {
  const IconComp =
    icon === "check"
      ? CheckCircle2
      : icon === "shield"
        ? ShieldCheck
        : icon === "chart"
          ? BarChart3
          : AlertTriangle;

  const iconColors: Record<InsightTone, string> = {
    ok: "resume-review-success",
    warn: "resume-review-warning",
    err: "resume-review-missing",
  };

  return (
    <article className="resume-review-insight">
      <IconComp aria-hidden="true" size={20} strokeWidth={1.6} className={iconColors[tone]} />
      <div className="resume-review-fix-copy">
        <h3 className="resume-review-fix-title">{title}</h3>
        {body && <p className="resume-review-description">{body}</p>}
      </div>
    </article>
  );
}
