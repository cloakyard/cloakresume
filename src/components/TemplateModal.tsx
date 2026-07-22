/**
 * Responsive template picker — bottom-sheet on mobile with drag-to-dismiss,
 * centred wide dialog on tablet+. Renders a grid of live template previews.
 */

import { Search, X } from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { generateSampleResume } from "../data/sampleResume.ts";
import { TEMPLATE_CATEGORIES, TEMPLATES } from "../templates/index.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { TemplatePreview } from "./TemplatePreview.tsx";

const COUNT_FORMATTER = new Intl.NumberFormat(undefined, {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

/**
 * A fresh "Start fresh" resume leaves every section empty, which makes the
 * template cards look identical and broken. Detect that state so previews
 * can fall back to the sample data and showcase the actual layout.
 */
function isResumeEmpty(r: ResumeData): boolean {
  return (
    r.experience.length === 0 &&
    r.education.length === 0 &&
    r.skills.length === 0 &&
    r.projects.length === 0 &&
    r.certifications.length === 0 &&
    r.awards.length === 0 &&
    r.languages.length === 0 &&
    r.contact.length === 0 &&
    !r.profile.summary.trim()
  );
}

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
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const presence = useAnimatedPresence(open);
  const sheetRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose,
    initialFocusRef: closeRef,
  });
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATE_CATEGORIES.map((category) => ({
      category,
      templates: Object.values(TEMPLATES).filter((t) => {
        if (t.category !== category.id) return false;
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.level.toLowerCase().includes(q) ||
          category.label.toLowerCase().includes(q)
        );
      }),
    })).filter((g) => g.templates.length > 0);
  }, [query]);

  const hasResults = grouped.length > 0;

  const previewResume = useMemo(
    () => (isResumeEmpty(resume) ? generateSampleResume() : resume),
    [resume],
  );

  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragDeltaRef.current = 0;
  }, []);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      dragDeltaRef.current = delta;
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "";
    if (dragDeltaRef.current > 120) {
      onClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    dragDeltaRef.current = 0;
  }, [onClose]);

  if (!presence.mounted) return null;

  return createPortal(
    <div
      className="cr-overlay print-hide fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6"
      data-state={presence.state}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="cr-dialog cr-dialog-wide cr-sheet relative flex max-h-[var(--sheet-max-block-size)] w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-sheet-rise min-[640px]:!w-[min(var(--dialog-wide-max),calc(100vw-3rem))] min-[640px]:max-h-[var(--dialog-max-block-size)] min-[640px]:pb-0 min-[640px]:animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          className="grid place-items-center pt-2.5 pb-1 cursor-grab touch-none sm:hidden"
        >
          <span aria-hidden="true" className="w-11 h-1 rounded-full bg-(--ink-5)/40" />
        </div>
        <div className="flex flex-col gap-3 px-4 md:px-7 pt-2 sm:pt-5 md:pt-5.5 pb-3.5 border-b border-(--line-soft)/70">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2
                id={titleId}
                className="text-base md:text-lg font-semibold tracking-[-0.01em] text-(--ink-1)"
              >
                Choose a template
              </h2>
              <p id={descriptionId} className="mt-0.5 text-sm text-(--ink-4)">
                Your content stays — only the layout changes
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-160 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
              aria-label="Close"
            >
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--ink-4) pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              name="template-search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates by name, style, or level…"
              aria-label="Search templates"
              className="h-11 w-full rounded-md border border-(--line) bg-(--surface-2) pl-9 pr-11 text-sm text-(--ink-1) placeholder:text-(--ink-4) transition-colors duration-160 hover:border-(--color-rule-strong) focus-visible:border-(--brand) focus-visible:bg-(--surface)"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-160 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
              >
                <X aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="cr-scroll overflow-y-auto overscroll-contain px-4 md:px-7 py-4 md:py-5.5">
          {!hasResults && (
            <div className="py-12 text-center" role="status">
              <div className="text-sm font-medium text-(--ink-1)">No templates match “{query}”</div>
              <div className="mt-1 text-sm text-(--ink-4)">
                Try a different name, style, or experience level
              </div>
            </div>
          )}
          {grouped.map(({ category, templates }) => (
            <section key={category.id} className="mb-6 last:mb-0">
              <div className="flex items-baseline gap-3 mb-3 md:mb-3.5 pb-2 border-b border-(--line-soft)">
                <h3 className="text-[11.5px] md:text-xs font-semibold tracking-[0.12em] uppercase text-(--ink-1)">
                  {category.label}
                </h3>
                <span className="hidden text-sm tracking-[0.01em] text-(--ink-4) sm:inline">
                  {category.description}
                </span>
                <span className="ml-auto text-[11px] font-mono text-(--ink-4) tabular-nums">
                  {COUNT_FORMATTER.format(templates.length)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4.5">
                {templates.map((t) => {
                  const active = t.id === templateId;
                  return (
                    <article
                      key={t.id}
                      className={`cr-template-card relative flex flex-col overflow-hidden rounded-lg border bg-(--surface) text-left transition-[border-color,transform] duration-160 ${
                        active
                          ? "border-(--brand) shadow-[0_0_0_2px_var(--brand-100)]"
                          : "border-(--line)"
                      }`}
                    >
                      <div aria-hidden="true">
                        <div className="aspect-8.5/11 bg-(--surface-2) overflow-hidden relative border-b border-(--line)">
                          <TemplatePreview
                            TemplateComponent={t.component}
                            resume={previewResume}
                            accent={primary}
                          />
                        </div>
                        <div className="px-4 pt-3.5 pb-4">
                          <div className="font-semibold text-sm text-(--ink-1) flex items-center gap-2 justify-between">
                            <span>{t.name}</span>
                            {t.badge && (
                              <span
                                className={`text-[10.5px] font-semibold tracking-[0.04em] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                  t.badge.tone === "ats"
                                    ? "bg-(--ok-bg) text-(--ok) border-(--ok-border)"
                                    : "bg-(--brand-50) text-(--brand-700) border-(--brand-200)"
                                }`}
                              >
                                {t.badge.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm leading-[1.5] text-(--ink-4)">
                            {t.description}
                          </div>
                          <div className="mt-2.5 border-t border-(--line-soft) pt-2 font-mono text-[11px] font-medium tracking-[0.01em] text-(--ink-3)">
                            {t.level}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(t.id)}
                        aria-label={`${t.name} template. ${t.description}. ${t.level}`}
                        aria-pressed={active}
                        className="absolute inset-0 cursor-pointer rounded-lg border-2 border-transparent bg-transparent transition-[border-color] duration-160 hover:border-(--brand-300) focus-visible:border-(--brand) focus-visible:shadow-[0_0_0_3px_var(--brand-100)]"
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
