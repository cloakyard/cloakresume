/** Local reordering with a grip, keyboard alternatives and deliberate focus recovery. */
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
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { moveItem } from "../utils/arrayMove.ts";

function rows(list: HTMLElement | null) {
  return list
    ? [...list.children].filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && el.classList.contains("cr-drag-item"),
      )
    : [];
}
function restoreControl(target: HTMLElement, selection: [number, number] | null) {
  if (
    !target.isConnected ||
    (document.activeElement !== target && document.activeElement !== document.body)
  )
    return;
  target.focus({ preventScroll: true });
  if (selection && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement))
    target.setSelectionRange(...selection);
  target.scrollIntoView({ block: "nearest", inline: "nearest" });
}
interface DragListContextValue {
  dragIndex: number | null;
  overIndex: number | null;
  setDragIndex: (i: number | null) => void;
  setOverIndex: (i: number | null) => void;
  commitMove: (from: number, to: number) => void;
  remove: (index: number, onDelete: () => void) => void;
  total: number;
}
const DragListContext = createContext<DragListContextValue | null>(null);

export function DragList<T>({
  items,
  onReorder,
  children,
  className = "",
}: {
  items: readonly T[];
  onReorder: (next: T[]) => void;
  children: ReactNode;
  className?: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const commitMove = useCallback(
    (from: number, to: number) => {
      const next = moveItem(itemsRef.current, from, to);
      if (next === itemsRef.current) return;
      const before = rows(listRef.current),
        active = document.activeElement as HTMLElement;
      const restoreFocus = listRef.current?.contains(active);
      const selection: [number, number] | null =
        (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) &&
        active.selectionStart !== null
          ? [active.selectionStart, active.selectionEnd ?? active.selectionStart]
          : null;
      const label = before[from]?.dataset.entryLabel ?? `Item ${from + 1}`;
      onReorder(next as T[]);
      setAnnouncement(`${label} moved to position ${to + 1} of ${next.length}.`);
      // Every entry has a stable data/UI key, so focus follows its actual node.
      if (restoreFocus) requestAnimationFrame(() => restoreControl(active, selection));
    },
    [onReorder],
  );
  const remove = useCallback((index: number, onDelete: () => void) => {
    const row = rows(listRef.current)[index];
    const recovery = row?.closest(".resume-entry") ?? row?.closest(".resume-section-body");
    const label = row?.dataset.entryLabel ?? `Item ${index + 1}`;
    onDelete();
    setAnnouncement(`${label} removed.`);
    requestAnimationFrame(() => {
      const remaining = rows(listRef.current);
      const next = remaining[Math.min(index, remaining.length - 1)];
      const target =
        next?.querySelector<HTMLElement>('input:not([type="file"]), textarea, select') ??
        recovery?.querySelector<HTMLElement>(".resume-add-bullet, .resume-add-action");
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }, []);
  const value = useMemo(
    () => ({
      dragIndex,
      overIndex,
      setDragIndex,
      setOverIndex,
      commitMove,
      remove,
      total: items.length,
    }),
    [dragIndex, overIndex, commitMove, remove, items.length],
  );
  return (
    <DragListContext.Provider value={value}>
      <div ref={listRef} className={`resume-entry-list ${className}`}>
        {children}
        <span className="sr-only" role="status">
          {announcement}
        </span>
      </div>
    </DragListContext.Provider>
  );
}

export function DragItem({
  index,
  label,
  onDelete,
  children,
}: {
  index: number;
  label: string;
  onDelete: () => void;
  children: (handle: ReactNode, deleteBtn: ReactNode, moveBtns: ReactNode) => ReactNode;
}) {
  const ctx = useContext(DragListContext);
  if (!ctx) throw new Error("DragItem must be used inside a <DragList>.");
  const rowRef = useRef<HTMLDivElement>(null);
  const confirmationId = useId();
  const [pendingDelete, setPendingDelete] = useState(false);
  useEffect(() => {
    if (!pendingDelete) return;
    const timer = window.setTimeout(() => setPendingDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [pendingDelete]);
  const handle = (
    <button
      type="button"
      draggable
      className="air-icon-button air-button--quiet resume-drag-handle"
      aria-label={`Drag to reorder ${label}`}
      title={`Drag to reorder ${label}`}
      onDragStart={(e) => {
        e.stopPropagation();
        e.currentTarget.focus({ preventScroll: true });
        ctx.setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        const row = rowRef.current;
        if (row) {
          const rect = row.getBoundingClientRect();
          e.dataTransfer.setDragImage(row, e.clientX - rect.left, e.clientY - rect.top);
        }
        e.dataTransfer.setData("text/plain", String(index));
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        ctx.setDragIndex(null);
        ctx.setOverIndex(null);
      }}
    >
      <GripVertical size={18} strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
  const moveBtns = (
    <span className="resume-move-actions">
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-disabled={index === 0}
        aria-label={`Move up ${label}`}
        title={`Move up ${label}`}
        onClick={(e) => {
          e.currentTarget.focus({ preventScroll: true });
          if (index > 0) ctx.commitMove(index, index - 1);
        }}
      >
        <ChevronUp size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-disabled={index === ctx.total - 1}
        aria-label={`Move down ${label}`}
        title={`Move down ${label}`}
        onClick={(e) => {
          e.currentTarget.focus({ preventScroll: true });
          if (index < ctx.total - 1) ctx.commitMove(index, index + 1);
        }}
      >
        <ChevronDown size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </span>
  );
  const deleteBtn = (
    <button
      type="button"
      className={
        pendingDelete ? "air-button air-button--danger" : "air-icon-button air-button--quiet"
      }
      aria-label={pendingDelete ? `Confirm removal of ${label}` : `Remove ${label}`}
      title={pendingDelete ? `Press again to remove ${label}` : `Remove ${label}`}
      aria-describedby={pendingDelete ? confirmationId : undefined}
      onClick={(e) => {
        e.currentTarget.focus({ preventScroll: true });
        if (pendingDelete) {
          ctx.remove(index, onDelete);
          setPendingDelete(false);
        } else setPendingDelete(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setPendingDelete(false);
        }
      }}
    >
      {pendingDelete ? "Confirm" : <Trash2 size={18} strokeWidth={1.6} aria-hidden="true" />}
    </button>
  );
  return (
    <div
      ref={rowRef}
      className="cr-drag-item"
      data-entry-label={label}
      data-dragging={ctx.dragIndex === index || undefined}
      data-drop-target={
        (ctx.overIndex === index && ctx.dragIndex !== null && ctx.dragIndex !== index) || undefined
      }
      onDragOver={(e) => {
        if (ctx.dragIndex === null) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        ctx.setOverIndex(index);
      }}
      onDragLeave={(e) => {
        if (ctx.dragIndex === null) return;
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) ctx.setOverIndex(null);
      }}
      onDrop={(e) => {
        if (ctx.dragIndex === null) return;
        e.preventDefault();
        e.stopPropagation();
        ctx.commitMove(ctx.dragIndex, index);
        ctx.setDragIndex(null);
        ctx.setOverIndex(null);
      }}
    >
      {children(handle, deleteBtn, moveBtns)}
      {pendingDelete && (
        <p id={confirmationId} className="air-help resume-remove-confirm" role="status">
          Remove {label}? Activate again to confirm, or press Escape to keep it.
        </p>
      )}
    </div>
  );
}
