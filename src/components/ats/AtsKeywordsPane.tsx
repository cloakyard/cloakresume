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
  for (const p of resume.projects)
    parts.push(p.name, p.description, ...(p.roles ?? []), ...p.stack);
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
      <section className="max-w-[540px] border-t border-(--brand-200) bg-(--brand-50) p-4 sm:p-5">
        <h3 className="m-0 mb-1.5 text-[15px] font-semibold text-(--ink-1)">
          Add a target job description
        </h3>
        <p className="m-0 mb-3 text-sm leading-[1.5] text-(--ink-3)">
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
      </section>
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
      <div
        role="progressbar"
        aria-label="Keyword coverage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(matchPct)}
        className="mb-3 h-1.5 overflow-hidden bg-(--line-soft) sm:mb-4"
      >
        <div
          className="h-full origin-left transition-transform duration-220"
          style={{ transform: `scaleX(${matchPct / 100})`, background: toneColor(matchPct) }}
        />
      </div>
      <div className="grid grid-cols-2 border-t border-(--line) sm:grid-cols-3 min-[900px]:grid-cols-4">
        {report.keywords.matched.map((k) => {
          const count = countKeywordHits(resume, k);
          return (
            <div
              key={`m-${k}`}
              className="flex min-w-0 items-center gap-1.5 border-b border-r border-(--line) px-2 py-2.5"
            >
              <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-(--ok)" />
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-(--ink-1)">
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
            className="flex min-w-0 items-center gap-1.5 border-b border-r border-(--line) px-2 py-2.5"
          >
            <X aria-hidden="true" className="h-4 w-4 shrink-0 text-(--danger)" />
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-(--ink-4) line-through decoration-(--danger-border)">
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
