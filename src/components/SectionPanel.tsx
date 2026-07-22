/**
 * Section panel: the middle column that hosts a single section's
 * editor body, with section identity and context at the top.
 *
 * The rail picks the active section; this panel owns rendering it.
 * Self-contained as a full-height flex column in both desktop and the
 * mobile 50:50 workbench.
 */

import { X } from "lucide-react";
import type { ResumeData } from "../types.ts";
import { Editor } from "./Editor.tsx";
import { SECTIONS, type SectionId } from "./SectionRail.tsx";

interface Props {
  active: SectionId;
  resume: ResumeData;
  onChange: (next: ResumeData) => void;
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
  onAnalyze?: () => void;
  /** Mobile-only: close this editor and reveal the inline section picker. */
  onClose?: () => void;
}

export function SectionPanel({
  active,
  resume,
  onChange,
  jobDescription,
  onJobDescriptionChange,
  onAnalyze,
  onClose,
}: Props) {
  const meta = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const Icon = meta.icon;

  return (
    <section
      aria-label={`${meta.label} editor`}
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-(--surface) print:hidden"
    >
      <header className="flex shrink-0 items-start gap-3 border-b border-(--line) bg-(--surface) px-4 py-3 lg:px-5 lg:py-4">
        <span
          aria-hidden="true"
          className="grid h-10 w-6 shrink-0 place-items-center text-(--brand)"
        >
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="m-0 flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-(--ink-1)">
            <span>{meta.label}</span>
            {meta.id === "jd" && (
              <span className="inline-block rounded-sm border border-(--brand-200) bg-(--brand-50) px-1.5 py-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em] text-(--brand-700)">
                Optional
              </span>
            )}
          </h2>
          <div className="mt-0.5 text-sm leading-[1.45] text-(--ink-4)">{meta.description}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${meta.label} editor and choose another section`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-(--line) bg-(--surface) text-(--ink-4) transition-colors duration-160 hover:border-(--brand) hover:text-(--ink-1) lg:hidden"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </header>
      <div className="cr-scroll min-h-0 flex-1 overflow-y-auto px-3.5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 lg:px-5 lg:pb-20 lg:pt-4.5">
        <Editor
          active={active}
          resume={resume}
          onChange={onChange}
          jobDescription={jobDescription}
          onJobDescriptionChange={onJobDescriptionChange}
          onAnalyze={onAnalyze}
        />
      </div>
    </section>
  );
}
