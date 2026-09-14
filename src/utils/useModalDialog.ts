import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "details > summary:first-of-type",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const activeDialogs: symbol[] = [];

let scrollLockDepth = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

function lockBodyScroll(): () => void {
  if (scrollLockDepth === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      const computedPadding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${computedPadding + scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
  }
  scrollLockDepth += 1;

  return () => {
    scrollLockDepth = Math.max(0, scrollLockDepth - 1);
    if (scrollLockDepth === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
    }
  };
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      const style = getComputedStyle(element);
      return (
        !element.closest("[inert]") &&
        !element.closest('[aria-hidden="true"]') &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getClientRects().length > 0
      );
    },
  );
}

interface ModalDialogOptions<T extends HTMLElement> {
  open: boolean;
  onClose?: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  dialogRef?: RefObject<T | null>;
}

/**
 * Shared modal lifecycle for every CloakResume dialog and sheet.
 *
 * Keeps focus inside the surface, moves it to the intended first control,
 * restores the opener on close, dismisses with Escape, and safely composes
 * body-scroll locks when one dialog briefly opens another.
 */
export function useModalDialog<T extends HTMLElement = HTMLDivElement>({
  open,
  onClose,
  initialFocusRef,
  dialogRef: providedDialogRef,
}: ModalDialogOptions<T>): RefObject<T | null> {
  const internalDialogRef = useRef<T>(null);
  const dialogRef = providedDialogRef ?? internalDialogRef;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const dialogToken = Symbol("modal");
    activeDialogs.push(dialogToken);
    const isTopDialog = () => activeDialogs.at(-1) === dialogToken;
    const dialogElement = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlockBodyScroll = lockBodyScroll();
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog || !isTopDialog()) return;
      const target = initialFocusRef?.current ?? getFocusableElements(dialog)[0] ?? dialog;
      target.focus({ preventScroll: true });
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || !isTopDialog()) return;

      if (event.key === "Escape" && onCloseRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      const wasTopDialog = isTopDialog();
      const index = activeDialogs.indexOf(dialogToken);
      if (index !== -1) activeDialogs.splice(index, 1);
      unlockBodyScroll();
      // A closing overlay already allows pointer interaction with the editor.
      // Preserve a field the user deliberately focused during that exit instead
      // of sending subsequent keystrokes back to the dialog's opener.
      const active = document.activeElement;
      const restoreFocus = !active || active === document.body || dialogElement?.contains(active);
      if (wasTopDialog && restoreFocus && previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [dialogRef, initialFocusRef, open]);

  return dialogRef;
}
