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
            {(handle, deleteBtn) => (
              <div className="flex items-center gap-1.5 rounded-md transition-shadow border border-(--line) bg-(--surface)">
                <div className="pl-1">{handle}</div>
                <div className="w-7 h-9 flex items-center justify-center text-(--ink-4) shrink-0">
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
                  className="appearance-none pl-2 pr-5 py-1.5 font-mono text-[10px] bg-(--surface-2) hover:bg-(--surface-3) text-(--ink-3) rounded-md uppercase tracking-wider font-semibold cursor-pointer transition-colors border border-transparent"
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
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...resume.contact];
                    next[i] = { ...c, value: e.target.value };
                    patch("contact", next);
                  }}
                  placeholder="Enter value…"
                  className="flex-1 min-w-0 px-2 py-2 text-sm bg-transparent focus:outline-none placeholder:text-(--ink-5)"
                />
                <div className="pr-1">{deleteBtn}</div>
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
