/**
 * Parse tab — renders a plaintext approximation of how an ATS would "see"
 * the résumé. Helps users reason about what Workday-style parsers extract.
 */

import type { ResumeData } from "../../types.ts";
import { plainText } from "../../utils/richText.tsx";
import { Card, CardHead } from "./AtsCard.tsx";

function pad(s: string, width: number): string {
  return s + " ".repeat(Math.max(0, width - s.length));
}

interface AtsParsePreviewProps {
  resume: ResumeData;
}

export function AtsParsePreview({ resume }: AtsParsePreviewProps) {
  const LABEL_WIDTH = 10;

  const lines: string[] = [];
  lines.push(`${pad("NAME:", LABEL_WIDTH)}${resume.profile.name || "(no name)"}`);
  lines.push(`${pad("TITLE:", LABEL_WIDTH)}${resume.profile.title || "(no title)"}`);
  for (const contact of resume.contact) {
    lines.push(`${pad(`${contact.kind.toUpperCase()}:`, LABEL_WIDTH)}${contact.value}`);
  }
  lines.push("");

  if (resume.profile.summary.trim()) {
    lines.push("[PROFESSIONAL SUMMARY]", plainText(resume.profile.summary), "");
  }
  if (resume.quickStats.length) {
    lines.push(
      "[QUICK STATS]",
      ...resume.quickStats.map((stat) => `  ${stat.value} ${stat.label}`),
      "",
    );
  }

  if (resume.experience.length > 0) {
    lines.push("[EXPERIENCE]");
    for (const e of resume.experience) {
      const dates = [e.start, e.end].filter(Boolean).join("–");
      const loc = e.location ? ` · ${e.location}` : "";
      lines.push(`  · ${e.title} — ${e.company}${loc} (${dates})`);
      lines.push(
        ...e.bullets.filter((bullet) => bullet.trim()).map((bullet) => `    ${plainText(bullet)}`),
      );
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
      if (ed.location) lines.push(`    ${ed.location}`);
      if (ed.detail) lines.push(`    ${plainText(ed.detail)}`);
    }
    lines.push("");
  }

  if (resume.projects.length > 0) {
    lines.push("[PROJECTS]");
    for (const p of resume.projects) {
      const stack = p.stack.length ? ` [${p.stack.join(", ")}]` : "";
      lines.push(`  · ${p.name}${stack}`);
      if (p.description) lines.push(`    ${plainText(p.description)}`);
      lines.push(
        ...(p.roles ?? []).filter((role) => role.trim()).map((role) => `    ${plainText(role)}`),
      );
    }
    lines.push("");
  }

  if (resume.certifications.length > 0) {
    lines.push("[CERTIFICATIONS]");
    for (const c of resume.certifications) {
      lines.push(`  · ${c.name} — ${c.issuer} (${c.year})`);
      if (c.url) lines.push(`    ${c.url}`);
    }
    lines.push("");
  }

  if (resume.awards.length) {
    lines.push("[AWARDS]");
    for (const award of resume.awards) {
      lines.push(`  · ${award.title} (${award.year})`);
      if (award.detail) lines.push(`    ${plainText(award.detail)}`);
    }
    lines.push("");
  }
  if (resume.languages.length) {
    lines.push(
      "[LANGUAGES]",
      ...resume.languages.map((language) => `  ${language.name}: ${language.level}`),
      "",
    );
  }
  if (resume.interests.length)
    lines.push(
      `[${(resume.interestsLabel || "Interests").toUpperCase()}]`,
      resume.interests.join(", "),
      "",
    );
  if (resume.tools.length)
    lines.push(`[${(resume.toolsLabel || "Tools").toUpperCase()}]`, resume.tools.join(", "), "");
  if (resume.extras.length)
    lines.push(
      "[ADDITIONAL DETAILS]",
      ...resume.extras.map((extra) => `  ${extra.label}: ${extra.value}`),
      "",
    );
  for (const section of resume.custom) {
    lines.push(`[${section.header || "Custom section"}]`, ...section.bullets.map(plainText), "");
  }

  return (
    <Card boxed>
      <CardHead
        title="Document text preview"
        sub="Local approximation · actual ATS results may differ"
      />
      <pre className="font-mono text-[11px] text-(--ink-2) leading-[1.65] whitespace-pre-wrap break-words m-0 p-0 sm:text-[12.5px]">
        {lines.join("\n")}
      </pre>
    </Card>
  );
}
