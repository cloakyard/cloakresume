/** The arc is report data; its labelled score stays readable at enlarged text. */
import { clamp } from "../../utils/colors.ts";

export function AtsScoreRing({ score, color }: { score: number | null; color: string }) {
  const value = score === null ? null : clamp(score, 0, 100);
  const circumference = 2 * Math.PI * 29;
  return (
    <div className="resume-score-ring">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="none" stroke="var(--air-line)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (value ?? 0) / 100)}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div>
        <span className="resume-score-value">{value ?? "—"}</span>
        <span className="resume-review-meta">/100</span>
      </div>
    </div>
  );
}
