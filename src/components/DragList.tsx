/**
 * Drag-and-drop reordering primitives.
 *
 * <DragList> owns the drag/over state for a list of items and wires
 * each <DragItem> child so that grabbing its handle moves the item to
 * wherever it's dropped. Uses HTML5 drag-and-drop — no external lib.
 *
 * Only the grip is draggable. The row itself is the drop target, so
 * text selection inside inputs keeps working normally. Up/down arrow
 * buttons are exposed separately from the grip so sections can place
 * the drag handle on the left and the tap-to-nudge arrows on the right
 * — useful on touch devices where drag across a scrolling viewport is
 * awkward.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { moveItem } from "../utils/arrayMove.ts";

interface DragListContextValue {
  dragIndex: number | null;
  overIndex: number | null;
  setDragIndex: (i: number | null) => void;
  setOverIndex: (i: number | null) => void;
  commitMove: (from: number, to: number) => void;
  total: number;
}

const DragListContext = createContext<DragListContextValue | null>(null);

interface DragListProps<T> {
  items: readonly T[];
  onReorder: (next: T[]) => void;
  children: ReactNode;
}

export function DragList<T>({ items, onReorder, children }: DragListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Keep a live ref to the latest items so `commitMove` isn't stale
  // during a drag gesture (which can outlive a single render).
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const commitMove = useCallback(
    (from: number, to: number) => {
      const next = moveItem(itemsRef.current, from, to);
      if (next !== itemsRef.current) onReorder(next as T[]);
    },
    [onReorder],
  );

  const value = useMemo<DragListContextValue>(
    () => ({ dragIndex, overIndex, setDragIndex, setOverIndex, commitMove, total: items.length }),
    [dragIndex, overIndex, commitMove, items.length],
  );

  return <DragListContext.Provider value={value}>{children}</DragListContext.Provider>;
}

function useDragList() {
  const ctx = useContext(DragListContext);
  if (!ctx) throw new Error("DragItem must be used inside a <DragList>.");
  return ctx;
}

interface DragItemProps {
  index: number;
  onDelete: () => void;
  /**
   * Caller-provided wrapper so the item renders with its own border/layout.
   * `handle` is the draggable grip, `deleteBtn` is the trash button, and
   * `moveBtns` is a separate up/down tap cluster — sections typically put
   * `handle` on the left and `moveBtns` near the delete button on the right.
   */
  children: (handle: ReactNode, deleteBtn: ReactNode, moveBtns: ReactNode) => ReactNode;
  /** Smaller grip + delete — for bullet rows inside a larger card. */
  compact?: boolean;
  /** Stack up/down as a vertical column — pairs well with a vertical delete to free horizontal content width. */
  stackMoves?: boolean;
}

/**
 * DragItem renders via a render-prop so the caller decides how the
 * handle and delete button are placed inside their row. That avoids
 * forcing a uniform chrome on every list item.
 */
export function DragItem({
  index,
  onDelete,
  children,
  compact = false,
  stackMoves = false,
}: DragItemProps) {
  const ctx = useDragList();
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = ctx.dragIndex === index;
  const isOver = ctx.overIndex === index && ctx.dragIndex !== null && ctx.dragIndex !== index;

  const handleSize = compact ? "p-1" : "p-1.5";
  const iconSize = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  const arrowIconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const arrowBtnClass = `${handleSize} inline-flex items-center justify-center rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400`;
  const isFirst = index === 0;
  const isLast = index === ctx.total - 1;

  const handle = (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        ctx.setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Use the whole row as the drag image so users see the card they're
        // moving, not just the grip handle.
        const row = rowRef.current;
        if (row) {
          const rect = row.getBoundingClientRect();
          e.dataTransfer.setDragImage(row, e.clientX - rect.left, e.clientY - rect.top);
        }
        try {
          e.dataTransfer.setData("text/plain", String(index));
        } catch {
          // Some browsers require some data to be set — ignore failures.
        }
      }}
      onDragEnd={() => {
        ctx.setDragIndex(null);
        ctx.setOverIndex(null);
      }}
      title="Drag to reorder"
      aria-label="Drag to reorder"
      className={`${handleSize} inline-flex items-center justify-center rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-colors select-none`}
    >
      <GripVertical className={iconSize} />
    </button>
  );

  const moveBtns = (
    <span
      className={
        stackMoves ? "inline-flex flex-col items-center gap-0" : "inline-flex items-center gap-0.5"
      }
    >
      <button
        type="button"
        onClick={() => ctx.commitMove(index, index - 1)}
        disabled={isFirst}
        aria-label="Move up"
        title="Move up"
        className={arrowBtnClass}
      >
        <ChevronUp className={arrowIconSize} />
      </button>
      <button
        type="button"
        onClick={() => ctx.commitMove(index, index + 1)}
        disabled={isLast}
        aria-label="Move down"
        title="Move down"
        className={arrowBtnClass}
      >
        <ChevronDown className={arrowIconSize} />
      </button>
    </span>
  );

  const deleteBtn = (
    <button
      type="button"
      onClick={onDelete}
      aria-label="Remove"
      className={`${handleSize} inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors`}
    >
      <Trash2 className={iconSize} />
    </button>
  );

  return (
    <div
      ref={rowRef}
      onDragOver={(e) => {
        if (ctx.dragIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (ctx.overIndex !== index) ctx.setOverIndex(index);
      }}
      onDragLeave={() => {
        if (ctx.overIndex === index) ctx.setOverIndex(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (ctx.dragIndex !== null && ctx.dragIndex !== index) {
          ctx.commitMove(ctx.dragIndex, index);
        }
        ctx.setDragIndex(null);
        ctx.setOverIndex(null);
      }}
      className={`transition-all ${
        isDragging ? "opacity-40" : ""
      } ${isOver ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-slate-50 rounded-lg" : ""}`}
    >
      {children(handle, deleteBtn, moveBtns)}
    </div>
  );
}
