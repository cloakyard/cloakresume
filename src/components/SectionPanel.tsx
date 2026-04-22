/**
 * Section panel: the middle column that hosts a single section's
 * editor body, with chrome (icon tile + title + subtitle) at the top.
 *
 * The rail picks the active section; this panel owns rendering it.
 * Self-contained as a full-height flex column so it works identically
 * whether the parent is the desktop grid `<aside>` or the mobile
 * absolute-positioned view.
 */

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
}

export function SectionPanel({
  active,
  resume,
  onChange,
  jobDescription,
  onJobDescriptionChange,
  onAnalyze,
}: Props) {
  const meta = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const Icon = meta.icon;

  return (
    <section
      aria-label={`${meta.label} editor`}
      className="flex flex-col w-full h-full min-w-0 overflow-hidden bg-(--surface) print:hidden"
    >
      <header className="flex items-start gap-3 px-4 pt-4 pb-3.5 border-b border-(--line-soft) lg:px-5">
        {/*
         * Section-identity tile. Distinct from the rail's selected-item
         * chip by shape and weight: rounded-xl, larger (44px), a deeper
         * brand-100 fill with a brand-700 glyph and a subtle ring — a
         * calmer "you are here" banner, not a loud badge.
         */}
        <span
          aria-hidden="true"
          className="grid place-items-center w-11 h-11 shrink-0 rounded-md bg-(--brand-100) text-(--brand-700) ring-1 ring-(--brand-200)"
        >
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-(--ink-1)">
            <span>{meta.label}</span>
            {meta.id === "jd" && (
              <span className="inline-block font-mono text-[10.5px] font-semibold tracking-[0.04em] text-(--brand-700) bg-(--brand-50) border border-(--brand-200) px-1.5 py-px rounded-full uppercase">
                Optional
              </span>
            )}
          </div>
          <div className="text-[12.5px] text-(--ink-4) mt-0.5 leading-[1.45]">
            {meta.description}
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-3.5 pt-4 pb-32 cr-scroll lg:px-5 lg:pt-4.5 lg:pb-20">
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
