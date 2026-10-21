import { X } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "../utils/useMediaQuery.ts";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { usePickerPosition } from "../utils/usePickerPosition.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";
import { ColorPickerContent } from "./ColorPickerContent.tsx";

/** One immediate Air surface for desktop and the compact toolbar handoff. */
export function ColorPickerPopover({
  id,
  primary,
  onChange,
  onClose,
  triggerRef,
  modal = false,
}: {
  id: string;
  primary: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  modal?: boolean;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const brightnessRef = useRef<HTMLInputElement>(null);
  const didFocus = useRef(false);
  const coarse = useMediaQuery("(pointer: coarse)");
  const coords = usePickerPosition(true, triggerRef, surfaceRef, primary);
  const swipeHandlers = useSwipeToDismiss(surfaceRef, onClose);
  useModalDialog({
    open: modal && !!coords,
    onClose,
    dialogRef: surfaceRef,
    initialFocusRef: coarse ? surfaceRef : brightnessRef,
    inertBackground: true,
  });

  useEffect(() => {
    if (!coords || modal || didFocus.current) return;
    const frame = requestAnimationFrame(() => {
      didFocus.current = true;
      (coarse ? surfaceRef.current : brightnessRef.current)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [coords, coarse, modal]);

  useEffect(() => {
    if (modal) return;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!surfaceRef.current?.contains(target) && !triggerRef.current?.contains(target)) onClose();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [modal, onClose, triggerRef]);

  const closeAndReturn = () => {
    onClose();
    triggerRef.current?.focus({ preventScroll: true });
  };
  if (!coords) return null;
  return createPortal(
    <div
      className={modal ? "resume-colour-scrim" : undefined}
      onPointerDown={(event) => {
        if (modal && event.target === event.currentTarget) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div
        id={id}
        ref={surfaceRef}
        role="dialog"
        aria-label="Primary colour"
        aria-modal={modal || undefined}
        tabIndex={-1}
        className="air-popover resume-colour-picker"
        data-placement={coords.placement}
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
          maxHeight: coords.maxHeight,
        }}
        onKeyDown={(event) => {
          if (modal) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeAndReturn();
          }
          if (event.key !== "Tab") return;
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              "button, input, summary, [tabindex='0']",
            ),
          ].filter(
            (element) =>
              element.checkVisibility() && getComputedStyle(element).visibility !== "hidden",
          );
          if (
            event.shiftKey &&
            (event.target === controls[0] || event.target === event.currentTarget)
          ) {
            event.preventDefault();
            closeAndReturn();
          } else if (!event.shiftKey && event.target === controls.at(-1)) {
            event.preventDefault();
            const outside = [
              ...document.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
              ),
            ].filter(
              (element) =>
                !surfaceRef.current?.contains(element) &&
                !element.closest("[inert]") &&
                element.getClientRects().length,
            );
            onClose();
            (outside[outside.indexOf(triggerRef.current!) + 1] ?? triggerRef.current)?.focus();
          }
        }}
      >
        {modal && (
          <div
            {...swipeHandlers}
            onLostPointerCapture={swipeHandlers.onPointerCancel}
            className="resume-colour-drag"
            aria-hidden="true"
          >
            <span />
          </div>
        )}
        <div className="resume-colour-heading">
          <h2 className="air-floating-title">Primary colour</h2>
          <button
            className="air-icon-button air-button--quiet"
            type="button"
            aria-label="Close primary colour"
            onClick={closeAndReturn}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <ColorPickerContent primary={primary} onChange={onChange} brightnessRef={brightnessRef} />
      </div>
    </div>,
    document.body,
  );
}
