import { useAirPresence } from "../../docs/air/presence.tsx";
/** Keep dismissal and focus available while the review's lazy content loads. */
import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";

export function AtsReviewDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const presence = useAirPresence(open);
  const dialogRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose: open ? onClose : undefined,
    initialFocusRef: closeRef,
    inertBackground: true,
    fallbackFocus: () =>
      document.querySelector<HTMLButtonElement>(
        'button[aria-label="Scan résumé for ATS and writing issues"], button[aria-label="More options"]',
      ),
  });
  const swipeHandlers = useSwipeToDismiss(dialogRef, onClose);
  if (!presence.mounted) return null;
  return createPortal(
    <div
      ref={presence.ref}
      onClickCapture={(event) => {
        if (!open) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      className="air-presence-viewport air-modal-viewport resume-review-viewport"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div data-air-backdrop className="air-presence-backdrop" aria-hidden="true" />
      <div
        data-air-surface
        ref={dialogRef}
        className="air-modal resume-review"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div {...swipeHandlers} className="resume-sheet-handle" aria-hidden="true">
          <span />
        </div>
        <div className="resume-dialog-heading">
          <h2 id={titleId}>Résumé review</h2>
          <button
            ref={closeRef}
            type="button"
            className="air-icon-button air-button--quiet air-dismiss"
            onClick={onClose}
            aria-label="Close ATS review"
          >
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
        <p id={descriptionId} className="sr-only">
          Local feedback on structure, keywords and writing. Scores are guidance; actual
          hiring-system results may differ.
        </p>
        {children}
      </div>
    </div>,
    document.body,
  );
}
