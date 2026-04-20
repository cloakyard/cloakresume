/** Awards: title + year + optional detail. */

import { Award } from "lucide-react";
import { TextField } from "../fields.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  SubCardHead,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function AwardsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addAward = () =>
    patch("awards", [...resume.awards, { id: newId("a"), title: "", year: "", detail: "" }]);

  if (resume.awards.length === 0) {
    return (
      <EmptyState
        sectionLabel="awards"
        icon={<Award className="w-5 h-5" strokeWidth={2} />}
        heading="No awards yet"
        description="Add honours and recognitions that highlight standout moments in your career."
        buttonLabel="Add an award"
        onAdd={addAward}
      />
    );
  }

  return (
    <>
      <DragList items={resume.awards} onReorder={(next) => patch("awards", next)}>
        {resume.awards.map((a, i) => (
          <DragItem
            key={a.id}
            index={i}
            onDelete={() =>
              patch(
                "awards",
                resume.awards.filter((_, j) => j !== i),
              )
            }
          >
            {(handle, _deleteBtn) => (
              <div className="sub-card mb-2.5">
                <SubCardHead
                  index={i}
                  prefix="Award"
                  drag={handle}
                  onDelete={() =>
                    patch(
                      "awards",
                      resume.awards.filter((_, j) => j !== i),
                    )
                  }
                />
                <div className="cr-stack">
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <TextField
                      label="Title"
                      value={a.title}
                      onChange={(v) => {
                        const next = [...resume.awards];
                        next[i] = { ...a, title: v };
                        patch("awards", next);
                      }}
                    />
                    <TextField
                      label="Year"
                      value={a.year}
                      onChange={(v) => {
                        const next = [...resume.awards];
                        next[i] = { ...a, year: v };
                        patch("awards", next);
                      }}
                    />
                  </div>
                  <TextField
                    label="Detail (optional)"
                    value={a.detail}
                    onChange={(v) => {
                      const next = [...resume.awards];
                      next[i] = { ...a, detail: v };
                      patch("awards", next);
                    }}
                  />
                </div>
              </div>
            )}
          </DragItem>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addAward}>Add award</AddButton>
      </div>
    </>
  );
}
