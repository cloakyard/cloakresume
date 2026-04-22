/**
 * Small form field primitives reused across the editor.
 *
 * Each primitive controls its own layout but never owns state — the
 * editor passes values down and receives changes through `onChange`.
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface SectionsBulkSignal {
  /** Monotonically increments on each bulk toggle; 0 means "no bulk action yet". */
  nonce: number;
  open: boolean;
}

export const SectionsBulkContext = createContext<SectionsBulkSignal>({ nonce: 0, open: true });

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
}: TextFieldProps) {
  return (
    <label className="cr-field">
      <span className="cr-field-label">{label}</span>
      <input
        type={type}
        data-field-id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        spellCheck={type === "text"}
        className={`cr-input${invalid ? " cr-input--invalid" : ""}`}
      />
      {hint && (
        <span className={`cr-field-hint${invalid ? " cr-field-hint--error" : ""}`}>{hint}</span>
      )}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
}: SelectFieldProps) {
  const isCustom = value.length > 0 && !options.includes(value);
  return (
    <label className="cr-field">
      <span className="cr-field-label">{label}</span>
      <div className="relative">
        <select
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
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-(--ink-5)" />
      </div>
    </label>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextArea({ label, value, onChange, placeholder, rows = 5 }: TextAreaProps) {
  return (
    <label className="cr-field">
      <span className="cr-field-label">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={true}
        className="cr-input font-[inherit] resize-y"
      />
    </label>
  );
}

/**
 * `tone` is retained as a compatibility prop but the visual treatment
 * now comes from the unified design system — every section head uses
 * the ocean-blue accent so the editor reads as one calm list rather
 * than a rainbow of tinted cards.
 */
type Tone =
  | "blue"
  | "cyan"
  | "sky"
  | "violet"
  | "indigo"
  | "emerald"
  | "teal"
  | "amber"
  | "orange"
  | "rose"
  | "pink"
  | "fuchsia"
  | "slate";

interface SectionCardProps {
  title: string;
  /** One-line description shown beneath the title to contextualise the section at a glance. */
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: Tone;
}

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  defaultOpen = true,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((v) => !v);

  const bulk = useContext(SectionsBulkContext);
  useEffect(() => {
    if (bulk.nonce === 0) return;
    setOpen(bulk.open);
  }, [bulk]);
  return (
    <section className={`acc ${open ? "open" : ""}`}>
      <div className="flex items-center">
        <button type="button" onClick={toggle} className="acc-head flex-1" aria-expanded={open}>
          {icon && <span className="acc-icon">{icon}</span>}
          <div className="acc-text">
            <div className="acc-title">{title}</div>
            {description && <div className="acc-sub">{description}</div>}
          </div>
          <ChevronRight className="acc-chev w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="acc-body space-y-3">
          {action && <div className="flex justify-end -mt-1 mb-1">{action}</div>}
          {children}
        </div>
      )}
    </section>
  );
}
