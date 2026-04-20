/** Education: degrees, schools, dates. */

import { GraduationCap } from "lucide-react";
import { TextField } from "../fields.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import { MonthYearField } from "../MonthYearField.tsx";
import {
  AddButton,
  EmptyState,
  SubCardHead,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function EducationSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addEntry = () =>
    patch("education", [
      ...resume.education,
      {
        id: newId("ed"),
        degree: "",
        school: "",
        location: "",
        start: "",
        end: "",
        detail: "",
      },
    ]);

  if (resume.education.length === 0) {
    return (
      <EmptyState
        sectionLabel="education"
        icon={<GraduationCap className="w-5 h-5" strokeWidth={2} />}
        heading="No education yet"
        description="Add your degrees and schools. Include dates and CGPA if relevant for the target role."
        buttonLabel="Add an entry"
        onAdd={addEntry}
      />
    );
  }

  return (
    <>
      <DragList items={resume.education} onReorder={(next) => patch("education", next)}>
        {resume.education.map((ed, i) => (
          <DragItem
            key={ed.id}
            index={i}
            onDelete={() =>
              patch(
                "education",
                resume.education.filter((_, j) => j !== i),
              )
            }
          >
            {(handle, _deleteBtn) => (
              <div className="sub-card mb-2.5">
                <SubCardHead
                  index={i}
                  prefix="Entry"
                  drag={handle}
                  onDelete={() =>
                    patch(
                      "education",
                      resume.education.filter((_, j) => j !== i),
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Degree"
                    value={ed.degree}
                    onChange={(v) => {
                      const next = [...resume.education];
                      next[i] = { ...ed, degree: v };
                      patch("education", next);
                    }}
                  />
                  <TextField
                    label="School"
                    value={ed.school}
                    onChange={(v) => {
                      const next = [...resume.education];
                      next[i] = { ...ed, school: v };
                      patch("education", next);
                    }}
                  />
                  <TextField
                    label="Location"
                    value={ed.location}
                    onChange={(v) => {
                      const next = [...resume.education];
                      next[i] = { ...ed, location: v };
                      patch("education", next);
                    }}
                  />
                  <TextField
                    label="Detail (CGPA)"
                    value={ed.detail}
                    onChange={(v) => {
                      const next = [...resume.education];
                      next[i] = { ...ed, detail: v };
                      patch("education", next);
                    }}
                  />
                  <MonthYearField
                    label="Start"
                    value={ed.start}
                    onChange={(v) => {
                      const next = [...resume.education];
                      next[i] = { ...ed, start: v };
                      patch("education", next);
                    }}
                  />
                  <MonthYearField
                    label="End"
                    allowPresent
                    value={ed.end}
                    onChange={(v) => {
                      const next = [...resume.education];
                      next[i] = { ...ed, end: v };
                      patch("education", next);
                    }}
                  />
                </div>
              </div>
            )}
          </DragItem>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addEntry}>Add entry</AddButton>
      </div>
    </>
  );
}
