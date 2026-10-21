/** Immediate Air sheet for the compact toolbar's frequent commands. */
import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";

export function OptionsDialog({
  id,
  onClose,
  children,
}: {
  id: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog<HTMLDivElement>({
    open: true,
    onClose,
    initialFocusRef: closeRef,
    inertBackground: true,
    fallbackFocus: () =>
      document.querySelector<HTMLButtonElement>(
        'button[aria-label="More options"], button[data-export-pdf]',
      ),
  });
  const swipe = useSwipeToDismiss(dialogRef, onClose);
  return createPortal(
    <div
      className="air-modal-viewport resume-options-viewport"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        id={id}
        className="air-modal resume-options"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div
          {...swipe}
          onLostPointerCapture={swipe.onPointerCancel}
          className="resume-sheet-handle"
          aria-hidden="true"
        >
          <span />
        </div>
        <div className="resume-dialog-heading">
          <h2 id={titleId}>Options</h2>
          <button
            ref={closeRef}
            type="button"
            className="air-icon-button air-button--quiet"
            onClick={onClose}
            aria-label="Close options"
          >
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
        <div className="resume-options-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
