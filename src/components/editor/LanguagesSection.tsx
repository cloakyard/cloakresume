/** Languages: name + proficiency level. */

import { Globe } from "lucide-react";
import { TextField, SelectField } from "../fields.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  SubCardHead,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

const LANGUAGE_LEVELS = ["Beginner", "Intermediate", "Experienced", "Advanced", "Expert"] as const;

export function LanguagesSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addLanguage = () =>
    patch("languages", [...resume.languages, { id: newId("l"), name: "", level: "" }]);

  if (resume.languages.length === 0) {
    return (
      <EmptyState
        sectionLabel="languages"
        icon={<Globe className="w-5 h-5" strokeWidth={2} />}
        heading="No languages yet"
        description="Add languages you speak along with your proficiency to broaden your reach."
        buttonLabel="Add a language"
        onAdd={addLanguage}
      />
    );
  }

  return (
    <>
      <DragList items={resume.languages} onReorder={(next) => patch("languages", next)}>
        {resume.languages.map((l, i) => (
          <DragItem
            key={l.id}
            index={i}
            onDelete={() =>
              patch(
                "languages",
                resume.languages.filter((_, j) => j !== i),
              )
            }
          >
            {(handle, _deleteBtn, moveBtns) => (
              <div className="sub-card mb-2.5">
                <SubCardHead
                  index={i}
                  prefix="Language"
                  drag={handle}
                  moveBtns={moveBtns}
                  onDelete={() =>
                    patch(
                      "languages",
                      resume.languages.filter((_, j) => j !== i),
                    )
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Language"
                    value={l.name}
                    onChange={(v) => {
                      const next = [...resume.languages];
                      next[i] = { ...l, name: v };
                      patch("languages", next);
                    }}
                  />
                  <SelectField
                    label="Proficiency"
                    value={l.level}
                    options={LANGUAGE_LEVELS}
                    onChange={(v) => {
                      const next = [...resume.languages];
                      next[i] = { ...l, level: v };
                      patch("languages", next);
                    }}
                  />
                </div>
              </div>
            )}
          </DragItem>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addLanguage}>Add language</AddButton>
      </div>
    </>
  );
}
