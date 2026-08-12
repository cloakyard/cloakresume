/**
 * Reusable bottom-sheet primitive.
 *
 * Slides up from the bottom on mobile, with a solid dim backdrop and a
 * top drag handle. Closes on Escape, backdrop click, or swipe-down on
 * the handle. Designed to be the shared container for the mobile section
 * drawer and any other bottom-anchored menus (colour picker, overflow).
 *
 * Keeps itself body-scroll-locked while open so the page behind doesn't
 * move when the user drags inside the sheet.
 */

import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** If set, dismisses with a visible X button in the header row. */
  showCloseButton?: boolean;
  /** Max height as a fraction of the viewport — clamped to 92dvh. */
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
  maxHeight = "92dvh",
  children,
  ariaLabel,
}: BottomSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const presence = useAnimatedPresence(open);
  const sheetRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose,
    initialFocusRef: closeRef,
  });
  const swipeHandlers = useSwipeToDismiss(sheetRef, onClose);

  if (!presence.mounted) return null;

  return createPortal(
    <div
      role="presentation"
      data-state={presence.state}
      className="cr-overlay fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6 print:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        style={{ maxHeight: `min(${maxHeight}, var(--sheet-max-block-size))` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : (ariaLabel ?? "Options")}
        tabIndex={-1}
        className="cr-dialog cr-sheet relative flex w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] min-[640px]:!w-[min(var(--dialog-max),calc(100vw-3rem))] min-[640px]:pb-0"
      >
        <div
          {...swipeHandlers}
          className="grid place-items-center pt-2.5 pb-1.5 cursor-grab touch-none min-[640px]:hidden"
        >
          <span
            aria-hidden="true"
            className="w-11 h-1 rounded-full bg-(--ink-5)/40 transition-colors duration-160 hover:bg-(--ink-5)/60"
          />
        </div>

        {(title || showCloseButton) && (
          <header className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 border-b border-(--line-soft)/70 sm:px-5">
            {title && (
              <h2
                id={titleId}
                className="m-0 text-[15.5px] font-semibold tracking-[-0.01em] text-(--ink-1)"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={title ? `Close ${title.toLowerCase()}` : "Close sheet"}
                className="grid h-11 w-11 place-items-center rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-160 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            )}
          </header>
        )}

        <div className="cr-scroll flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-5 [-webkit-overflow-scrolling:touch] sm:px-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
