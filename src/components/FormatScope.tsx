/**
 * Shared formatting scope.
 *
 * A `FormatScope` provider wires a set of textareas to a single visible
 * `FormatToolbar`. Each textarea registers itself on focus, and toolbar
 * clicks wrap the selection in the registered textarea — so a card
 * containing many textareas (e.g. a Role with several bullets) shows
 * one clean toolbar rather than one per field.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Bold, Code2, Italic } from "lucide-react";
import { formatStateAt, toggleSelection } from "../utils/richText.tsx";

type Handler = (next: string) => void;

interface FormatState {
  bold: boolean;
  italic: boolean;
  code: boolean;
}

const EMPTY_FORMAT: FormatState = { bold: false, italic: false, code: false };

interface FormatScopeContextValue {
  activeRef: MutableRefObject<HTMLTextAreaElement | null>;
  handlers: MutableRefObject<Map<HTMLTextAreaElement, Handler>>;
  hasActive: boolean;
  setHasActive: (v: boolean) => void;
  format: FormatState;
  refreshFormat: () => void;
}

const FormatScopeContext = createContext<FormatScopeContextValue | null>(null);

export function FormatScope({ children }: { children: ReactNode }) {
  const activeRef = useRef<HTMLTextAreaElement | null>(null);
  const handlers = useRef(new Map<HTMLTextAreaElement, Handler>());
  const [hasActive, setHasActive] = useState(false);
  const [format, setFormat] = useState<FormatState>(EMPTY_FORMAT);

  const refreshFormat = useCallback(() => {
    const el = activeRef.current;
    if (!el) {
      setFormat((prev) => (prev === EMPTY_FORMAT ? prev : EMPTY_FORMAT));
      return;
    }
    const next = formatStateAt(el.value, el.selectionStart);
    setFormat((prev) =>
      prev.bold === next.bold && prev.italic === next.italic && prev.code === next.code
        ? prev
        : next,
    );
  }, []);

  // Keep the highlight in sync with the caret as the user moves through
  // the active textarea. `selectionchange` fires for keyboard + mouse +
  // programmatic selection updates, which is exactly what we want.
  useEffect(() => {
    const onSelChange = () => {
      const el = activeRef.current;
      if (!el || document.activeElement !== el) return;
      refreshFormat();
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, [refreshFormat]);

  const value = useMemo(
    () => ({ activeRef, handlers, hasActive, setHasActive, format, refreshFormat }),
    [hasActive, format, refreshFormat],
  );
  return <FormatScopeContext.Provider value={value}>{children}</FormatScopeContext.Provider>;
}

export function useFormatScope() {
  return useContext(FormatScopeContext);
}

/**
 * Hook used by RichTextArea to hook its textarea ref and change handler
 * into the nearest FormatScope so that a single toolbar can drive it.
 */
export function useFormatRegistration(
  ref: MutableRefObject<HTMLTextAreaElement | null>,
  onChange: Handler,
) {
  const scope = useFormatScope();
  const setHandler = useCallback(() => {
    if (!scope || !ref.current) return;
    scope.handlers.current.set(ref.current, onChange);
  }, [scope, ref, onChange]);

  const onFocus = useCallback(() => {
    if (!scope || !ref.current) return;
    scope.activeRef.current = ref.current;
    scope.handlers.current.set(ref.current, onChange);
    scope.setHasActive(true);
    scope.refreshFormat();
  }, [scope, ref, onChange]);

  const onBlur = useCallback(() => {
    // Keep activeRef set so toolbar clicks still apply. Only clear
    // if focus moved to another textarea — handled by the next
    // onFocus.
  }, []);

  return { onFocus, onBlur, setHandler };
}

/**
 * Single format toolbar shared by every RichTextArea in its FormatScope.
 *
 * Rendered as three subtle icon buttons — no pill container, no shadow —
 * so the toolbar sits beside the field label without visually competing
 * with it.
 */
export function FormatToolbar({ compact = false }: { compact?: boolean }) {
  const scope = useFormatScope();

  const apply = (marker: string) => {
    if (!scope) return;
    const el = scope.activeRef.current;
    if (!el) return;
    const handler = scope.handlers.current.get(el);
    if (!handler) return;
    const { value, start, end } = toggleSelection(el, marker);
    handler(value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, end);
      scope.refreshFormat();
    });
  };

  const disabled = !scope?.hasActive;
  const size = compact ? "w-6 h-6" : "w-7 h-7";
  const icon = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const format = scope?.format ?? EMPTY_FORMAT;

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="inline-flex items-center gap-0.5"
      // preventDefault keeps the textarea's selection intact on button click
      onMouseDown={(e) => e.preventDefault()}
    >
      <FmtBtn
        label="Bold (⌘B)"
        onClick={() => apply("**")}
        disabled={disabled}
        active={format.bold}
        size={size}
      >
        <Bold className={icon} strokeWidth={2.5} />
      </FmtBtn>
      <FmtBtn
        label="Italic (⌘I)"
        onClick={() => apply("*")}
        disabled={disabled}
        active={format.italic}
        size={size}
      >
        <Italic className={icon} strokeWidth={2.5} />
      </FmtBtn>
      <FmtBtn
        label="Code"
        onClick={() => apply("`")}
        disabled={disabled}
        active={format.code}
        size={size}
      >
        <Code2 className={icon} strokeWidth={2.5} />
      </FmtBtn>
    </div>
  );
}

function FmtBtn({
  children,
  onClick,
  label,
  disabled,
  active,
  size,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
  size: string;
}) {
  const stateClasses = disabled
    ? "text-(--ink-6) cursor-not-allowed"
    : active
      ? "text-(--brand) bg-(--brand-50) cursor-pointer"
      : "text-(--ink-4) hover:text-(--brand) hover:bg-(--brand-50) cursor-pointer";
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active ? true : undefined}
      disabled={disabled}
      className={`${size} rounded-md flex items-center justify-center transition-colors ${stateClasses}`}
    >
      {children}
    </button>
  );
}
