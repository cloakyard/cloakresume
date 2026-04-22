/** Certifications: name + issuer + year + optional verification URL. */

import { BadgeCheck } from "lucide-react";
import { isValidHttpUrl } from "../../utils/validation.ts";
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

export function CertificationsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addCert = () =>
    patch("certifications", [
      ...resume.certifications,
      { id: newId("ct"), issuer: "", name: "", year: "", url: "" },
    ]);

  if (resume.certifications.length === 0) {
    return (
      <EmptyState
        sectionLabel="certifications"
        icon={<BadgeCheck className="w-5 h-5" strokeWidth={2} />}
        heading="No certifications yet"
        description="List professional certifications and licences that strengthen your expertise."
        buttonLabel="Add a certification"
        onAdd={addCert}
      />
    );
  }

  return (
    <>
      <DragList items={resume.certifications} onReorder={(next) => patch("certifications", next)}>
        {resume.certifications.map((c, i) => (
          <DragItem
            key={c.id}
            index={i}
            onDelete={() =>
              patch(
                "certifications",
                resume.certifications.filter((_, j) => j !== i),
              )
            }
          >
            {(handle, _deleteBtn, moveBtns) => (
              <div className="sub-card mb-2.5">
                <SubCardHead
                  index={i}
                  prefix="Certification"
                  drag={handle}
                  moveBtns={moveBtns}
                  onDelete={() =>
                    patch(
                      "certifications",
                      resume.certifications.filter((_, j) => j !== i),
                    )
                  }
                />
                <div className="cr-stack">
                  <TextField
                    label="Name"
                    value={c.name}
                    onChange={(v) => {
                      const next = [...resume.certifications];
                      next[i] = { ...c, name: v };
                      patch("certifications", next);
                    }}
                  />
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <TextField
                      label="Issuer"
                      value={c.issuer}
                      onChange={(v) => {
                        const next = [...resume.certifications];
                        next[i] = { ...c, issuer: v };
                        patch("certifications", next);
                      }}
                    />
                    <TextField
                      label="Year"
                      value={c.year}
                      onChange={(v) => {
                        const next = [...resume.certifications];
                        next[i] = { ...c, year: v };
                        patch("certifications", next);
                      }}
                    />
                  </div>
                  <TextField
                    label="Verification link (optional)"
                    type="url"
                    placeholder="https://credly.com/badges/…"
                    value={c.url ?? ""}
                    invalid={!!(c.url?.trim() && !isValidHttpUrl(c.url))}
                    hint={
                      c.url?.trim() && !isValidHttpUrl(c.url)
                        ? "Enter a valid URL (https://…)."
                        : "Renders as a clickable link in the exported PDF."
                    }
                    onChange={(v) => {
                      const next = [...resume.certifications];
                      next[i] = { ...c, url: v };
                      patch("certifications", next);
                    }}
                  />
                </div>
              </div>
            )}
          </DragItem>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addCert}>Add certification</AddButton>
      </div>
    </>
  );
}
