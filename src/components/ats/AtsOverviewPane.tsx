/**
 * Overview tab of the ATS review modal — scorecard by dimension plus a
 * top-3 fix list. Owns the dimension derivation because only this pane
 * consumes it.
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

function buildDimensions(report: AtsReport, hasJd: boolean): Dimension[] {
  const find = (cat: string) => report.breakdown.find((b) => b.category === cat);
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
      tone: hasJd ? toneColor(keywordPct) : "var(--ink-4)",
    },
    {
      label: "Impact & metrics",
      percent: impactPct,
      caption: impact?.note ?? "",
      tone: toneColor(impactPct),
    },
  ];
}

interface AtsOverviewPaneProps {
  report: AtsReport;
  hasJobDescription: boolean;
}

export function AtsOverviewPane({ report, hasJobDescription }: AtsOverviewPaneProps) {
  const dimensions = buildDimensions(report, hasJobDescription);
  const topFixes = report.issues.slice(0, 3);
  const hasFixes = topFixes.length > 0;
  return (
    <div
      className={`flex flex-col gap-3 sm:gap-4 ${hasFixes ? "min-[900px]:grid min-[900px]:grid-cols-[1fr_1.1fr]" : ""}`}
    >
      <Card>
        <CardHead title="Scorecard" sub={`${dimensions.length} dimensions`} />
        <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-[14px_20px] min-[900px]:gap-[18px_20px]">
          {dimensions.map((d) => (
            <div
              key={d.label}
              className="flex items-start gap-2.5 py-2 border-b border-(--line-soft) last:border-0 last:pb-0.5 min-w-0 sm:flex-col sm:items-stretch sm:py-0 sm:border-0 sm:gap-0"
            >
              <div
                className="[order:-1] font-mono text-[19px] font-bold tabular-nums leading-[1.1] tracking-[-0.02em] min-w-[44px] shrink-0 text-right sm:text-[24px] sm:min-w-0 sm:text-left sm:mb-px min-[900px]:text-[26px]"
                style={{ color: d.tone }}
              >
                {d.percent}
                <small className="font-mono text-[9px] text-(--ink-5) font-normal ml-px sm:text-[11px]">
                  /100
                </small>
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-[12px] font-medium text-(--ink-2) mb-1 sm:text-[11.5px] sm:text-(--ink-3)">
                  {d.label}
                </div>
                <div className="h-0.5 bg-(--line-soft) rounded-full overflow-hidden sm:h-[3px]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${d.percent}%`, background: d.tone }}
                  />
                </div>
                <div className="font-mono text-[9.5px] text-(--ink-5) mt-0.5 tracking-[0.01em] leading-[1.35] line-clamp-2 sm:text-[10.5px]">
                  {d.caption}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {hasFixes && (
        <Card>
          <CardHead
            title="Top fixes"
            sub={`${topFixes.length} change${topFixes.length === 1 ? "" : "s"} · ~${Math.max(1, topFixes.length)} min`}
          />
          <div className="flex flex-col gap-2">
            {topFixes.map((issue, i) => {
              const tone =
                issue.severity === "fail" ? "err" : issue.severity === "warn" ? "warn" : "info";
              return (
                <div
                  key={issue.message}
                  className="flex gap-2.5 p-2.5 border border-(--line) rounded-lg bg-(--surface-2) items-start sm:flex-nowrap sm:gap-3 sm:p-3"
                >
                  <div
                    className={[
                      "w-[26px] h-[26px] rounded-md shrink-0 grid place-items-center font-mono text-[10px] font-bold border sm:w-[30px] sm:h-[30px]",
                      tone === "err"
                        ? "bg-(--danger-bg) text-(--danger) border-(--danger-border)"
                        : tone === "warn"
                          ? "bg-(--warn-bg) text-(--warn) border-(--warn-border)"
                          : "bg-(--brand-50) text-(--brand) border-(--brand-200)",
                    ].join(" ")}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-(--ink-1) mb-0.5 leading-[1.35]">
                      {issue.message}
                    </div>
                    {issue.suggestion && (
                      <div className="text-[12px] text-(--ink-4) leading-[1.45]">
                        {issue.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {!hasFixes && (
        <div className="flex items-center gap-2.5 p-3 sm:p-4 bg-(--ok-bg) border border-(--ok-border) rounded-xl">
          <ShieldCheck className="w-5 h-5 shrink-0 text-(--ok)" />
          <div>
            <div className="text-[14px] font-semibold text-(--ink-1)">All clear</div>
            <div className="text-[12.5px] text-(--ink-3) leading-[1.5] mt-px">
              No blocking issues detected — your résumé is in great shape.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
