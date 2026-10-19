/** Experience: roles with bullets. */

import { Briefcase } from "lucide-react";
import { useRef } from "react";
import { TextField } from "../fields.tsx";
import { FormatScope } from "../FormatScope.tsx";
import { BulletList } from "./BulletList.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import { MonthYearField } from "../MonthYearField.tsx";
import {
  AddButton,
  EmptyState,
  EntryHeading,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

function isCurrentJob(end: string) {
  return /^present$/i.test(end.trim());
}

export function ExperienceSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const previousEndDates = useRef(new Map<string, string>());
  const addRole = () =>
    patch("experience", [
      ...resume.experience,
      {
        id: newId("e"),
        title: "",
        company: "",
        location: "",
        start: "",
        end: "",
        bullets: [""],
      },
    ]);

  if (resume.experience.length === 0) {
    return (
      <EmptyState
        sectionLabel="experience"
        icon={<Briefcase className="w-5 h-5" strokeWidth={2} />}
        heading="No experience yet"
        description="Add your first role to populate the preview. You can always reorder or edit later."
        buttonLabel="Add a role"
        onAdd={addRole}
      />
    );
  }

  return (
    <>
      <DragList items={resume.experience} onReorder={(next) => patch("experience", next)}>
        {resume.experience.map((job, i) => (
          <FormatScope key={job.id}>
            <DragItem
              index={i}
              label={`role ${i + 1}`}
              onDelete={() =>
                patch(
                  "experience",
                  resume.experience.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn, moveBtns) => (
                <div className="resume-entry">
                  <EntryHeading
                    index={i}
                    prefix="Role"
                    drag={handle}
                    moveBtns={moveBtns}
                    deleteButton={deleteBtn}
                  />
                  <div className="cr-stack">
                    <div className="resume-field-pair">
                      <TextField
                        label="Job title"
                        value={job.title}
                        onChange={(v) => {
                          const next = [...resume.experience];
                          next[i] = { ...job, title: v };
                          patch("experience", next);
                        }}
                      />
                      <TextField
                        label="Company"
                        value={job.company}
                        onChange={(v) => {
                          const next = [...resume.experience];
                          next[i] = { ...job, company: v };
                          patch("experience", next);
                        }}
                      />
                    </div>
                    <TextField
                      label="Location"
                      value={job.location}
                      onChange={(v) => {
                        const next = [...resume.experience];
                        next[i] = { ...job, location: v };
                        patch("experience", next);
                      }}
                    />
                    <div className="resume-field-pair">
                      <MonthYearField
                        label="Start"
                        value={job.start}
                        onChange={(v) => {
                          const next = [...resume.experience];
                          next[i] = { ...job, start: v };
                          patch("experience", next);
                        }}
                      />
                      <MonthYearField
                        label="End"
                        disabled={isCurrentJob(job.end)}
                        value={job.end}
                        onChange={(v) => {
                          const next = [...resume.experience];
                          next[i] = { ...job, end: v };
                          patch("experience", next);
                        }}
                      />
                    </div>
                    <label className="air-check-label">
                      <input
                        type="checkbox"
                        name={`experience-${job.id}-current`}
                        checked={isCurrentJob(job.end)}
                        onChange={(event) => {
                          const current = event.target.checked;
                          if (current) previousEndDates.current.set(job.id, job.end);
                          const next = [...resume.experience];
                          next[i] = {
                            ...job,
                            end: current ? "Present" : (previousEndDates.current.get(job.id) ?? ""),
                          };
                          patch("experience", next);
                        }}
                        className="air-check"
                      />
                      Current job
                    </label>
                    <BulletList
                      values={job.bullets}
                      itemLabel={`role ${i + 1}`}
                      ariaLabel="Experience bullet"
                      fieldPrefix={`experience.${i}.bullets`}
                      onChange={(bullets) => {
                        const next = [...resume.experience];
                        next[i] = { ...job, bullets };
                        patch("experience", next);
                      }}
                    />
                  </div>
                </div>
              )}
            </DragItem>
          </FormatScope>
        ))}
      </DragList>
      <AddButton onClick={addRole}>Add role</AddButton>
    </>
  );
}
