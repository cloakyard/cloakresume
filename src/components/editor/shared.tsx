/**
 * Shared primitives for every editor section: an immutable patch hook,
 * an ID factory, the compact "Add row" affordance, the sub-card heading
 * chrome, and the card-shaped zero-state for empty lists.
 */

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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

/**
 * Compact "Add row" pill used at the bottom of every list section.
 * Always right-aligned so the affordance lives in one predictable spot.
 */
export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-(--brand-100) bg-(--brand-50) px-3 text-sm font-semibold text-(--brand) transition-colors md:min-h-10"
      >
        <Plus aria-hidden="true" className="w-3.5 h-3.5" />
        {children}
      </button>
    </div>
  );
}

/**
 * Zero-state card shown when a list-based section has no entries.
 * Gently tells the user what's missing and offers a single primary
 * action to populate the section.
 */
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
    <section
      className="border-t border-(--line) px-4 py-12 text-center"
      aria-label={`Empty ${sectionLabel}`}
    >
      <div className="flex flex-col items-center">
        <span className="mb-4 text-(--brand)" aria-hidden="true">
          {icon}
        </span>
        <h3 className="m-0 mb-1.5 text-base font-bold text-(--ink-1)">{heading}</h3>
        <p className="m-0 mb-5 max-w-85 text-sm leading-normal text-(--ink-3)">{description}</p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md bg-(--color-accent) px-4.5 py-2.5 text-sm font-semibold text-(--color-accent-ink) transition-colors hover:bg-(--brand-hover) focus-visible:outline-none focus-visible:shadow-(--sh-focus) md:min-h-10"
        >
          <Plus aria-hidden="true" className="w-4 h-4" strokeWidth={2.25} />
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}

/** Sub-card heading like "ROLE #1" with a delete button on the right. */
export function SubCardHead({
  index,
  prefix,
  onDelete,
  drag,
  moveBtns,
}: {
  index: number;
  prefix: string;
  onDelete: () => void;
  drag?: ReactNode;
  moveBtns?: ReactNode;
}) {
  const [deleteArmed, setDeleteArmed] = useState(false);

  useEffect(() => {
    if (!deleteArmed) return;
    const timeout = window.setTimeout(() => setDeleteArmed(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [deleteArmed]);

  const itemLabel = `${prefix.toLowerCase()} ${index + 1}`;

  return (
    <div className="flex items-center gap-2 mb-2">
      {drag}
      <span className="font-mono text-[10.5px] font-medium text-(--ink-5) uppercase tracking-[0.1em] tabular-nums">
        {prefix} #{index + 1}
      </span>
      <div className="ml-auto flex items-center gap-1">
        {moveBtns}
        <button
          type="button"
          onClick={() => {
            if (deleteArmed) onDelete();
            else setDeleteArmed(true);
          }}
          className="grid min-h-11 min-w-11 place-items-center rounded-md text-(--ink-5) transition-colors hover:bg-(--danger-bg) hover:text-(--danger) md:min-h-10 md:min-w-10"
          aria-label={deleteArmed ? `Confirm deletion of ${itemLabel}` : `Delete ${itemLabel}`}
        >
          {deleteArmed ? (
            <span className="px-1 text-[10px] font-bold uppercase tracking-wide">Confirm</span>
          ) : (
            <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
