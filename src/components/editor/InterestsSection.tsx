/** Interests & Tools: two header labels + two comma-separated lists. */

import { TextField } from "../fields.tsx";
import { usePatch, type SectionProps } from "./shared.tsx";

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
      <TextField
        label="Interests (comma-separated)"
        value={resume.interests.join(", ")}
        onChange={(v) =>
          patch(
            "interests",
            v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
      <TextField
        label="Tools — header label (optional)"
        value={resume.toolsLabel ?? ""}
        placeholder="Tools"
        onChange={(v) => patch("toolsLabel", v)}
      />
      <TextField
        label="Tools (comma-separated)"
        value={resume.tools.join(", ")}
        onChange={(v) =>
          patch(
            "tools",
            v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
    </div>
  );
}
