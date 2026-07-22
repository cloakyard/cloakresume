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
      <section className="border-t border-(--brand-200) bg-(--brand-50) p-4">
        <h3 className="m-0 mb-1.5 text-[15px] font-semibold text-(--ink-1)">No insights yet</h3>
        <p className="m-0 text-sm leading-[1.5] text-(--ink-3)">
          Add résumé content to get personalised wins and suggestions.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col border-t border-(--line)">
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

const KIND_TONE: Record<GrammarIssueKind, { bg: string; fg: string; border: string }> = {
  spelling: { bg: "bg-(--danger-bg)", fg: "text-(--danger)", border: "border-(--danger-border)" },
  grammar: { bg: "bg-(--warn-bg)", fg: "text-(--warn)", border: "border-(--warn-border)" },
  style: { bg: "bg-(--brand-50)", fg: "text-(--brand)", border: "border-(--brand-200)" },
  readability: { bg: "bg-(--brand-50)", fg: "text-(--brand)", border: "border-(--brand-200)" },
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
    <section className="mt-4 overflow-hidden border-t border-(--line)">
      <div className="flex items-center gap-2 border-b border-(--line-soft) bg-(--surface-2) px-3 py-2.5">
        <PencilLine aria-hidden="true" className="h-3.5 w-3.5 text-(--ink-4)" />
        <h3 className="m-0 text-sm font-semibold text-(--ink-1)">Writing details</h3>
        <span className="ml-auto font-mono text-[10.5px] text-(--ink-5) tracking-[0.02em]">
          {issues.length} finding{issues.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="divide-y divide-(--line-soft)">
        {keyed.map(({ key, issue }) => (
          <WritingDetailRow key={key} issue={issue} onJumpToField={onJumpToField} />
        ))}
      </ul>
      {overflow > 0 && (
        <div className="border-t border-(--line-soft) bg-(--surface-2) px-3 py-2 text-center text-xs text-(--ink-5)">
          +{overflow} more — fix the ones above and re-scan.
        </div>
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
  const tone = KIND_TONE[issue.kind];
  const preview = issue.actual.length > 72 ? `${issue.actual.slice(0, 72)}…` : issue.actual;
  const interactive = Boolean(onJumpToField);
  const content = (
    <>
      <span
        className={`shrink-0 inline-flex items-center h-5 px-1.5 rounded-md border font-mono text-[9.5px] font-semibold tracking-[0.04em] uppercase ${tone.bg} ${tone.fg} ${tone.border}`}
      >
        {KIND_LABEL[issue.kind]}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-sm leading-snug text-(--ink-1)">
          <mark className="bg-(--warn-bg) text-(--ink-1) px-1 rounded">{preview}</mark>
          {issue.suggestions.length > 0 && (
            <span className="text-(--ink-3)">
              {" "}
              → {issue.suggestions.map((s) => `"${s}"`).join(", ")}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-(--ink-4)">{issue.segmentLabel}</div>
      </div>
      {interactive && (
        <ArrowUpRight aria-hidden="true" className="shrink-0 w-3.5 h-3.5 text-(--ink-5) mt-0.5" />
      )}
    </>
  );
  return (
    <li>
      {interactive ? (
        <button
          type="button"
          onClick={() => onJumpToField?.(issue.segmentId)}
          className="flex min-h-11 w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-(--surface-2) focus-visible:outline-none focus-visible:bg-(--surface-2) focus-visible:shadow-(--sh-focus)"
          aria-label={`Jump to ${issue.segmentLabel}`}
        >
          {content}
        </button>
      ) : (
        <div className="flex items-start gap-2.5 px-3 py-2.5">{content}</div>
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
    ok: "text-(--ok)",
    warn: "text-(--warn)",
    err: "text-(--danger)",
  };

  return (
    <article className="flex items-start gap-3 border-b border-(--line-soft) px-1 py-3.5">
      <IconComp aria-hidden="true" className={`mt-px h-5 w-5 shrink-0 ${iconColors[tone]}`} />
      <div className="min-w-0 flex-1">
        <h3 className="m-0 mb-0.5 text-sm font-semibold tracking-[-0.005em] text-(--ink-1)">
          {title}
        </h3>
        {body && <p className="m-0 text-sm leading-[1.55] text-(--ink-3)">{body}</p>}
      </div>
    </article>
  );
}
