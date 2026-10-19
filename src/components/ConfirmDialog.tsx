/**
 * Lightweight confirmation modal — a designed replacement for the
 * browser's native `window.confirm` dialog.
 *
 * Rendered via portal into `document.body` so it overlays the app
 * chrome, and traps Escape to cancel so keyboard users stay oriented.
 */

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useModalDialog } from "../utils/useModalDialog.ts";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "confirm" | "notice";
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "confirm",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useModalDialog<HTMLDivElement>({
    open,
    onClose: onCancel,
    inertBackground: true,
    initialFocusRef: variant === "notice" ? confirmRef : cancelRef,
  });

  if (!open) return null;

  return createPortal(
    <div
      className="air-modal-viewport resume-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="air-modal"
        role={variant === "notice" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="resume-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            className="air-icon-button air-button--quiet"
            onClick={onCancel}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {description && <p id={descriptionId}>{description}</p>}
        <div className="resume-dialog-actions">
          {variant === "confirm" && (
            <button ref={cancelRef} onClick={onCancel} className="air-button">
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`air-button ${tone === "danger" && variant === "confirm" ? "air-button--danger" : "air-button--primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
