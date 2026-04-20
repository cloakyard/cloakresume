/**
 * Parse tab — renders a plaintext approximation of how an ATS would "see"
 * the résumé. Helps users reason about what Workday-style parsers extract.
 */

import type { ResumeData } from "../../types.ts";
import { Card, CardHead } from "./AtsCard.tsx";

function pad(s: string, width: number): string {
  return s + " ".repeat(Math.max(0, width - s.length));
}

interface AtsParsePreviewProps {
  resume: ResumeData;
}

export function AtsParsePreview({ resume }: AtsParsePreviewProps) {
  const email = resume.contact.find((c) => c.kind === "email")?.value ?? "—";
  const location = resume.contact.find((c) => c.kind === "location")?.value ?? "—";
  const phone = resume.contact.find((c) => c.kind === "phone")?.value ?? "";
  const LABEL_WIDTH = 10;

  const lines: string[] = [];
  lines.push(`${pad("NAME:", LABEL_WIDTH)}${resume.profile.name || "(no name)"}`);
  lines.push(`${pad("TITLE:", LABEL_WIDTH)}${resume.profile.title || "(no title)"}`);
  lines.push(`${pad("EMAIL:", LABEL_WIDTH)}${email}`);
  if (phone) lines.push(`${pad("PHONE:", LABEL_WIDTH)}${phone}`);
  lines.push(`${pad("LOCATION:", LABEL_WIDTH)}${location}`);
  lines.push("");

  if (resume.experience.length > 0) {
    lines.push("[EXPERIENCE]");
    for (const e of resume.experience) {
      const dates = [e.start, e.end].filter(Boolean).join("–");
      const loc = e.location ? ` · ${e.location}` : "";
      lines.push(`  · ${e.title} — ${e.company}${loc} (${dates})`);
    }
    lines.push("");
  }

  if (resume.skills.length > 0) {
    lines.push("[SKILLS]");
    for (const s of resume.skills) {
      lines.push(`  ${s.label}: ${s.items}`);
    }
    lines.push("");
  }

  if (resume.education.length > 0) {
    lines.push("[EDUCATION]");
    for (const ed of resume.education) {
      const dates = [ed.start, ed.end].filter(Boolean).join("–");
      lines.push(`  · ${ed.degree} — ${ed.school} (${dates})`);
    }
    lines.push("");
  }

  if (resume.projects.length > 0) {
    lines.push("[PROJECTS]");
    for (const p of resume.projects) {
      const stack = p.stack.length ? ` [${p.stack.join(", ")}]` : "";
      lines.push(`  · ${p.name}${stack}`);
    }
    lines.push("");
  }

  if (resume.certifications.length > 0) {
    lines.push("[CERTIFICATIONS]");
    for (const c of resume.certifications) {
      lines.push(`  · ${c.name} — ${c.issuer} (${c.year})`);
    }
    lines.push("");
  }

  return (
    <Card>
      <CardHead title="Raw ATS parse" sub={'How Workday "sees" your résumé'} />
      <pre className="font-mono text-[11px] text-(--ink-2) leading-[1.65] whitespace-pre-wrap break-words m-0 p-0 sm:text-[12.5px]">
        {lines.join("\n")}
      </pre>
    </Card>
  );
}
