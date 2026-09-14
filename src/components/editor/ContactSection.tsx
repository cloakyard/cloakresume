/** Contact: drag-orderable rows of {kind, value}. */

import { AlertCircle, Mail } from "lucide-react";
import type { ContactLink } from "../../types.ts";
import { contactIcon } from "../../templates/shared.tsx";
import { isValidEmail, isValidHttpUrl, isValidPhone } from "../../utils/validation.ts";
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

/** Placeholder text shown in the empty value input for each contact kind. */
const PLACEHOLDER_BY_KIND: Record<ContactLink["kind"], string> = {
  email: "name@example.com",
  phone: "+1 555 123 4567",
  location: "City, Country",
  website: "https://your-site.com",
  linkedin: "https://linkedin.com/in/you",
  github: "https://github.com/you",
  twitter: "https://twitter.com/you",
  medium: "https://medium.com/@you",
  other: "https://…",
};

/**
 * Validate a contact row against its declared `kind`. Empty values are
 * never flagged — the user is still typing — so the UI only yells about
 * values that are clearly malformed (e.g. "foo@" for an email).
 */
function validateContact(kind: ContactLink["kind"], value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (kind) {
    case "email":
      return isValidEmail(v) ? null : "Enter a valid email address.";
    case "phone":
      return isValidPhone(v) ? null : "Enter a valid phone number.";
    case "location":
      return null;
    default:
      return isValidHttpUrl(v) ? null : "Enter a valid URL (https://…).";
  }
}

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
    <div className="@container/contacts space-y-2">
      <DragList items={resume.contact} onReorder={(next) => patch("contact", next)}>
        {resume.contact.map((c, i) => {
          const issue = validateContact(c.kind, c.value);
          const issueId = `contact-${c.id}-issue`;
          return (
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
                <div className="grid grid-cols-[minmax(0,1fr)_auto] rounded-md border border-(--line) bg-(--surface) overflow-hidden @min-[36rem]/contacts:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 items-center gap-1.5 p-1 bg-(--surface-2)">
                    <span className="hidden @min-[22rem]/contacts:inline-flex">{handle}</span>
                    <div className="hidden @min-[19rem]/contacts:flex w-6 h-6 items-center justify-center text-(--ink-4) shrink-0">
                      {contactIcon(c.kind, 14)}
                    </div>
                    <select
                      name={`contact-${c.id}-kind`}
                      autoComplete="off"
                      value={c.kind}
                      onChange={(e) => {
                        const next = [...resume.contact];
                        next[i] = { ...c, kind: e.target.value as typeof c.kind };
                        patch("contact", next);
                      }}
                      aria-label="Contact kind"
                      className="w-28 min-w-0 shrink-0 min-h-11 md:min-h-10 pl-2 pr-2 font-mono text-[10px] bg-(--surface) hover:bg-(--surface-3) text-(--ink-3) rounded-md uppercase tracking-wider font-semibold cursor-pointer transition-colors border border-(--line-soft)"
                    >
                      {CONTACT_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    name={`contact-${c.id}-value`}
                    autoComplete={
                      c.kind === "email"
                        ? "email"
                        : c.kind === "phone"
                          ? "tel"
                          : c.kind === "location"
                            ? "address-level2"
                            : "url"
                    }
                    type={c.kind === "email" ? "email" : c.kind === "phone" ? "tel" : "text"}
                    value={c.value}
                    aria-label={`${c.kind} contact value`}
                    onChange={(e) => {
                      const next = [...resume.contact];
                      next[i] = { ...c, value: e.target.value };
                      patch("contact", next);
                    }}
                    placeholder={PLACEHOLDER_BY_KIND[c.kind]}
                    aria-invalid={issue ? true : undefined}
                    aria-describedby={issue ? issueId : undefined}
                    className={`col-span-full row-start-2 w-full min-w-0 min-h-11 border-t border-(--line-soft) px-3 py-2 text-sm bg-transparent placeholder:text-(--ink-5) @min-[36rem]/contacts:col-span-1 @min-[36rem]/contacts:col-start-2 @min-[36rem]/contacts:row-start-1 @min-[36rem]/contacts:border-t-0 @min-[36rem]/contacts:border-x ${
                      issue
                        ? "text-(--color-status-danger) placeholder:text-(--color-status-danger)/40"
                        : ""
                    }`}
                  />
                  <div className="col-start-2 row-start-1 flex items-center gap-0.5 bg-(--surface-2) p-1 @min-[36rem]/contacts:col-start-3">
                    {moveBtns}
                    {deleteBtn}
                  </div>
                  {issue && (
                    <div
                      id={issueId}
                      className="col-span-full flex items-center gap-1.5 px-3 py-1.5 text-sm text-(--color-status-danger) bg-(--color-status-danger-soft) border-t border-(--color-status-danger)"
                      aria-live="polite"
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2.25} />
                      <span>{issue}</span>
                    </div>
                  )}
                </div>
              )}
            </DragItem>
          );
        })}
      </DragList>
      <div className="pt-1">
        <AddButton onClick={addContact}>Add contact</AddButton>
      </div>
    </div>
  );
}
