/** Quick stats + extras (visa, availability, etc.). */

import { BarChart3 } from "lucide-react";
import { DragList, DragItem } from "../DragList.tsx";
import { AddButton, EmptyState, newId, usePatch, type SectionProps } from "./shared.tsx";

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
              compact
              onDelete={() =>
                patch(
                  "quickStats",
                  resume.quickStats.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn) => (
                <div className="grid grid-cols-[auto_100px_1fr_auto] gap-2 items-center">
                  <div>{handle}</div>
                  <input
                    type="text"
                    value={s.value}
                    placeholder="15+"
                    onChange={(e) => {
                      const next = [...resume.quickStats];
                      next[i] = { ...s, value: e.target.value };
                      patch("quickStats", next);
                    }}
                    className="cr-input font-bold"
                  />
                  <input
                    type="text"
                    value={s.label}
                    placeholder="years in software"
                    onChange={(e) => {
                      const next = [...resume.quickStats];
                      next[i] = { ...s, label: e.target.value };
                      patch("quickStats", next);
                    }}
                    className="cr-input"
                  />
                  <div>{deleteBtn}</div>
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
              compact
              onDelete={() =>
                patch(
                  "extras",
                  resume.extras.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn) => (
                <div className="grid grid-cols-[auto_140px_1fr_auto] gap-2 items-center">
                  <div>{handle}</div>
                  <input
                    type="text"
                    value={x.label}
                    placeholder="Visa"
                    onChange={(e) => {
                      const next = [...resume.extras];
                      next[i] = { ...x, label: e.target.value };
                      patch("extras", next);
                    }}
                    className="cr-input"
                  />
                  <input
                    type="text"
                    value={x.value}
                    placeholder="No sponsorship required"
                    onChange={(e) => {
                      const next = [...resume.extras];
                      next[i] = { ...x, value: e.target.value };
                      patch("extras", next);
                    }}
                    className="cr-input"
                  />
                  <div>{deleteBtn}</div>
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
