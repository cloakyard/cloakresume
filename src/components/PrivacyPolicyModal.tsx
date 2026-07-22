/**
 * CloakResume privacy document.
 *
 * The shell keeps the shared modal lifecycle while the content uses the same
 * architecture-first hierarchy as CloakPDF: promise, document path, absent
 * routes, then the complete ruled policy.
 */

import { useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X } from "lucide-react";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";
import { useModalDialog } from "../utils/useModalDialog.ts";

const LAST_UPDATED_ISO = "2026-07-22";
const LAST_UPDATED = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(`${LAST_UPDATED_ISO}T00:00:00Z`));
const REPO_URL = "https://github.com/cloakyard/cloakresume";
const CLOAKYARD_URL = "https://github.com/cloakyard";

const DOCUMENT_PATH = [
  {
    number: "01",
    title: "Résumé content enters browser memory",
    meta: "Input / editor or local JSON",
  },
  {
    number: "02",
    title: "Browser state and Harper do the work",
    meta: "Process / this tab",
  },
  {
    number: "03",
    title: "PDF or JSON returns to your device",
    meta: "Output / browser download",
  },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ open, onClose }: Props) {
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const presence = useAnimatedPresence(open);
  const panelRef = useModalDialog<HTMLDivElement>({
    open: presence.mounted,
    onClose,
    initialFocusRef: closeRef,
  });

  const onHandleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
    dragDeltaRef.current = 0;
  }, []);

  const onHandleTouchMove = useCallback((event: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = event.touches[0].clientY - touchStartY.current;
    if (delta > 0 && panelRef.current) {
      dragDeltaRef.current = delta;
      panelRef.current.style.transform = `translateY(${delta}px)`;
      panelRef.current.style.transition = "none";
    }
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    if (!panelRef.current) return;
    panelRef.current.style.transition = "";
    if (dragDeltaRef.current > 120) {
      onClose();
    } else {
      panelRef.current.style.transform = "";
    }
    dragDeltaRef.current = 0;
  }, [onClose]);

  if (!presence.mounted) return null;

  return createPortal(
    <div
      className="cr-overlay fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6"
      data-state={presence.state}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="cr-dialog cr-dialog-wide cr-sheet cr-privacy-dialog relative flex max-h-[var(--sheet-max-block-size)] w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-sheet-rise min-[640px]:max-h-[var(--dialog-max-block-size)] min-[640px]:pb-0 min-[640px]:animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          className="cr-privacy-dialog__handle sm:hidden"
          aria-hidden="true"
        >
          <span />
        </div>

        <div className="cr-privacy-dialog__bar">
          <p>
            <ShieldCheck aria-hidden="true" />
            CloakResume / Privacy document
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="cr-privacy-dialog__close"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="cr-scroll cr-privacy-dialog__scroll">
          <section className="cr-privacy-dialog__architecture">
            <div className="cr-privacy-dialog__promise">
              <p className="cr-privacy-dialog__kicker">Privacy by architecture</p>
              <h2 id={titleId}>The privacy promise has an architecture.</h2>
              <p id={descriptionId} className="cr-privacy-dialog__lede">
                CloakResume is a static, client-side résumé workbench. Résumé and target-job content
                is processed inside this browser tab and is not sent with requests for app assets.
              </p>

              <dl className="cr-privacy-dialog__facts">
                <div>
                  <dt>Last updated</dt>
                  <dd>
                    <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
                  </dd>
                </div>
                <div>
                  <dt>Document uploads</dt>
                  <dd>None</dd>
                </div>
                <div>
                  <dt>Product analytics</dt>
                  <dd>None</dd>
                </div>
              </dl>
            </div>

            <div className="cr-privacy-dialog__path">
              <div className="cr-privacy-dialog__path-head">
                <span>Document path</span>
                <span>Verified by design</span>
              </div>
              <div className="cr-privacy-dialog__path-list">
                {DOCUMENT_PATH.map((item) => (
                  <div key={item.number} className="cr-privacy-dialog__path-row">
                    <span>{item.number}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.meta}</p>
                    </div>
                    <strong>Local</strong>
                  </div>
                ))}
              </div>

              <div className="cr-privacy-dialog__absent">
                <p>Routes not present</p>
                <div>
                  <span>Upload server — none</span>
                  <span>Required account — none</span>
                  <span>Product analytics — none</span>
                </div>
              </div>
            </div>
          </section>

          <article className="cr-privacy-policy" aria-label="Complete privacy policy">
            <PolicySection marker="01 / Local processing" title="Your résumé stays on your device">
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

            <PolicySection marker="02 / Local storage" title="Your working draft remains local">
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

            <PolicySection
              marker="03 / Data & tracking"
              title="No accounts, advertising, or analytics"
            >
              <p>
                CloakResume does not ask for a name or email address, create user profiles, set
                tracking cookies, or install third-party analytics and advertising scripts. The
                application does not intentionally collect or retain personal information about how
                you use the workbench.
              </p>
              <ul>
                <li>No account or profile database</li>
                <li>No résumé-content telemetry</li>
                <li>No advertising identifiers or behavioural tracking</li>
                <li>No cookies beyond browser-managed local app storage and cache</li>
              </ul>
            </PolicySection>

            <PolicySection marker="04 / App delivery" title="Static assets can use the network">
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

            <PolicySection
              marker="05 / Verification & rights"
              title="The implementation is inspectable"
            >
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

            <PolicySection marker="06 / Changes" title="Policy revisions remain visible">
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

function PolicySection({
  marker,
  title,
  children,
}: {
  marker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cr-privacy-policy__section">
      <p className="cr-privacy-policy__marker">{marker}</p>
      <h3>{title}</h3>
      <div className="cr-privacy-policy__copy">{children}</div>
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
