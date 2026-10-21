/** Responsive library of actual document templates; previews never edit the draft. */
import { Check, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resumeHasContent } from "../data/blankResume.ts";
import { generateSampleResume } from "../data/sampleResume.ts";
import { TEMPLATE_CATEGORIES, TEMPLATES } from "../templates/index.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";
import { TemplatePreview } from "./TemplatePreview.tsx";

interface TemplateModalProps {
  open: boolean;
  templateId: TemplateId;
  onChange: (id: TemplateId) => void;
  onClose: () => void;
  resume: ResumeData;
  primary: string;
}

export function TemplateModal({
  open,
  templateId,
  onChange,
  onClose,
  resume,
  primary,
}: TemplateModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const id = useId();
  const sheetRef = useModalDialog<HTMLDivElement>({
    open,
    onClose,
    initialFocusRef: closeRef,
    inertBackground: true,
    // Responsive chrome can replace the opener while the library stays open.
    fallbackFocus: () =>
      document.querySelector<HTMLButtonElement>(
        'button[aria-label^="Template:"], button[aria-label="More options"]',
      ),
  });
  const swipeHandlers = useSwipeToDismiss(sheetRef, onClose);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return TEMPLATE_CATEGORIES.map((category) => ({
      category,
      templates: Object.values(TEMPLATES).filter(
        (t) =>
          t.category === category.id &&
          (!q ||
            [t.name, t.description, t.level, category.label].some((text) =>
              text.toLowerCase().includes(q),
            )),
      ),
    })).filter((group) => group.templates.length > 0);
  }, [filter]);
  const count = grouped.reduce((total, group) => total + group.templates.length, 0);
  const hasContent = resumeHasContent(resume);
  const previewResume = useMemo(
    () => (hasContent ? resume : generateSampleResume()),
    [hasContent, resume],
  );

  if (!open) return null;
  return createPortal(
    <div
      className="air-modal-viewport resume-library-viewport"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="air-modal resume-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        tabIndex={-1}
      >
        <div {...swipeHandlers} className="resume-sheet-handle" aria-hidden="true">
          <span />
        </div>
        <div className="resume-dialog-heading">
          <h2 id={`${id}-title`}>Choose a template</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="air-icon-button air-button--quiet"
            aria-label="Close template library"
          >
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
        <div className="resume-library-body">
          <p id={`${id}-description`} className="resume-library-description">
            Your content stays — only the layout changes.
            {!hasContent && " Sample content is shown until you add your own."}
          </p>
          <label className="air-label" htmlFor={`${id}-search`}>
            Search templates
          </label>
          <div className="air-field-group">
            <input
              ref={searchRef}
              id={`${id}-search`}
              type="search"
              name="template-search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              aria-label="Search templates"
              aria-describedby={`${id}-search-help`}
              className="air-field"
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                setFilter(event.currentTarget.value);
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!composing.current) setFilter(event.target.value);
              }}
            />
            <span className="air-field-actions">
              <button
                type="button"
                className="air-icon-button air-button--quiet air-field-clear"
                hidden={!query}
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setFilter("");
                  searchRef.current?.focus();
                }}
              >
                <X size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </span>
          </div>
          <p id={`${id}-search-help`} className="air-help">
            Search by name, style or experience level.
          </p>
          <p className="resume-library-count" role="status" aria-atomic="true">
            {count
              ? `${count} ${count === 1 ? "template" : "templates"}`
              : `No templates match “${filter}”. Clear search or try a different name, style or experience level.`}
          </p>
          {grouped.map(({ category, templates }) => (
            <section
              key={category.id}
              className="resume-library-category"
              aria-labelledby={`${id}-${category.id}`}
            >
              <div className="resume-library-category-heading">
                <h3 id={`${id}-${category.id}`}>{category.label}</h3>
                <span>{templates.length}</span>
              </div>
              <p className="resume-library-description">{category.description}</p>
              <div className="resume-library-grid">
                {templates.map((t) => {
                  const active = t.id === templateId;
                  return (
                    <article key={t.id} className="resume-template-card" data-selected={active}>
                      <div aria-hidden="true">
                        <div className="resume-template-details">
                          <div className="resume-template-name">
                            <h4>{t.name}</h4>
                            {active && (
                              <span className="resume-template-selected">
                                <Check size={18} strokeWidth={1.6} />
                                Selected
                              </span>
                            )}
                          </div>
                          {t.badge && (
                            <span className="resume-template-badge">{t.badge.label}</span>
                          )}
                          <p>{t.description}</p>
                          <p className="resume-template-level">{t.level}</p>
                        </div>
                        <div className="resume-template-paper">
                          <TemplatePreview
                            TemplateComponent={t.component}
                            resume={previewResume}
                            accent={primary}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(t.id)}
                        aria-pressed={active}
                        aria-label={`${t.name} template. ${t.description}. ${t.level}${t.badge ? `. ${t.badge.label}` : ""}`}
                        className="resume-template-choice"
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
