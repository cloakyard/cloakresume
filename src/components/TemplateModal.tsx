/**
 * Responsive template picker — bottom-sheet on mobile with drag-to-dismiss,
 * top-docked modal on tablet+. Renders a grid of live template previews.
 */

import { Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { generateSampleResume } from "../data/sampleResume.ts";
import { TEMPLATE_CATEGORIES, TEMPLATES } from "../templates/index.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { TemplatePreview } from "./TemplatePreview.tsx";

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
  templateId: TemplateId;
  onChange: (id: TemplateId) => void;
  onClose: () => void;
  resume: ResumeData;
  primary: string;
}

export function TemplateModal({
  templateId,
  onChange,
  onClose,
  resume,
  primary,
}: TemplateModalProps) {
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      className="print-hide fixed inset-0 z-80 flex items-end sm:items-start justify-center sm:pt-8 md:pt-12 sm:px-3 md:px-6 backdrop animate-scale-in"
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close template picker"
        className="absolute inset-0"
        style={{ background: "transparent" }}
      />
      <div
        ref={sheetRef}
        className="surface-glass relative flex flex-col w-full max-w-275 max-h-[92svh] overflow-hidden rounded-t-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a template"
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
              <div className="text-base md:text-lg font-semibold tracking-[-0.01em] text-(--ink-1)">
                Choose a template
              </div>
              <div className="text-[13px] text-(--ink-4) mt-0.5">
                Your content stays — only the layout changes
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-md grid place-items-center text-(--ink-4) bg-transparent border-0 cursor-pointer transition-colors duration-100 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--ink-4) pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates by name, style, or level…"
              aria-label="Search templates"
              className="w-full h-10 pl-9 pr-9 rounded-lg border border-(--line) bg-(--surface-2) text-[13px] text-(--ink-1) placeholder:text-(--ink-4) outline-none transition-colors duration-100 focus:border-(--brand) focus:bg-(--surface) focus:shadow-[0_0_0_3px_var(--brand-100)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded grid place-items-center text-(--ink-4) bg-transparent border-0 cursor-pointer transition-colors duration-100 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto px-4 md:px-7 py-4 md:py-5.5 cr-scroll">
          {!hasResults && (
            <div className="py-12 text-center">
              <div className="text-sm font-medium text-(--ink-1)">No templates match “{query}”</div>
              <div className="text-[13px] text-(--ink-4) mt-1">
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
                <span className="text-[11px] text-(--ink-4) tracking-[0.01em] hidden sm:inline">
                  {category.description}
                </span>
                <span className="ml-auto text-[11px] font-mono text-(--ink-4) tabular-nums">
                  {String(templates.length).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4.5">
                {templates.map((t) => {
                  const active = t.id === templateId;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => onChange(t.id)}
                      className={`border rounded-xl overflow-hidden bg-(--surface) cursor-pointer transition-all duration-150 flex flex-col text-left p-0 hover:border-(--brand-300) hover:-translate-y-0.5 hover:shadow-(--sh-md) ${
                        active
                          ? "border-(--brand) shadow-[0_0_0_3px_var(--brand-100),var(--sh-md)]"
                          : "border-(--line)"
                      }`}
                    >
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
                        <div className="text-xs text-(--ink-4) mt-1 leading-[1.45]">
                          {t.description}
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-(--line-soft) text-[11px] font-medium text-(--ink-3) tracking-[0.01em]">
                          {t.level}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
