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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, BookOpen, SpellCheck, Sparkles } from "lucide-react";
import type { GrammarIssue, GrammarIssueKind, GrammarReport } from "../types.ts";
import { useAnimatedPresence } from "./useAnimatedPresence.ts";

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

interface KindMeta {
  label: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
}

const KIND_META: Record<GrammarIssueKind, KindMeta> = {
  spelling: {
    label: "Spelling",
    icon: <SpellCheck className="w-3 h-3" />,
    color: "var(--color-status-danger)",
    bg: "var(--color-status-danger-soft)",
    border: "var(--color-status-danger)",
  },
  grammar: {
    label: "Grammar",
    icon: <AlertCircle className="w-3 h-3" />,
    color: "var(--color-status-warning)",
    bg: "var(--color-status-warning-soft)",
    border: "var(--color-status-warning)",
  },
  style: {
    label: "Style",
    icon: <Sparkles className="w-3 h-3" />,
    color: "var(--color-status-warning)",
    bg: "var(--color-status-warning-soft)",
    border: "var(--color-status-warning)",
  },
  readability: {
    label: "Readability",
    icon: <BookOpen className="w-3 h-3" />,
    color: "var(--color-status-warning)",
    bg: "var(--color-status-warning-soft)",
    border: "var(--color-status-warning)",
  },
};

const POPOVER_W = 320;
const POPOVER_H_EST = 260;
const SAFE_EDGE = 16;
const POPOVER_GAP = 6;

type PopoverPlacement = "above" | "below";

/**
 * Field-level writing-issue chip. Sits inside the field frame (absolute,
 * top-right) and pops a portalled popover with a per-issue list on click.
 *
 * Returns `null` when `issues` is empty so callers can unconditionally
 * drop it into their markup. Spelling beats grammar beats style when
 * choosing the chip's tint so the worst category dominates.
 */
export function FieldIssuesBadge({
  issues,
  onApplySuggestion,
  className,
}: {
  issues: GrammarIssue[];
  /** Replace first occurrence of `actual` with `replacement` in the field value. */
  onApplySuggestion?: (actual: string, replacement: string) => void;
  /** Extra positioning classes; defaults to top-right inside a relative parent. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const presence = useAnimatedPresence(open);
  const dialogId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const didFocusPopoverRef = useRef(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: PopoverPlacement;
  } | null>(null);

  const updateCoords = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportRight = viewportLeft + viewportWidth;
    const width = Math.min(POPOVER_W, Math.max(0, viewportWidth - SAFE_EDGE * 2));
    const safeTop = viewportTop + SAFE_EDGE;
    const safeBottom = viewportBottom - SAFE_EDGE;
    const belowTop = Math.max(safeTop, Math.min(rect.bottom + POPOVER_GAP, safeBottom));
    const aboveBottom = Math.max(safeTop, Math.min(rect.top - POPOVER_GAP, safeBottom));
    const availableBelow = Math.max(0, safeBottom - belowTop);
    const availableAbove = Math.max(0, aboveBottom - safeTop);
    const placement: PopoverPlacement =
      availableBelow < POPOVER_H_EST && availableAbove > availableBelow ? "above" : "below";
    const top = placement === "above" ? aboveBottom : belowTop;
    const minLeft = viewportLeft + SAFE_EDGE;
    const maxLeft = Math.max(minLeft, viewportRight - width - SAFE_EDGE);
    const left = Math.max(minLeft, Math.min(rect.right - width, maxLeft));
    const maxHeight = placement === "above" ? availableAbove : availableBelow;
    setCoords({ top, left, width, maxHeight, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    window.visualViewport?.addEventListener("resize", updateCoords);
    window.visualViewport?.addEventListener("scroll", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
      window.visualViewport?.removeEventListener("resize", updateCoords);
      window.visualViewport?.removeEventListener("scroll", updateCoords);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !coords || didFocusPopoverRef.current) return;
    didFocusPopoverRef.current = true;
    requestAnimationFrame(() => popoverRef.current?.focus());
  }, [open, coords]);

  useEffect(() => {
    if (!open) didFocusPopoverRef.current = false;
  }, [open]);

  if (issues.length === 0) return null;
  const worstKind: GrammarIssueKind = issues.some((i) => i.kind === "spelling")
    ? "spelling"
    : issues[0].kind;
  const meta = KIND_META[worstKind];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`${issues.length} writing ${issues.length === 1 ? "hint" : "hints"} — click to view`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        className={`absolute z-10 min-w-11 min-h-11 md:min-w-10 md:min-h-10 grid place-items-center border-0 bg-transparent p-0 ${
          className ?? "top-1/2 -translate-y-1/2 right-0"
        }`}
      >
        <span
          className="inline-flex items-center gap-1 min-h-5 px-1.5 rounded-md border text-[10.5px] font-semibold tabular-nums leading-none"
          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
        >
          {meta.icon}
          <span className="font-mono">{issues.length}</span>
        </span>
      </button>
      {presence.mounted &&
        coords &&
        createPortal(
          <div
            id={dialogId}
            ref={popoverRef}
            data-state={presence.state}
            data-placement={coords.placement}
            data-align="end"
            data-positioning="offset"
            role="dialog"
            tabIndex={-1}
            aria-label="Writing hints"
            className="cr-popover popover fixed overscroll-contain"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-(--ink-4)">
                {issues.length} writing {issues.length === 1 ? "hint" : "hints"}
              </span>
              <span className="font-mono text-[10.5px] text-(--ink-5)">Esc to close</span>
            </div>
            <div className="-mx-0.5 divide-y divide-(--line) px-0.5">
              {issues.map((issue, i) => {
                const im = KIND_META[issue.kind];
                return (
                  <div
                    // oxlint-disable-next-line jsx/no-array-index-key
                    key={i}
                    className="py-2.5 first:pt-2 last:pb-0"
                  >
                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-mono font-semibold uppercase tracking-[0.06em] border shrink-0"
                        style={{ color: im.color, background: im.bg, borderColor: im.border }}
                      >
                        {im.icon}
                        {im.label}
                      </span>
                      <span
                        className="font-mono text-[11.5px] text-(--ink-1) font-semibold truncate"
                        title={issue.actual}
                      >
                        &ldquo;{issue.actual}&rdquo;
                      </span>
                    </div>
                    <div className="text-sm leading-[1.5] text-(--ink-2)">{issue.reason}</div>
                    {issue.suggestions.length > 0 && onApplySuggestion && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {issue.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              onApplySuggestion(issue.actual, s);
                              setOpen(false);
                              requestAnimationFrame(() => buttonRef.current?.focus());
                            }}
                            className="inline-flex min-h-11 items-center rounded-md border border-(--brand-100) bg-(--brand-50) px-2 text-sm font-semibold text-(--brand) transition-colors hover:bg-(--brand-100) md:min-h-10"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
