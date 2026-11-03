import { useAirPresence } from "../../docs/air/presence.tsx";
import { PrivacySections } from "../../docs/air/privacy.tsx";
import { privacySections } from "./PrivacyPolicy.tsx";
import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { useSwipeToDismiss } from "../utils/useSwipeToDismiss.ts";

const LAST_UPDATED_ISO = "2026-07-22";
const LAST_UPDATED = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(`${LAST_UPDATED_ISO}T00:00:00Z`));

export function PrivacyPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const presence = useAirPresence(open);
  const panelRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose: open ? onClose : undefined,
    initialFocusRef: closeRef,
    inertBackground: true,
  });
  const swipeHandlers = useSwipeToDismiss(panelRef, onClose);
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
      className="air-presence-viewport air-modal-viewport resume-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div data-air-backdrop className="air-presence-backdrop" aria-hidden="true" />
      <div
        data-air-surface
        ref={panelRef}
        className="air-modal resume-policy"
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
          <h2 id={titleId}>Privacy policy</h2>
          <button
            ref={closeRef}
            className="air-icon-button air-button--quiet air-dismiss"
            onClick={onClose}
            aria-label="Close privacy policy"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="air-scroll resume-policy-body">
          <p id={descriptionId}>
            Your résumé and target job description stay on your device. App and language assets may
            download when needed.
          </p>
          <p className="resume-policy-date">
            Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
          </p>
          <article className="air-prose" aria-label="Complete privacy policy">
            <PrivacySections sections={privacySections} heading="h3" />
          </article>
        </div>
      </div>
    </div>,
    document.body,
  );
}
