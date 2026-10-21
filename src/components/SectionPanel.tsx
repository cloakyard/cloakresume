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

  return (
    <section aria-label={`${meta.label} editor`} className="cr-scroll resume-section print:hidden">
      <header className="resume-section-heading">
        <div className="flex-1 min-w-0">
          <h2 className="resume-section-title">
            <span>{meta.label}</span>
            {meta.id === "jd" && <span className="resume-section-optional">Optional</span>}
          </h2>
          <div className="resume-section-help">{meta.description}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${meta.label} editor and choose another section`}
            className="air-icon-button air-button--quiet resume-section-close"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.6} />
          </button>
        )}
      </header>
      <div key={active} className="resume-section-body">
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
