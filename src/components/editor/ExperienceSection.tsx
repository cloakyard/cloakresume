/** Experience: roles with bullets. */

import { Briefcase, Plus } from "lucide-react";
import { useRef } from "react";
import { TextField } from "../fields.tsx";
import { RichTextArea } from "../RichTextArea.tsx";
import { FormatScope, FormatToolbar } from "../FormatScope.tsx";
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
              onDelete={() =>
                patch(
                  "experience",
                  resume.experience.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, _deleteBtn, moveBtns) => (
                <div className="sub-card mb-2.5">
                  <SubCardHead
                    index={i}
                    prefix="Role"
                    drag={handle}
                    moveBtns={moveBtns}
                    onDelete={() =>
                      patch(
                        "experience",
                        resume.experience.filter((_, j) => j !== i),
                      )
                    }
                  />
                  <div className="cr-stack">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label className="flex items-center gap-2 min-h-11 md:min-h-10 w-fit text-sm text-(--ink-2) cursor-pointer">
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
                        className="size-4 accent-(--brand)"
                      />
                      Current job
                    </label>
                    <div>
                      <div className="cr-field-row">
                        <span className="cr-field-label">Bullets</span>
                        <div className="flex items-center gap-1">
                          <FormatToolbar compact />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...resume.experience];
                              next[i] = { ...job, bullets: [...job.bullets, ""] };
                              patch("experience", next);
                            }}
                            className="inline-flex items-center gap-1 min-h-11 md:min-h-10 px-3 rounded-md text-sm text-(--brand) hover:bg-(--brand-50) font-semibold transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Bullet
                          </button>
                        </div>
                      </div>
                      <DragList
                        items={job.bullets}
                        onReorder={(nextBullets) => {
                          const nextRoles = [...resume.experience];
                          nextRoles[i] = { ...job, bullets: nextBullets };
                          patch("experience", nextRoles);
                        }}
                      >
                        {job.bullets.map((b, bi) => (
                          <DragItem
                            // oxlint-disable-next-line jsx/no-array-index-key
                            key={`${job.id}-bullet-${bi}`}
                            index={bi}
                            compact
                            stackMoves
                            onDelete={() => {
                              const next = [...resume.experience];
                              next[i] = {
                                ...job,
                                bullets: job.bullets.filter((_, bj) => bj !== bi),
                              };
                              patch("experience", next);
                            }}
                          >
                            {(bHandle, bDelete, bMove) => (
                              <div className={`flex gap-1.5 items-start ${bi > 0 ? "mt-2.5" : ""}`}>
                                <div className="mt-2">{bHandle}</div>
                                <div className="flex-1 min-w-0">
                                  <RichTextArea
                                    ariaLabel={`Experience bullet ${bi + 1}`}
                                    fieldId={`experience.${i}.bullets.${bi}`}
                                    value={b}
                                    rows={3}
                                    compact
                                    onChange={(v) => {
                                      const next = [...resume.experience];
                                      const bullets = [...job.bullets];
                                      bullets[bi] = v;
                                      next[i] = { ...job, bullets };
                                      patch("experience", next);
                                    }}
                                  />
                                </div>
                                <div className="mt-2 flex flex-col items-center gap-0">
                                  {bMove}
                                  {bDelete}
                                </div>
                              </div>
                            )}
                          </DragItem>
                        ))}
                      </DragList>
                    </div>
                  </div>
                </div>
              )}
            </DragItem>
          </FormatScope>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addRole}>Add role</AddButton>
      </div>
    </>
  );
}
