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
const REPO_URL = "https://github.com/cloakyard/cloakresume";
const CLOAKYARD_URL = "https://cloakyard.com";

export function PrivacyPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useModalDialog<HTMLDivElement>({
    open,
    onClose,
    initialFocusRef: closeRef,
    inertBackground: true,
  });
  const swipeHandlers = useSwipeToDismiss(panelRef, onClose);
  if (!open) return null;
  return createPortal(
    <div
      className="air-modal-viewport resume-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
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
            className="air-icon-button air-button--quiet"
            onClick={onClose}
            aria-label="Close privacy policy"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="resume-policy-body">
          <p id={descriptionId}>
            Your résumé and target job description stay on your device. App and language assets may
            download when needed.
          </p>
          <p className="resume-policy-date">
            Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
          </p>
          <article className="air-prose" aria-label="Complete privacy policy">
            <PolicySection title="Your résumé stays on your device">
              <p>
                Editing, template selection, ATS analysis, spelling and grammar checks, and PDF
                export run inside this browser tab. Your résumé bytes, target job description,
                document metadata, and edits are not sent to a CloakResume upload service because no
                file-upload route exists.
              </p>
              <p>
                Results are created in browser memory and offered back to you as a PDF or a
                versioned <code>.cloakresume.json</code> browser download.
              </p>
            </PolicySection>

            <PolicySection title="Your working draft remains local">
              <p>
                CloakResume stores your résumé, target job description, chosen template, document
                colour, paper size, and current editor section in your browser’s local storage so
                work can survive between sessions on this device.
              </p>
              <p>
                This data is never sent anywhere by CloakResume. Clear it through your browser’s
                site-data settings or start a new document from the toolbar.
              </p>
            </PolicySection>

            <PolicySection title="No accounts, advertising, or analytics">
              <p>
                CloakResume does not ask for a name or email address, create user profiles, set
                tracking cookies, or install third-party analytics and advertising scripts. The
                application does not intentionally collect or retain personal information about how
                you use the editor.
              </p>
              <ul>
                <li>No account or profile database</li>
                <li>No résumé-content telemetry</li>
                <li>No advertising identifiers or behavioural tracking</li>
                <li>No cookies beyond browser-managed local app storage and cache</li>
              </ul>
            </PolicySection>

            <PolicySection title="Static assets can use the network">
              <p>
                The browser can download CloakResume’s code, fonts, and local language-tooling
                assets when the app needs them. A Service Worker may cache those static assets for
                later use. Résumé content and job-description text are not attached to those
                requests.
              </p>
              <p>
                The application is hosted as a static site. The hosting provider may retain standard
                access logs—such as IP address, requested path, and timestamp—for security and
                operations under its own privacy policy. Those requests do not contain résumé
                content.
              </p>
            </PolicySection>

            <PolicySection title="The implementation is inspectable">
              <p>
                Inspect the source at <PolicyLink href={REPO_URL}>CloakResume on GitHub</PolicyLink>
                . CloakResume is part of <PolicyLink href={CLOAKYARD_URL}>Cloakyard</PolicyLink>, a
                family of privacy-focused open-source tools by Sumit Sahoo.
              </p>
              <p>
                Because CloakResume does not collect personal data, there is nothing for us to
                disclose, correct, or delete on your behalf. Ask a policy question through{" "}
                <PolicyLink href={`${REPO_URL}/issues`}>GitHub Issues</PolicyLink>.
              </p>
            </PolicySection>

            <PolicySection title="Policy revisions remain visible">
              <p>
                If this policy changes, the revised version and date will appear in this document.
                The privacy architecture—local processing, no required account, and no product
                analytics—remains the product contract.
              </p>
            </PolicySection>
          </article>
        </div>
      </div>
    </div>,
    document.body,
  );
}
function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function PolicyLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
