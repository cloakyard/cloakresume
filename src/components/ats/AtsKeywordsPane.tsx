/**
 * Keywords tab — side-by-side matched / missing keywords against the target
 * job description. Counts occurrences in the same flattened text used by the ATS report.
 */

import { ArrowRight, Check, X } from "lucide-react";
import type { AtsReport, ResumeData } from "../../types.ts";
import { Card, CardHead } from "./AtsCard.tsx";
import { flattenResumeText } from "../../utils/ats.ts";
import { toneColor } from "./atsShared.ts";

function countKeywordHits(haystack: string, keyword: string): number {
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
      <section className="resume-review-guidance">
        <h3 className="resume-review-fix-title">Add a target job description</h3>
        <p className="resume-review-description">
          Paste the JD for the role you're targeting and CloakResume will show which of its keywords
          appear in your résumé — and which are missing.
        </p>
        <button type="button" className="air-button air-button--primary" onClick={onOpenJdEditor}>
          Open JD editor <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </section>
    );
  }

  const haystack = flattenResumeText(resume);
  const total = report.keywords.matched.length + report.keywords.missing.length;
  const matchPct = total === 0 ? 0 : (report.keywords.matched.length / total) * 100;

  return (
    <Card>
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
        className="air-file-progress"
      >
        <span style={{ transform: `scaleX(${matchPct / 100})`, background: toneColor(matchPct) }} />
      </div>
      {total === 0 && (
        <p className="resume-review-description">
          No reviewable keywords were found in this job description.
        </p>
      )}
      <ul className="resume-review-keywords">
        {report.keywords.matched.map((k) => (
          <li key={`m-${k}`}>
            <Check
              aria-hidden="true"
              size={18}
              strokeWidth={1.6}
              className="resume-review-success"
            />
            <span className="sr-only">Matched: </span>
            <span className="resume-review-keyword">{k}</span>
            <span className="resume-review-meta">×{countKeywordHits(haystack, k)}</span>
          </li>
        ))}
        {report.keywords.missing.map((k) => (
          <li key={`x-${k}`}>
            <X aria-hidden="true" size={18} strokeWidth={1.6} className="resume-review-missing" />
            <span className="resume-review-keyword">{k}</span>
            <span className="resume-review-meta">Absent</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
