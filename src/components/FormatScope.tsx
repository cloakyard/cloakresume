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
import { Bold, Code2, Italic, Underline } from "lucide-react";
import { formatStateAt, toggleSelection } from "../utils/richText.tsx";

type Handler = (next: string) => void;

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  code: boolean;
}

const EMPTY_FORMAT: FormatState = { bold: false, italic: false, underline: false, code: false };

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
    const next = formatStateAt(el.value, el.selectionStart, el.selectionEnd);
    setFormat((prev) =>
      prev.bold === next.bold &&
      prev.italic === next.italic &&
      prev.underline === next.underline &&
      prev.code === next.code
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
  const handlers = scope?.handlers;
  const activeRef = scope?.activeRef;
  const setHasActive = scope?.setHasActive;

  // Refresh the closure without leaving removed fields in the scope's registry.
  useEffect(() => {
    const el = ref.current;
    if (!handlers || !el) return;
    handlers.current.set(el, onChange);
    return () => {
      handlers.current.delete(el);
    };
  }, [handlers, ref, onChange]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (activeRef?.current === el) {
        activeRef.current = null;
        setHasActive?.(false);
      }
    };
  }, [activeRef, ref, setHasActive]);

  const onFocus = useCallback(() => {
    if (!scope || !ref.current) return;
    scope.activeRef.current = ref.current;
    scope.handlers.current.set(ref.current, onChange);
    scope.setHasActive(true);
    scope.refreshFormat();
  }, [scope, ref, onChange]);

  return { onFocus };
}

/**
 * Single format toolbar shared by every RichTextArea in its FormatScope.
 *
 * Rendered as four subtle icon buttons — no pill container, no shadow —
 * so the toolbar sits beside the field label without visually competing
 * with it.
 */
export function FormatToolbar() {
  const scope = useFormatScope();

  const apply = (marker: string) => {
    if (!scope) return;
    const el = scope.activeRef.current;
    if (!el?.isConnected) return;
    const handler = scope.handlers.current.get(el);
    if (!handler) return;
    const { value, start, end } = toggleSelection(el, marker);
    handler(value);
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
      el.setSelectionRange(start, end);
      scope.refreshFormat();
    });
  };

  const disabled = !scope?.hasActive;
  const format = scope?.format ?? EMPTY_FORMAT;

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="resume-format-toolbar"
      // preventDefault keeps the textarea's selection intact on button click
      onMouseDown={(e) => e.preventDefault()}
    >
      <FmtBtn
        label="Bold (⌘B)"
        onClick={() => apply("**")}
        disabled={disabled}
        active={format.bold}
      >
        <Bold size={18} strokeWidth={1.6} aria-hidden="true" />
      </FmtBtn>
      <FmtBtn
        label="Italic (⌘I)"
        onClick={() => apply("*")}
        disabled={disabled}
        active={format.italic}
      >
        <Italic size={18} strokeWidth={1.6} aria-hidden="true" />
      </FmtBtn>
      <FmtBtn
        label="Underline (⌘U)"
        onClick={() => apply("<u>")}
        disabled={disabled}
        active={format.underline}
      >
        <Underline size={18} strokeWidth={1.6} aria-hidden="true" />
      </FmtBtn>
      <FmtBtn label="Code" onClick={() => apply("`")} disabled={disabled} active={format.code}>
        <Code2 size={18} strokeWidth={1.6} aria-hidden="true" />
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
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active ?? false}
      disabled={disabled}
      className="air-icon-button air-button--quiet"
    >
      {children}
    </button>
  );
}
