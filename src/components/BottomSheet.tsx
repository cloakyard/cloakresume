/**
 * Reusable bottom-sheet primitive.
 *
 * Slides up from the bottom on mobile, with a dim + blur backdrop and a
 * top drag handle. Closes on Escape, backdrop click, or swipe-down on
 * the handle. Designed to be the shared container for the mobile section
 * drawer and any other bottom-anchored menus (colour picker, overflow).
 *
 * Keeps itself body-scroll-locked while open so the page behind doesn't
 * move when the user drags inside the sheet.
 */

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** If set, dismisses with a visible X button in the header row. */
  showCloseButton?: boolean;
  /** Max height as a fraction of the viewport — default 85vh. */
  maxHeight?: string;
  children: ReactNode;
  /** Optional aria-label when the sheet has no visible title. */
  ariaLabel?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  showCloseButton = true,
  maxHeight = "85vh",
  children,
  ariaLabel,
}: BottomSheetProps) {
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Body scroll lock while the sheet is visible.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragDeltaRef.current = 0;
  }, []);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      dragDeltaRef.current = delta;
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "";
    if (dragDeltaRef.current > 120) {
      onClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    dragDeltaRef.current = 0;
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-100 flex items-end justify-center backdrop animate-[fade_0.2s_ease] print:hidden"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-transparent cursor-default border-0"
      />
      <div
        ref={sheetRef}
        style={{ maxHeight }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className="surface-glass relative flex flex-col w-full rounded-t-[22px] pb-[env(safe-area-inset-bottom,0px)] animate-sheet-rise"
      >
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          className="grid place-items-center pt-2.5 pb-1.5 cursor-grab touch-none"
        >
          <span
            aria-hidden="true"
            className="w-11 h-1 rounded-full bg-(--ink-5)/40 transition-colors duration-150 hover:bg-(--ink-5)/60"
          />
        </div>

        {(title || showCloseButton) && (
          <header className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 border-b border-(--line-soft)/70 sm:px-5">
            {title && (
              <h2 className="m-0 text-[15.5px] font-semibold tracking-[-0.01em] text-(--ink-1)">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid place-items-center w-9 h-9 rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-100 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </header>
        )}

        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-5 [-webkit-overflow-scrolling:touch] cr-scroll sm:px-4">
          {children}
        </div>
      </div>
    </div>
  );
}
