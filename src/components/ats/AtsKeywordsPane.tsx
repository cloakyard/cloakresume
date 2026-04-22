/**
 * Keywords tab — side-by-side matched / missing keywords against the target
 * job description. Owns its own resume-flattening utility since keyword
 * counting is the only place that needs it.
 */

import { Check, X } from "lucide-react";
import type { AtsReport, ResumeData } from "../../types.ts";
import { Card, CardHead } from "./AtsCard.tsx";
import { toneColor } from "./atsShared.ts";

function flattenResume(resume: ResumeData): string {
  const parts: string[] = [resume.profile.name, resume.profile.title, resume.profile.summary];
  for (const c of resume.contact) parts.push(c.value);
  for (const s of resume.skills) parts.push(s.label, s.items);
  for (const e of resume.experience) {
    parts.push(e.title, e.company, e.location, e.start, e.end, ...e.bullets);
  }
  for (const ed of resume.education) {
    parts.push(ed.degree, ed.school, ed.location, ed.detail);
  }
  for (const p of resume.projects) parts.push(p.name, p.description, p.role ?? "", ...p.stack);
  for (const ct of resume.certifications) parts.push(ct.issuer, ct.name);
  for (const a of resume.awards) parts.push(a.title, a.detail);
  for (const l of resume.languages) parts.push(l.name, l.level);
  parts.push(...resume.interests, ...resume.tools);
  return parts.join(" ");
}

function countKeywordHits(resume: ResumeData, keyword: string): number {
  const haystack = flattenResume(resume).toLowerCase();
  const needle = keyword.toLowerCase();
  if (!needle) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

interface AtsKeywordsPaneProps {
  report: AtsReport;
  resume: ResumeData;
  hasJobDescription: boolean;
  onOpenJdEditor: () => void;
}

export function AtsKeywordsPane({
  report,
  resume,
  hasJobDescription,
  onOpenJdEditor,
}: AtsKeywordsPaneProps) {
  if (!hasJobDescription) {
    return (
      <div className="bg-(--brand-50) border border-(--brand-200) rounded-xl p-4 sm:p-5 sm:max-w-[540px]">
        <h4 className="m-0 mb-1.5 text-[15px] font-semibold text-(--ink-1)">
          Add a target job description
        </h4>
        <p className="m-0 mb-3 text-[13px] leading-[1.5] text-(--ink-3)">
          Paste the JD for the role you're targeting and CloakResume will show which of its keywords
          appear in your résumé — and which are missing.
        </p>
        <button
          type="button"
          className="tb primary"
          onClick={onOpenJdEditor}
          style={{ fontWeight: 600 }}
        >
          Open JD editor →
        </button>
      </div>
    );
  }

  const total = report.keywords.matched.length + report.keywords.missing.length;
  const matchPct = total === 0 ? 0 : (report.keywords.matched.length / total) * 100;

  return (
    <Card boxed>
      <CardHead
        title="Keyword coverage"
        sub={`${report.keywords.matched.length} of ${total} matched from target JD`}
      />
      <div className="h-1.5 bg-(--line-soft) rounded-full overflow-hidden mb-3 sm:mb-4">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${matchPct}%`, background: toneColor(matchPct) }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 min-[900px]:grid-cols-4">
        {report.keywords.matched.map((k) => {
          const count = countKeywordHits(resume, k);
          return (
            <div
              key={`m-${k}`}
              className="flex items-center gap-1.5 p-1.5 sm:p-2 border border-(--line) rounded-lg bg-(--surface) min-w-0"
            >
              <span className="w-[18px] h-[18px] rounded-md grid place-items-center shrink-0 bg-(--ok-bg) text-(--ok)">
                <Check className="w-3 h-3" />
              </span>
              <span className="flex-1 min-w-0 text-[12px] font-medium text-(--ink-1) whitespace-nowrap overflow-hidden text-ellipsis">
                {k}
              </span>
              <span className="font-mono text-[10px] text-(--ink-5) font-medium shrink-0">
                ×{count || 1}
              </span>
            </div>
          );
        })}
        {report.keywords.missing.map((k) => (
          <div
            key={`x-${k}`}
            className="flex items-center gap-1.5 p-1.5 sm:p-2 border border-(--line) rounded-lg bg-(--surface) min-w-0"
          >
            <span className="w-[18px] h-[18px] rounded-md grid place-items-center shrink-0 bg-(--danger-bg) text-(--danger)">
              <X className="w-3 h-3" />
            </span>
            <span className="flex-1 min-w-0 text-[12px] font-medium text-(--ink-4) line-through decoration-(--danger-border) whitespace-nowrap overflow-hidden text-ellipsis">
              {k}
            </span>
            <span className="font-mono text-[10px] text-(--ink-5) font-medium shrink-0">
              absent
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
