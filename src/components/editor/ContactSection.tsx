/** Contact: drag-orderable rows of {kind, value}. */

import { Mail } from "lucide-react";
import { useId } from "react";
import type { ContactLink } from "../../types.ts";
import { isValidEmail, isValidHttpUrl, isValidPhone } from "../../utils/validation.ts";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  EntryHeading,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

const CONTACT_KINDS: Record<ContactLink["kind"], string> = {
  email: "Email",
  phone: "Phone",
  location: "Location",
  website: "Website",
  linkedin: "LinkedIn",
  github: "GitHub",
  medium: "Medium",
  twitter: "Twitter",
  other: "Other",
};

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
  const fieldPrefix = useId();
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
    <>
      <DragList items={resume.contact} onReorder={(next) => patch("contact", next)}>
        {resume.contact.map((c, i) => {
          const issue = validateContact(c.kind, c.value);
          const id = `${fieldPrefix}-${c.id}`;
          const issueId = `${id}-issue`;
          return (
            <DragItem
              key={c.id}
              index={i}
              label={`${c.kind} contact ${i + 1}`}
              onDelete={() =>
                patch(
                  "contact",
                  resume.contact.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, deleteBtn, moveBtns) => (
                <div className="resume-entry">
                  <EntryHeading
                    index={i}
                    prefix="Contact"
                    drag={handle}
                    moveBtns={moveBtns}
                    deleteButton={deleteBtn}
                  />
                  <div className="resume-field-pair">
                    <div className="cr-field">
                      <label className="air-label" htmlFor={`${id}-kind`}>
                        Kind
                      </label>
                      <select
                        id={`${id}-kind`}
                        name={`contact-${c.id}-kind`}
                        autoComplete="off"
                        value={c.kind}
                        onChange={(e) => {
                          const next = [...resume.contact];
                          next[i] = { ...c, kind: e.target.value as typeof c.kind };
                          patch("contact", next);
                        }}
                        aria-label="Contact kind"
                        className="air-field"
                      >
                        {Object.entries(CONTACT_KINDS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="cr-field">
                      <label className="air-label" htmlFor={`${id}-value`}>
                        Value
                      </label>
                      <input
                        id={`${id}-value`}
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
                        spellCheck={c.kind === "location"}
                        aria-label={`${c.kind} contact value`}
                        onChange={(e) => {
                          const next = [...resume.contact];
                          next[i] = { ...c, value: e.target.value };
                          patch("contact", next);
                        }}
                        placeholder={PLACEHOLDER_BY_KIND[c.kind]}
                        aria-invalid={issue ? true : undefined}
                        aria-describedby={issue ? issueId : undefined}
                        className="air-field resume-writing-field"
                      />
                      {issue && (
                        <p id={issueId} className="air-help air-help--error" aria-live="polite">
                          {issue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DragItem>
          );
        })}
      </DragList>
      <AddButton onClick={addContact}>Add contact</AddButton>
    </>
  );
}
