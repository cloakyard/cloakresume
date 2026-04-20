/** Skills: groups of related skills as comma-separated lists. */

import { Sparkles } from "lucide-react";
import { TextField } from "../fields.tsx";
import { LogoPicker } from "../LogoPicker.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  SubCardHead,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function SkillsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addGroup = () =>
    patch("skills", [...resume.skills, { id: newId("s"), label: "", items: "" }]);

  if (resume.skills.length === 0) {
    return (
      <EmptyState
        sectionLabel="skills"
        icon={<Sparkles className="w-5 h-5" strokeWidth={2} />}
        heading="No skills yet"
        description="Group related skills (e.g. Cloud, Languages) to help recruiters scan quickly."
        buttonLabel="Add a group"
        onAdd={addGroup}
      />
    );
  }

  return (
    <>
      <DragList items={resume.skills} onReorder={(next) => patch("skills", next)}>
        {resume.skills.map((g, i) => (
          <DragItem
            key={g.id}
            index={i}
            onDelete={() =>
              patch(
                "skills",
                resume.skills.filter((_, j) => j !== i),
              )
            }
          >
            {(handle, _deleteBtn) => (
              <div className="sub-card mb-2.5">
                <SubCardHead
                  index={i}
                  prefix="Group"
                  drag={handle}
                  onDelete={() =>
                    patch(
                      "skills",
                      resume.skills.filter((_, j) => j !== i),
                    )
                  }
                />
                <div className="cr-stack">
                  <TextField
                    label="Group name"
                    placeholder="e.g. Cloud Platforms"
                    value={g.label}
                    onChange={(v) => {
                      const next = [...resume.skills];
                      next[i] = { ...g, label: v };
                      patch("skills", next);
                    }}
                  />
                  <div>
                    <span className="cr-field-label">Icon (optional)</span>
                    <LogoPicker
                      value={g.iconName}
                      onChange={(name) => {
                        const next = [...resume.skills];
                        next[i] = { ...g, iconName: name };
                        patch("skills", next);
                      }}
                    />
                  </div>
                  <label className="cr-field">
                    <span className="cr-field-label">Skills (comma-separated)</span>
                    <textarea
                      value={g.items}
                      rows={4}
                      placeholder="AWS, Google Cloud, Azure…"
                      onChange={(e) => {
                        const next = [...resume.skills];
                        next[i] = { ...g, items: e.target.value };
                        patch("skills", next);
                      }}
                      className="cr-input resize-y"
                    />
                  </label>
                </div>
              </div>
            )}
          </DragItem>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addGroup}>Add group</AddButton>
      </div>
    </>
  );
}
