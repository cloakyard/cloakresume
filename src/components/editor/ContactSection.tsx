/** Contact: drag-orderable rows of {kind, value}. */

import { Mail } from "lucide-react";
import { contactIcon } from "../../templates/shared.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import { AddButton, EmptyState, newId, usePatch, type SectionProps } from "./shared.tsx";

const CONTACT_KINDS = [
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
  "medium",
  "twitter",
  "other",
] as const;

export function ContactSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addContact = () =>
    patch("contact", [...resume.contact, { id: newId("c"), kind: "website", value: "" }]);

  if (resume.contact.length === 0) {
    return (
      <EmptyState
        sectionLabel="contact"
        icon={<Mail className="w-5 h-5" strokeWidth={2} />}
        heading="No contact info yet"
        description="Add how people should reach you — email, phone, location, or a social link."
        buttonLabel="Add contact"
        onAdd={addContact}
      />
    );
  }

  return (
    <div className="space-y-2">
      <DragList items={resume.contact} onReorder={(next) => patch("contact", next)}>
        {resume.contact.map((c, i) => (
          <DragItem
            key={c.id}
            index={i}
            compact
            onDelete={() =>
              patch(
                "contact",
                resume.contact.filter((_, j) => j !== i),
              )
            }
          >
            {(handle, deleteBtn, moveBtns) => (
              <div className="rounded-md border border-(--line) bg-(--surface) overflow-hidden">
                <div className="flex items-center gap-1.5 px-1 py-1 bg-(--surface-2) border-b border-(--line-soft)">
                  {handle}
                  <div className="w-6 h-6 flex items-center justify-center text-(--ink-4) shrink-0">
                    {contactIcon(c.kind, 14)}
                  </div>
                  <select
                    value={c.kind}
                    onChange={(e) => {
                      const next = [...resume.contact];
                      next[i] = { ...c, kind: e.target.value as typeof c.kind };
                      patch("contact", next);
                    }}
                    aria-label="Contact kind"
                    className="appearance-none pl-2 pr-5 py-1 font-mono text-[10px] bg-(--surface) hover:bg-(--surface-3) text-(--ink-3) rounded-md uppercase tracking-wider font-semibold cursor-pointer transition-colors border border-(--line-soft)"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 4px center",
                      backgroundSize: "10px 10px",
                    }}
                  >
                    {CONTACT_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <div className="ml-auto flex items-center gap-0.5">
                    {moveBtns}
                    {deleteBtn}
                  </div>
                </div>
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...resume.contact];
                    next[i] = { ...c, value: e.target.value };
                    patch("contact", next);
                  }}
                  placeholder="Enter value…"
                  className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none placeholder:text-(--ink-5)"
                />
              </div>
            )}
          </DragItem>
        ))}
      </DragList>
      <div className="pt-1">
        <AddButton onClick={addContact}>Add contact</AddButton>
      </div>
    </div>
  );
}
