import { useAirPresence } from "../../docs/air/presence.tsx";
/** Air sheet for the compact toolbar's frequent commands. */
import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";

export function OptionsDialog({
  open,
  instant = false,
  id,
  onClose,
  children,
}: {
  open: boolean;
  instant?: boolean;
  id: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const presence = useAirPresence(open, instant ? "none" : "dialog");
  const dialogRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose: open ? onClose : undefined,
    initialFocusRef: closeRef,
    inertBackground: true,
    fallbackFocus: () =>
      document.querySelector<HTMLButtonElement>(
        'button[aria-label="More options"], button[data-export-pdf]',
      ),
  });
  const swipe = useSwipeToDismiss(dialogRef, onClose);
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
      className="air-presence-viewport air-modal-viewport resume-options-viewport"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div data-air-backdrop className="air-presence-backdrop" aria-hidden="true" />
      <div
        data-air-surface
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
