/**
 * Lightweight confirmation modal — a designed replacement for the
 * browser's native `window.confirm` dialog.
 *
 * Rendered via portal into `document.body` so it overlays the app
 * chrome, and traps Escape to cancel so keyboard users stay oriented.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const confirmStyles =
    tone === "danger"
      ? "bg-(--danger) hover:bg-red-700 text-white shadow-sm shadow-red-500/30"
      : "bg-(--brand) hover:bg-(--brand-hover) text-white shadow-sm shadow-(--brand)/30";

  const iconStyles =
    tone === "danger" ? "bg-(--danger-bg) text-(--danger)" : "bg-(--brand-50) text-(--brand-700)";

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-fade-in-up backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Close"
        className="absolute inset-0 bg-transparent border-0 cursor-default"
      />

      <div className="surface-glass relative w-full max-w-md rounded-2xl overflow-hidden animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center ${iconStyles} shrink-0`}
            >
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h2
                id="confirm-dialog-title"
                className="text-base font-semibold text-(--ink-1) tracking-tight"
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm text-(--ink-3) mt-1.5 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="p-1 rounded-md text-(--ink-5) hover:text-(--ink-1) hover:bg-(--ink-1)/5 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/55 border-t border-(--brand)/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-(--ink-2) bg-white border border-(--line) hover:border-(--ink-5) hover:bg-(--surface-2) transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
