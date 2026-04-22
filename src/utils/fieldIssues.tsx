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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, BookOpen, SpellCheck, Sparkles } from "lucide-react";
import type { GrammarIssue, GrammarIssueKind, GrammarReport } from "../types.ts";

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
    color: "var(--danger)",
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
  },
  grammar: {
    label: "Grammar",
    icon: <AlertCircle className="w-3 h-3" />,
    color: "var(--warn)",
    bg: "var(--warn-bg)",
    border: "var(--warn-border)",
  },
  style: {
    label: "Style",
    icon: <Sparkles className="w-3 h-3" />,
    color: "var(--warn)",
    bg: "var(--warn-bg)",
    border: "var(--warn-border)",
  },
  readability: {
    label: "Readability",
    icon: <BookOpen className="w-3 h-3" />,
    color: "var(--warn)",
    bg: "var(--warn-bg)",
    border: "var(--warn-border)",
  },
};

const POPOVER_W = 320;
const POPOVER_H_EST = 260;

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const updateCoords = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vpH = window.innerHeight;
    const vpW = window.innerWidth;
    const below = vpH - rect.bottom;
    const flip = below < POPOVER_H_EST + 12 && rect.top > below;
    const top = flip ? Math.max(8, rect.top - POPOVER_H_EST - 6) : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.right - POPOVER_W, vpW - POPOVER_W - 8));
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
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
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
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
        className={`absolute z-10 inline-flex items-center gap-1 h-5 px-1.5 rounded-md border text-[10.5px] font-semibold tabular-nums leading-none shadow-(--sh-xs) transition-transform hover:scale-[1.04] active:scale-95 ${
          className ?? "top-1.5 right-1.5"
        }`}
        style={{
          color: meta.color,
          background: meta.bg,
          borderColor: meta.border,
        }}
      >
        {meta.icon}
        <span className="font-mono">{issues.length}</span>
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Writing hints"
            className="popover fixed z-80 animate-scale-in"
            style={{ top: coords.top, left: coords.left, width: POPOVER_W }}
          >
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-(--ink-4)">
                {issues.length} writing {issues.length === 1 ? "hint" : "hints"}
              </span>
              <span className="text-[11px] text-(--ink-5)">Esc to close</span>
            </div>
            <div className="max-h-[240px] overflow-y-auto cr-scroll -mx-0.5 px-0.5 space-y-2">
              {issues.map((issue, i) => {
                const im = KIND_META[issue.kind];
                return (
                  <div
                    // oxlint-disable-next-line jsx/no-array-index-key
                    key={i}
                    className="rounded-lg border bg-white/60 p-2"
                    style={{ borderColor: "var(--line)" }}
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
                    <div className="text-[12px] text-(--ink-2) leading-snug">{issue.reason}</div>
                    {issue.suggestions.length > 0 && onApplySuggestion && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {issue.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              onApplySuggestion(issue.actual, s);
                              setOpen(false);
                            }}
                            className="inline-flex items-center h-5 px-1.5 rounded text-[11px] font-semibold text-(--brand) bg-(--brand-50) border border-(--brand-100) hover:bg-(--brand-100) transition-colors"
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
