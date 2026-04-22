/**
 * Textarea that cooperates with an ancestor `FormatScope` so a single
 * shared toolbar can apply Bold / Italic / Code to whichever textarea
 * was most recently focused. Keyboard shortcuts (⌘B / ⌘I) still work
 * when typing directly in this field.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFormatRegistration, useFormatScope } from "./FormatScope.tsx";
import { toggleSelection } from "../utils/richText.tsx";

interface RichTextAreaProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Minimum rows the textarea shows even when empty. */
  rows?: number;
  compact?: boolean;
  /** Auto-grow the textarea to fit its content (default: true). */
  autoGrow?: boolean;
}

export function RichTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  compact = false,
  autoGrow = true,
}: RichTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const scope = useFormatScope();
  const registration = useFormatRegistration(ref, onChange);

  // Refresh the stored handler every render so the toolbar always uses
  // the latest onChange closure (React recreates it each render).
  useEffect(() => {
    registration.setHandler();
  });

  // Grow the textarea to fit its content so long bullets / summaries
  // don't clip behind a scrollbar. Runs synchronously with layout to
  // avoid a one-frame flash before the new height applies. `value`
  // is read so the effect re-runs on every keystroke.
  useLayoutEffect(() => {
    if (!autoGrow) return;
    const el = ref.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    value;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
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

  return (
    <label className={label ? "cr-field" : "block"}>
      {label && <span className="cr-field-label">{label}</span>}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={registration.onFocus}
        onBlur={registration.onBlur}
        placeholder={placeholder}
        rows={rows}
        spellCheck={true}
        className={`cr-input font-[inherit] ${compact ? "cr-input--compact" : ""} ${
          autoGrow ? "resize-none overflow-hidden" : "resize-y"
        }`}
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
    </label>
  );
}
