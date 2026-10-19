/** Custom sections: user-defined heading + free-form bullets. */

import { Layers } from "lucide-react";
import { TextField } from "../fields.tsx";
import { FormatScope } from "../FormatScope.tsx";
import { BulletList } from "./BulletList.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  EntryHeading,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function CustomSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addSection = () =>
    patch("custom", [
      ...resume.custom,
      {
        id: newId("cu"),
        header: "",
        bullets: [""],
      },
    ]);

  if (resume.custom.length === 0) {
    return (
      <EmptyState
        sectionLabel="custom sections"
        icon={<Layers className="w-5 h-5" strokeWidth={2} />}
        heading="No custom sections yet"
        description="Add your own section — Volunteering, Publications, Speaking, or anything personal. Use one bullet for a paragraph, or multiple for a list."
        buttonLabel="Add a section"
        onAdd={addSection}
      />
    );
  }

  return (
    <>
      <DragList items={resume.custom} onReorder={(next) => patch("custom", next)}>
        {resume.custom.map((item, i) => (
          <FormatScope key={item.id}>
            <DragItem
              index={i}
              label={`section ${i + 1}`}
              onDelete={() =>
                patch(
                  "custom",
                  resume.custom.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn, moveBtns) => (
                <div className="resume-entry">
                  <EntryHeading
                    index={i}
                    prefix="Section"
                    drag={handle}
                    moveBtns={moveBtns}
                    deleteButton={deleteBtn}
                  />
                  <div className="cr-stack">
                    <TextField
                      label="Header"
                      placeholder="Volunteering"
                      value={item.header}
                      onChange={(v) => {
                        const next = [...resume.custom];
                        next[i] = { ...item, header: v };
                        patch("custom", next);
                      }}
                    />
                    <BulletList
                      values={item.bullets}
                      itemLabel={`section ${i + 1}`}
                      ariaLabel="Custom section bullet"
                      fieldPrefix={`custom.${i}.bullets`}
                      onChange={(bullets) => {
                        const next = [...resume.custom];
                        next[i] = { ...item, bullets };
                        patch("custom", next);
                      }}
                    />
                    <p className="air-help">
                      Tip: a single bullet renders as a paragraph in the resume.
                    </p>
                  </div>
                </div>
              )}
            </DragItem>
          </FormatScope>
        ))}
      </DragList>
      <AddButton onClick={addSection}>Add section</AddButton>
    </>
  );
}
