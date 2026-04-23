/** Custom sections: user-defined heading + free-form bullets. */

import { Layers, Plus } from "lucide-react";
import { TextField } from "../fields.tsx";
import { RichTextArea } from "../RichTextArea.tsx";
import { FormatScope, FormatToolbar } from "../FormatScope.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  SubCardHead,
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
              onDelete={() =>
                patch(
                  "custom",
                  resume.custom.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, _deleteBtn, moveBtns) => (
                <div className="sub-card mb-2.5">
                  <SubCardHead
                    index={i}
                    prefix="Section"
                    drag={handle}
                    moveBtns={moveBtns}
                    onDelete={() =>
                      patch(
                        "custom",
                        resume.custom.filter((_, j) => j !== i),
                      )
                    }
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
                    <div>
                      <div className="cr-field-row">
                        <span className="cr-field-label">Bullets</span>
                        <div className="flex items-center gap-1">
                          <FormatToolbar compact />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...resume.custom];
                              next[i] = { ...item, bullets: [...item.bullets, ""] };
                              patch("custom", next);
                            }}
                            className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11.5px] text-(--brand) hover:bg-(--brand-50) font-semibold transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Bullet
                          </button>
                        </div>
                      </div>
                      <DragList
                        items={item.bullets}
                        onReorder={(nextBullets) => {
                          const nextItems = [...resume.custom];
                          nextItems[i] = { ...item, bullets: nextBullets };
                          patch("custom", nextItems);
                        }}
                      >
                        {item.bullets.map((b, bi) => (
                          <DragItem
                            // oxlint-disable-next-line jsx/no-array-index-key
                            key={`${item.id}-bullet-${bi}`}
                            index={bi}
                            compact
                            stackMoves
                            onDelete={() => {
                              const next = [...resume.custom];
                              next[i] = {
                                ...item,
                                bullets: item.bullets.filter((_, bj) => bj !== bi),
                              };
                              patch("custom", next);
                            }}
                          >
                            {(bHandle, bDelete, bMove) => (
                              <div className={`flex gap-1.5 items-start ${bi > 0 ? "mt-2.5" : ""}`}>
                                <div className="mt-2">{bHandle}</div>
                                <div className="flex-1">
                                  <RichTextArea
                                    fieldId={`custom.${i}.bullets.${bi}`}
                                    value={b}
                                    rows={3}
                                    compact
                                    onChange={(v) => {
                                      const next = [...resume.custom];
                                      const bullets = [...item.bullets];
                                      bullets[bi] = v;
                                      next[i] = { ...item, bullets };
                                      patch("custom", next);
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
                      <p className="text-[11.5px] text-(--ink-4) mt-2">
                        Tip: a single bullet renders as a paragraph in the resume.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DragItem>
          </FormatScope>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addSection}>Add section</AddButton>
      </div>
    </>
  );
}
