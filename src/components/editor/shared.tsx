/**
 * Shared primitives for every editor section: an immutable patch hook,
 * an ID factory, entry headings, add actions and empty-list guidance.
 */

import type { ReactNode } from "react";
import { useCallback } from "react";
import { Plus } from "lucide-react";
import type { ResumeData } from "../../types.ts";

export interface SectionProps {
  resume: ResumeData;
  onChange: (next: ResumeData) => void;
}

export type PatchFn = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;

/** Returns a memoised shallow-merge updater for the given resume. */
export function usePatch(resume: ResumeData, onChange: (next: ResumeData) => void): PatchFn {
  return useCallback(
    <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
      onChange({ ...resume, [key]: value });
    },
    [resume, onChange],
  );
}

let idCounter = 1;
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`;
}

/** Add another entry without inventing a separate commit boundary. */
export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <div className="resume-add-row">
      <button type="button" onClick={onClick} className="air-button resume-add-action">
        <Plus size={18} strokeWidth={1.6} aria-hidden="true" />
        {children}
      </button>
    </div>
  );
}

export function EmptyState({
  sectionLabel,
  icon,
  heading,
  description,
  buttonLabel,
  onAdd,
}: {
  sectionLabel: string;
  icon: ReactNode;
  heading: string;
  description: string;
  buttonLabel: string;
  onAdd: () => void;
}) {
  return (
    <section className="resume-empty-entry" aria-label={`Empty ${sectionLabel}`}>
      <span aria-hidden="true">{icon}</span>
      <h3>{heading}</h3>
      <p>{description}</p>
      <button
        type="button"
        onClick={onAdd}
        className="air-button air-button--primary resume-add-action"
      >
        <Plus size={18} strokeWidth={1.6} aria-hidden="true" />
        {buttonLabel}
      </button>
    </section>
  );
}

/** Plain entry heading; DragItem owns its single removal confirmation. */
export function EntryHeading({
  index,
  prefix,
  drag,
  moveBtns,
  deleteButton,
}: {
  index: number;
  prefix: string;
  drag: ReactNode;
  moveBtns: ReactNode;
  deleteButton: ReactNode;
}) {
  return (
    <div className="resume-entry-heading">
      <h3>
        {prefix} {index + 1}
      </h3>
      <div className="resume-entry-actions">
        {drag}
        {moveBtns}
        {deleteButton}
      </div>
    </div>
  );
}
