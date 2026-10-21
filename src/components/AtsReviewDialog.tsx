/** Keep dismissal and focus available while the review's lazy content loads. */
import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";

export function AtsReviewDialog({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog<HTMLDivElement>({
    open: true,
    onClose,
    initialFocusRef: closeRef,
    inertBackground: true,
    fallbackFocus: () =>
      document.querySelector<HTMLButtonElement>(
        'button[aria-label="Scan résumé for ATS and writing issues"], button[aria-label="More options"]',
      ),
  });
  const swipeHandlers = useSwipeToDismiss(dialogRef, onClose);
  return createPortal(
    <div
      className="air-modal-viewport resume-review-viewport"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
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
            className="air-icon-button air-button--quiet"
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
