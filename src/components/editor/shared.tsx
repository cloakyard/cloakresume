/**
 * Shared primitives for every editor section: an immutable patch hook,
 * an ID factory, the compact "Add row" affordance, the sub-card heading
 * chrome, and the card-shaped zero-state for empty lists.
 */

import type { ReactNode } from "react";
import { useCallback } from "react";
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
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12.5px] font-semibold text-(--brand) bg-(--brand-50) border border-(--brand-100) transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
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
    <div className="bg-(--surface) border border-(--line) rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-(--surface-2) border-b border-(--line-soft)">
        <span className="text-[13.5px] font-semibold text-(--ink-1)">Empty {sectionLabel}</span>
        <span className="font-mono text-[11px] text-(--ink-3) px-2 py-0.75 border border-(--line) rounded-md bg-(--surface)">
          zero state
        </span>
      </div>
      <div className="flex flex-col items-center text-center px-7 py-14">
        <span
          className="w-12 h-12 rounded-xl grid place-items-center text-(--brand) bg-(--brand-50) mb-4.5"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h3 className="text-base font-bold text-(--ink-1) m-0 mb-1.5">{heading}</h3>
        <p className="text-[13px] text-(--ink-3) leading-normal m-0 mb-5 max-w-85">{description}</p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-[13.5px] font-semibold text-white bg-(--brand) rounded-lg cursor-pointer transition-colors hover:bg-(--brand-hover) focus-visible:outline-none focus-visible:shadow-(--sh-focus)"
        >
          <Plus className="w-4 h-4" strokeWidth={2.25} />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

/** Sub-card heading like "ROLE #1" with a delete button on the right. */
export function SubCardHead({
  index,
  prefix,
  onDelete,
  drag,
}: {
  index: number;
  prefix: string;
  onDelete: () => void;
  drag?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {drag}
      <span className="font-mono text-[10.5px] font-semibold text-(--ink-4) uppercase tracking-[0.06em]">
        {prefix} #{index + 1}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="ml-auto w-7 h-7 rounded-md grid place-items-center text-(--ink-5) hover:text-(--danger) hover:bg-(--danger-bg) transition-colors"
        aria-label={`Delete ${prefix.toLowerCase()} ${index + 1}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
