/**
 * Live writing-issue feedback on editor fields.
 *
 * The Harper grammar/spelling report is a flat list keyed by `segmentId`
 * (e.g. `experience.0.bullets.2`). This module groups those issues by
 * segment, exposes them via context, and ships a compact `FieldIssuesBadge`
 * that any field with a matching `fieldId` renders in-place. Clicking the
 * badge opens a portalled popover with each issue's kind, the offending
 * phrase, Harper's reason, and one-click replacement suggestions.
 *
 * The provider-map split means fields don't need to know whether a scan
 * has completed — they just subscribe by id and re-render when the map
 * changes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, BookOpen, SpellCheck, Sparkles, X } from "lucide-react";
import type { GrammarIssue, GrammarIssueKind, GrammarReport } from "../types.ts";
import { usePickerPosition } from "./usePickerPosition.ts";

type FieldIssuesMap = Record<string, GrammarIssue[]>;

const FieldIssuesContext = createContext<FieldIssuesMap>({});

export function FieldIssuesProvider({
  report,
  children,
}: {
  report: GrammarReport | null;
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const out: FieldIssuesMap = {};
    if (!report) return out;
    for (const issue of report.issues) {
      (out[issue.segmentId] ??= []).push(issue);
    }
    return out;
  }, [report]);
  return <FieldIssuesContext.Provider value={value}>{children}</FieldIssuesContext.Provider>;
}

export function useFieldIssues(fieldId: string | undefined): GrammarIssue[] {
  const map = useContext(FieldIssuesContext);
  if (!fieldId) return [];
  return map[fieldId] ?? [];
}

const KIND_META: Record<GrammarIssueKind, { label: string; icon: ReactNode }> = {
  spelling: { label: "Spelling", icon: <SpellCheck aria-hidden="true" /> },
  grammar: { label: "Grammar", icon: <AlertCircle aria-hidden="true" /> },
  style: { label: "Style", icon: <Sparkles aria-hidden="true" /> },
  readability: { label: "Readability", icon: <BookOpen aria-hidden="true" /> },
};

/** Optional suggestions for one field; applying preserves its existing replacement semantics. */
export function FieldIssuesBadge({
  issues,
  fieldControlId,
  onApplySuggestion,
  className,
}: {
  issues: GrammarIssue[];
  fieldControlId: string;
  /** Replace first occurrence of `actual` with `replacement` in the field value. */
  onApplySuggestion?: (actual: string, replacement: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const didFocus = useRef(false);
  const coords = usePickerPosition(open, buttonRef, popoverRef, issues);

  // An edit or re-scan invalidates the report. Do not reopen old hints when it returns.
  if (open && issues.length === 0) setOpen(false);

  const surfaceRef = useCallback(
    (node: HTMLDivElement | null) => {
      popoverRef.current = node;
      return () => {
        // A background report can remove the last hint while the popup has focus.
        if (node?.contains(document.activeElement))
          document.getElementById(fieldControlId)?.focus({ preventScroll: true });
        popoverRef.current = null;
      };
    },
    [fieldControlId],
  );

  useEffect(() => {
    if (!open) {
      didFocus.current = false;
      return;
    }
    if (!coords || didFocus.current) return;
    const frame = requestAnimationFrame(() => {
      didFocus.current = true;
      popoverRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, coords]);

  useEffect(() => {
    if (!open) return;
    function outside(event: Event) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  function closeAndReturnFocus() {
    buttonRef.current?.focus({ preventScroll: true });
    setOpen(false);
  }

  if (issues.length === 0) return null;
  const worstKind = issues.some((issue) => issue.kind === "spelling") ? "spelling" : issues[0].kind;
  const meta = KIND_META[worstKind];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.focus({ preventScroll: true });
          setOpen((value) => !value);
        }}
        aria-label={`${issues.length} writing ${issues.length === 1 ? "hint" : "hints"} — click to view`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        className={`air-icon-button air-button--quiet resume-hint-trigger ${className ?? "top-1/2 -translate-y-1/2 right-0"}`}
      >
        {meta.icon}
        <span>{issues.length}</span>
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            id={dialogId}
            ref={surfaceRef}
            data-placement={coords.placement}
            role="dialog"
            tabIndex={-1}
            aria-labelledby={`${dialogId}-title`}
            aria-describedby={`${dialogId}-description`}
            className="air-popover resume-hint-popover"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeAndReturnFocus();
              }
              if (event.key !== "Tab") return;
              const controls = [
                ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
              ];
              if (
                event.shiftKey &&
                (event.target === event.currentTarget || event.target === controls[0])
              ) {
                event.preventDefault();
                closeAndReturnFocus();
              } else if (!event.shiftKey && event.target === controls.at(-1)) {
                event.preventDefault();
                const outside = [
                  ...document.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
                  ),
                ].filter(
                  (element) =>
                    !popoverRef.current?.contains(element) &&
                    !element.closest("[inert]") &&
                    element.checkVisibility(),
                );
                (outside[outside.indexOf(buttonRef.current!) + 1] ?? buttonRef.current)?.focus();
                setOpen(false);
              }
            }}
          >
            <div className="resume-hint-heading">
              <h2 id={`${dialogId}-title`} className="air-floating-title">
                Writing hints
              </h2>
              <button
                type="button"
                className="air-icon-button air-button--quiet"
                aria-label="Close writing hints"
                onClick={closeAndReturnFocus}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <p id={`${dialogId}-description`} className="air-help">
              Suggestions are optional. Choose a replacement to update this field.
            </p>
            <ol className="resume-hint-list">
              {issues.map((issue, index) => {
                const kind = KIND_META[issue.kind];
                return (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <li key={index}>
                    <h3 className="resume-hint-kind" data-kind={issue.kind}>
                      {kind.icon}
                      {kind.label}
                    </h3>
                    <p className="resume-hint-phrase">“{issue.actual}”</p>
                    <p className="resume-hint-reason">{issue.reason}</p>
                    {issue.suggestions.length > 0 && onApplySuggestion && (
                      <div className="resume-hint-actions">
                        {issue.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="air-button"
                            aria-label={`Replace “${issue.actual}” with “${suggestion}”`}
                            onClick={() => {
                              onApplySuggestion(issue.actual, suggestion);
                              // Updating the document invalidates all report badges immediately.
                              document
                                .getElementById(fieldControlId)
                                ?.focus({ preventScroll: true });
                              setOpen(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>,
          document.body,
        )}
    </>
  );
}
