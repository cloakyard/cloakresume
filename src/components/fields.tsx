/**
 * Small form field primitives reused across the editor.
 *
 * Each primitive controls its own layout but never owns state — the
 * editor passes values down and receives changes through `onChange`.
 */

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { FieldIssuesBadge, useFieldIssues } from "../utils/fieldIssues.tsx";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  /** Render the red error border + hint row below the input. */
  invalid?: boolean;
  /** Helper or error text shown under the input. Turns red when `invalid`. */
  hint?: string;
  /** Opt-in target for the ATS jump-to-fix glow highlight. */
  fieldId?: string;
  /** Stable browser/form identifier. Falls back to `fieldId` or a label slug. */
  name?: string;
  /** Browser autofill hint. Obvious identity fields are inferred; other fields opt out. */
  autoComplete?: string;
}

function fieldName(label: string, explicit?: string) {
  return (
    explicit ??
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function inferredAutoComplete(label: string, type: TextFieldProps["type"] = "text") {
  if (type === "email") return "email";
  if (type === "tel") return "tel";
  if (type === "url") return "url";
  const normalized = label.toLowerCase();
  if (normalized.includes("full name")) return "name";
  if (normalized === "location" || normalized.includes("city")) return "address-level2";
  return "off";
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  invalid = false,
  hint,
  fieldId,
  name,
  autoComplete,
}: TextFieldProps) {
  const reactId = useId();
  const inputId = `${reactId}-input`;
  const hintId = `${reactId}-hint`;
  const issues = useFieldIssues(fieldId);
  const hasIssues = issues.length > 0 && !invalid;
  const applySuggestion = useCallback(
    (actual: string, replacement: string) => {
      const idx = value.indexOf(actual);
      if (idx === -1) return;
      onChange(value.slice(0, idx) + replacement + value.slice(idx + actual.length));
    },
    [value, onChange],
  );
  return (
    <div className="cr-field">
      <label className="cr-field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={fieldName(label, name ?? fieldId)}
          autoComplete={autoComplete ?? inferredAutoComplete(label, type)}
          type={type}
          data-field-id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          spellCheck={type === "text"}
          className={`cr-input${invalid ? " cr-input--invalid" : ""}${hasIssues ? " cr-input--has-issues" : ""}`}
        />
        <FieldIssuesBadge
          issues={hasIssues ? issues : []}
          onApplySuggestion={applySuggestion}
          className="top-1/2 -translate-y-1/2 right-2"
        />
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

interface CsvFieldProps {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
}

/**
 * Comma-separated input that keeps a local raw string so the user can
 * freely type leading/trailing/intermediate commas and spaces while the
 * parsed array is published upstream on every change.
 */
export function CsvField({
  label,
  value,
  onChange,
  placeholder,
  name,
  autoComplete = "off",
}: CsvFieldProps) {
  const inputId = `${useId()}-input`;
  const [raw, setRaw] = useState(() => value.join(", "));

  useEffect(() => {
    const parsed = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const same = parsed.length === value.length && parsed.every((s, i) => s === value[i]);
    if (!same) setRaw(value.join(", "));
  }, [value, raw]);

  return (
    <div className="cr-field">
      <label className="cr-field-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        name={fieldName(label, name)}
        autoComplete={autoComplete}
        type="text"
        value={raw}
        placeholder={placeholder}
        spellCheck={true}
        className="cr-input"
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          onChange(
            next
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  name?: string;
  autoComplete?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  name,
  autoComplete = "off",
}: SelectFieldProps) {
  const inputId = `${useId()}-select`;
  const isCustom = value.length > 0 && !options.includes(value);
  return (
    <div className="cr-field">
      <label className="cr-field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <select
          id={inputId}
          name={fieldName(label, name)}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`cr-input appearance-none pr-9 cursor-pointer ${
            value ? "" : "text-(--ink-5)"
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {isCustom && <option value={value}>{value}</option>}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-(--ink-5)"
        />
      </div>
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  name?: string;
  autoComplete?: string;
  hint?: string;
  invalid?: boolean;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  name,
  autoComplete = "off",
  hint,
  invalid = false,
}: TextAreaProps) {
  const reactId = useId();
  const inputId = `${reactId}-textarea`;
  const hintId = `${reactId}-hint`;
  return (
    <div className="cr-field">
      <label className="cr-field-label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        name={fieldName(label, name)}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={true}
        aria-invalid={invalid || undefined}
        aria-describedby={hint ? hintId : undefined}
        className={`cr-input font-[inherit] resize-y${invalid ? " cr-input--invalid" : ""}`}
      />
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
