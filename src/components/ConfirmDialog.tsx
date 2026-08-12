/**
 * Lightweight confirmation modal — a designed replacement for the
 * browser's native `window.confirm` dialog.
 *
 * Rendered via portal into `document.body` so it overlays the app
 * chrome, and traps Escape to cancel so keyboard users stay oriented.
 */

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";
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
  const presence = useAnimatedPresence(open);
  const dialogRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose: onCancel,
    initialFocusRef: variant === "notice" ? confirmRef : cancelRef,
  });

  if (!presence.mounted) return null;

  const confirmStyles =
    tone === "danger"
      ? "bg-(--danger) text-(--color-accent-ink) hover:brightness-90"
      : "bg-(--color-accent) text-(--color-accent-ink) hover:bg-(--brand-hover)";

  const iconStyles = tone === "danger" ? "text-(--danger)" : "text-(--brand-700)";

  return createPortal(
    <div
      className="cr-overlay fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6"
      data-state={presence.state}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="cr-dialog cr-sheet relative flex max-h-[var(--sheet-max-block-size)] w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] min-[640px]:!w-[min(var(--dialog-max),calc(100vw-3rem))] min-[640px]:max-h-[var(--dialog-max-block-size)] min-[640px]:pb-0"
        role={variant === "notice" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center ${iconStyles}`}
            >
              <AlertTriangle aria-hidden="true" className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-(--ink-1) tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-sm text-(--ink-3) mt-1.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-160 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
            >
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-(--line) bg-(--surface-2) px-6 py-4 min-[640px]:flex-row min-[640px]:items-center">
          {variant === "confirm" ? (
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="min-h-11 rounded-md border border-(--line) bg-(--surface-raised) px-4 py-2 text-sm font-medium text-(--ink-2) transition-colors hover:border-(--ink-5) hover:bg-(--surface-3)"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
