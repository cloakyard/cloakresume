/** Quick stats + extras (visa, availability, etc.). */

import { BarChart3 } from "lucide-react";
import { TextField } from "../fields.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  EntryHeading,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function StatsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addStat = () =>
    patch("quickStats", [...resume.quickStats, { id: newId("q"), value: "", label: "" }]);

  const addExtra = () =>
    patch("extras", [...resume.extras, { id: newId("x"), label: "", value: "" }]);

  if (resume.quickStats.length === 0 && resume.extras.length === 0) {
    return (
      <>
        <EmptyState
          sectionLabel="quick stats"
          icon={<BarChart3 className="w-5 h-5" strokeWidth={2} />}
          heading="No quick stats yet"
          description="Highlight headline numbers such as years of experience and systems shipped in templates that feature quick stats."
          buttonLabel="Add a stat"
          onAdd={addStat}
        />
        <div className="resume-content-group resume-content-group--divided">
          <p className="air-help">Add availability, visa status, or other details.</p>
          <AddButton onClick={addExtra}>Add extra</AddButton>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="resume-content-group">
        <h3 className="resume-group-title">Quick stats · shown in supporting templates</h3>
        <DragList items={resume.quickStats} onReorder={(next) => patch("quickStats", next)}>
          {resume.quickStats.map((s, i) => (
            <DragItem
              key={s.id}
              index={i}
              label={`stat ${i + 1}`}
              onDelete={() =>
                patch(
                  "quickStats",
                  resume.quickStats.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn, moveBtns) => (
                <div className="resume-entry">
                  <EntryHeading
                    index={i}
                    prefix="Stat"
                    drag={handle}
                    moveBtns={moveBtns}
                    deleteButton={deleteBtn}
                  />
                  <div className="resume-field-pair">
                    <TextField
                      label="Value"
                      placeholder="15+"
                      value={s.value}
                      onChange={(v) => {
                        const next = [...resume.quickStats];
                        next[i] = { ...s, value: v };
                        patch("quickStats", next);
                      }}
                    />
                    <TextField
                      label="Label"
                      placeholder="years in software"
                      value={s.label}
                      onChange={(v) => {
                        const next = [...resume.quickStats];
                        next[i] = { ...s, label: v };
                        patch("quickStats", next);
                      }}
                    />
                  </div>
                </div>
              )}
            </DragItem>
          ))}
        </DragList>
        <AddButton onClick={addStat}>Add stat</AddButton>
      </div>

      <div className="resume-content-group resume-content-group--divided">
        <h3 className="resume-group-title">Extras (visa, availability, etc.)</h3>
        <DragList items={resume.extras} onReorder={(next) => patch("extras", next)}>
          {resume.extras.map((x, i) => (
            <DragItem
              key={x.id}
              index={i}
              label={`extra ${i + 1}`}
              onDelete={() =>
                patch(
                  "extras",
                  resume.extras.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn, moveBtns) => (
                <div className="resume-entry">
                  <EntryHeading
                    index={i}
                    prefix="Extra"
                    drag={handle}
                    moveBtns={moveBtns}
                    deleteButton={deleteBtn}
                  />
                  <div className="resume-field-pair">
                    <TextField
                      label="Label"
                      placeholder="Visa"
                      value={x.label}
                      onChange={(v) => {
                        const next = [...resume.extras];
                        next[i] = { ...x, label: v };
                        patch("extras", next);
                      }}
                    />
                    <TextField
                      label="Value"
                      placeholder="No sponsorship required"
                      value={x.value}
                      onChange={(v) => {
                        const next = [...resume.extras];
                        next[i] = { ...x, value: v };
                        patch("extras", next);
                      }}
                    />
                  </div>
                </div>
              )}
            </DragItem>
          ))}
        </DragList>
        <AddButton onClick={addExtra}>Add extra</AddButton>
      </div>
    </div>
  );
}
