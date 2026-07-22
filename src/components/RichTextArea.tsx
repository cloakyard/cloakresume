/**
 * Textarea that cooperates with an ancestor `FormatScope` so a single
 * shared toolbar can apply Bold / Italic / Code to whichever textarea
 * was most recently focused. Keyboard shortcuts (⌘B / ⌘I) still work
 * when typing directly in this field.
 */

import { useCallback, useEffect, useId, useRef } from "react";
import { useFormatRegistration, useFormatScope } from "./FormatScope.tsx";
import { toggleSelection } from "../utils/richText.tsx";
import { FieldIssuesBadge, useFieldIssues } from "../utils/fieldIssues.tsx";

interface RichTextAreaProps {
  label?: string;
  /** Accessible name when the visible label is rendered outside this component. */
  ariaLabel?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Minimum rows the textarea shows even when empty. */
  rows?: number;
  compact?: boolean;
  /** Auto-grow the textarea to fit its content (default: true). */
  autoGrow?: boolean;
  /** Opt-in target for the ATS jump-to-fix glow highlight. */
  fieldId?: string;
  name?: string;
  autoComplete?: string;
  hint?: string;
  invalid?: boolean;
}

export function RichTextArea({
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  rows = 4,
  compact = false,
  autoGrow = true,
  fieldId,
  name,
  autoComplete = "off",
  hint,
  invalid = false,
}: RichTextAreaProps) {
  const reactId = useId();
  const inputId = `${reactId}-textarea`;
  const hintId = `${reactId}-hint`;
  const ref = useRef<HTMLTextAreaElement>(null);
  const scope = useFormatScope();
  const registration = useFormatRegistration(ref, onChange);
  const issues = useFieldIssues(fieldId);

  /** Replace first occurrence of `actual` with `replacement` in the field value. */
  const applySuggestion = useCallback(
    (actual: string, replacement: string) => {
      const idx = value.indexOf(actual);
      if (idx === -1) return;
      onChange(value.slice(0, idx) + replacement + value.slice(idx + actual.length));
    },
    [value, onChange],
  );

  // Refresh the stored handler every render so the toolbar always uses
  // the latest onChange closure (React recreates it each render).
  useEffect(() => {
    registration.setHandler();
  });

  // Coalesce height reads and writes into the next frame. This avoids
  // forcing layout synchronously for every keystroke while preserving
  // the auto-growing editor behaviour.
  useEffect(() => {
    if (!autoGrow) return;
    const el = ref.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
    return () => cancelAnimationFrame(frame);
  }, [value, autoGrow]);

  const applyInline = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const { value: next, start, end } = toggleSelection(el, marker);
    onChange(next);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.focus();
      ref.current.setSelectionRange(start, end);
      scope?.refreshFormat();
    });
  };

  const hasIssues = issues.length > 0;

  return (
    <div className={label ? "cr-field" : "block"}>
      {label && (
        <label className="cr-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={inputId}
          name={name ?? fieldId ?? "rich-text"}
          autoComplete={autoComplete}
          aria-label={label ? undefined : (ariaLabel ?? "Rich text")}
          aria-describedby={hint ? hintId : undefined}
          aria-invalid={invalid || undefined}
          ref={ref}
          data-field-id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={registration.onFocus}
          onBlur={registration.onBlur}
          placeholder={placeholder}
          rows={rows}
          spellCheck={true}
          className={`cr-input font-[inherit] ${compact ? "cr-input--compact" : ""} ${
            autoGrow ? "resize-none overflow-hidden" : "resize-y"
          } ${hasIssues ? "cr-input--has-issues" : ""}${invalid ? " cr-input--invalid" : ""}`}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
              e.preventDefault();
              applyInline("**");
            } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
              e.preventDefault();
              applyInline("*");
            }
          }}
        />
        <FieldIssuesBadge issues={issues} onApplySuggestion={applySuggestion} />
      </div>
      <span
        id={hintId}
        className={`cr-field-hint${invalid ? " cr-field-hint--error" : ""}${hint ? "" : " invisible"}`}
        aria-live={invalid ? "polite" : undefined}
        aria-hidden={hint ? undefined : true}
      >
        {hint || "\u00a0"}
      </span>
    </div>
  );
}
