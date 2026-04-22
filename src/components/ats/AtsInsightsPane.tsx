/**
 * Insights tab — merges wins (positive signals) and issues (regressions)
 * into a single ordered feed. Metadata helpers (`winMeta`, `issueTitle`,
 * `issueIcon`) translate raw report strings into a friendlier label + icon.
 */

import { AlertTriangle, BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";
import type { AtsReport } from "../../types.ts";

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
  return message;
}

function issueIcon(message: string): "alert" | "chart" {
  const m = message.toLowerCase();
  if (m.includes("metric") || m.includes("quantif") || m.includes("measurable")) return "chart";
  return "alert";
}

interface AtsInsightsPaneProps {
  report: AtsReport;
}

export function AtsInsightsPane({ report }: AtsInsightsPaneProps) {
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
      <div className="bg-(--brand-50) border border-(--brand-200) rounded-[12px] p-4">
        <h4 className="m-0 mb-1.5 text-[15px] font-semibold text-(--ink-1)">No insights yet</h4>
        <p className="m-0 text-[13px] leading-[1.5] text-(--ink-3)">
          Add résumé content to get personalised wins and suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      {items.map((it) => (
        <InsightCard key={it.key} tone={it.tone} icon={it.icon} title={it.title} body={it.body} />
      ))}
    </div>
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
    ok: "bg-(--ok-bg) text-(--ok)",
    warn: "bg-(--warn-bg) text-(--warn)",
    err: "bg-(--danger-bg) text-(--danger)",
  };

  return (
    <div className="flex gap-2.5 p-2.5 sm:gap-3 sm:p-3.5 rounded-[10px] bg-(--surface) border border-(--line-soft) items-start">
      <div
        className={`w-7 h-7 rounded-[8px] shrink-0 grid place-items-center mt-px ${iconColors[tone]}`}
      >
        <IconComp className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h5 className="m-0 mb-0.5 text-[13px] font-semibold text-(--ink-1) tracking-[-0.005em] sm:text-[13.5px]">
          {title}
        </h5>
        {body && (
          <p className="m-0 text-[12.5px] text-(--ink-3) leading-[1.5] sm:text-[13px] sm:leading-[1.55]">
            {body}
          </p>
        )}
      </div>
    </div>
  );
}
