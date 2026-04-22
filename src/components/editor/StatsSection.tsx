/** Quick stats + extras (visa, availability, etc.). */

import { BarChart3 } from "lucide-react";
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

export function StatsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addStat = () =>
    patch("quickStats", [...resume.quickStats, { id: newId("q"), value: "", label: "" }]);

  if (resume.quickStats.length === 0 && resume.extras.length === 0) {
    return (
      <EmptyState
        sectionLabel="quick stats"
        icon={<BarChart3 className="w-5 h-5" strokeWidth={2} />}
        heading="No quick stats yet"
        description="Highlight headline numbers (years of experience, systems shipped) that sidebar templates surface up front."
        buttonLabel="Add a stat"
        onAdd={addStat}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="cr-field-label block mb-2">Quick stats · shown in sidebar templates</span>
        <DragList items={resume.quickStats} onReorder={(next) => patch("quickStats", next)}>
          {resume.quickStats.map((s, i) => (
            <DragItem
              key={s.id}
              index={i}
              onDelete={() =>
                patch(
                  "quickStats",
                  resume.quickStats.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, _deleteBtn, moveBtns) => (
                <div className="sub-card mb-2.5">
                  <SubCardHead
                    index={i}
                    prefix="Stat"
                    drag={handle}
                    moveBtns={moveBtns}
                    onDelete={() =>
                      patch(
                        "quickStats",
                        resume.quickStats.filter((_, j) => j !== i),
                      )
                    }
                  />
                  <div className="grid grid-cols-[120px_1fr] gap-3">
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
        <div className="mt-3">
          <AddButton onClick={addStat}>Add stat</AddButton>
        </div>
      </div>

      <div className="space-y-3 pt-5 border-t border-(--line-soft)">
        <span className="cr-field-label block mb-2">Extras (visa, availability, etc.)</span>
        <DragList items={resume.extras} onReorder={(next) => patch("extras", next)}>
          {resume.extras.map((x, i) => (
            <DragItem
              key={x.id}
              index={i}
              onDelete={() =>
                patch(
                  "extras",
                  resume.extras.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, _deleteBtn, moveBtns) => (
                <div className="sub-card mb-2.5">
                  <SubCardHead
                    index={i}
                    prefix="Extra"
                    drag={handle}
                    moveBtns={moveBtns}
                    onDelete={() =>
                      patch(
                        "extras",
                        resume.extras.filter((_, j) => j !== i),
                      )
                    }
                  />
                  <div className="grid grid-cols-[140px_1fr] gap-3">
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
        <div className="mt-3">
          <AddButton
            onClick={() =>
              patch("extras", [...resume.extras, { id: newId("x"), label: "", value: "" }])
            }
          >
            Add extra
          </AddButton>
        </div>
      </div>
    </div>
  );
}
