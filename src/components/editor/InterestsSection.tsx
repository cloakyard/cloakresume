/** Interests & Tools: two header labels + two comma-separated lists. */

import { CsvField, TextField } from "../fields.tsx";
import { type SectionProps, usePatch } from "./shared.tsx";

export function InterestsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);

  return (
    <div className="cr-stack">
      <TextField
        label="Interests — header label (optional)"
        value={resume.interestsLabel ?? ""}
        placeholder="Interests"
        onChange={(v) => patch("interestsLabel", v)}
      />
      <CsvField
        label="Interests (comma-separated)"
        value={resume.interests}
        onChange={(v) => patch("interests", v)}
      />
      <TextField
        label="Tools — header label (optional)"
        value={resume.toolsLabel ?? ""}
        placeholder="Tools"
        onChange={(v) => patch("toolsLabel", v)}
      />
      <CsvField
        label="Tools (comma-separated)"
        value={resume.tools}
        onChange={(v) => patch("tools", v)}
      />
    </div>
  );
}
