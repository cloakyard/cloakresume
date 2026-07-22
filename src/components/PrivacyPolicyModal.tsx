/**
 * Privacy Policy — a lightweight modal describing how CloakResume
 * handles (or rather, doesn't handle) user data.
 *
 * Everything runs in the browser and the résumé is only persisted to
 * localStorage, so the policy is intentionally brief and concrete.
 * Matches the app's token-based design language and is portalled into
 * `document.body` so it overlays the landing screen cleanly.
 */

import { useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X } from "lucide-react";
import { useModalDialog } from "../utils/useModalDialog.ts";

const LAST_UPDATED_ISO = "2026-04-24";
const LAST_UPDATED = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(`${LAST_UPDATED_ISO}T00:00:00Z`));
const REPO_URL = "https://github.com/cloakyard/cloakresume";
const CLOAKYARD_URL = "https://github.com/cloakyard";

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
  const panelRef = useModalDialog<HTMLDivElement>({ open, onClose, initialFocusRef: closeRef });

  /* Swipe-down-to-dismiss on the handle — matches BottomSheet / AtsReviewModal.
   * Threshold is 120px of downward travel, identical to the other sheets. */
  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragDeltaRef.current = 0;
  }, []);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
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

  if (!open) return null;

  return createPortal(
    <div
      className="cr-overlay fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="cr-dialog cr-sheet relative flex max-h-[var(--sheet-max-block-size)] w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] animate-sheet-rise min-[640px]:!w-[min(var(--dialog-max),calc(100vw-3rem))] min-[640px]:max-h-[var(--dialog-max-block-size)] min-[640px]:pb-0 min-[640px]:animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        {/* Drag handle — mobile only, swipe down to dismiss. */}
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          className="sm:hidden shrink-0 grid place-items-center pt-2.5 pb-1.5 cursor-grab touch-none"
        >
          <span
            aria-hidden="true"
            className="w-11 h-1 rounded-full bg-(--ink-5)/40 transition-colors duration-160 hover:bg-(--ink-5)/60"
          />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 sm:gap-4 px-5 sm:px-7 pt-3 sm:pt-6 pb-4 border-b border-(--line-soft)">
          <span className="grid h-8 w-8 shrink-0 place-items-center text-(--brand)">
            <ShieldCheck aria-hidden="true" className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h2
              id={titleId}
              className="text-[17px] sm:text-[18px] font-semibold text-(--ink-1) tracking-[-0.01em] leading-tight"
            >
              Privacy Policy
            </h2>
            <p id={descriptionId} className="text-[12.5px] text-(--ink-4) mt-0.5">
              Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-160 hover:bg-(--ink-1)/5 hover:text-(--ink-1)"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="cr-scroll overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 sm:py-6">
          <div className="space-y-6 text-sm leading-[1.65] text-(--ink-3)">
            <Section title="Overview">
              <p>
                CloakResume is a free, open-source résumé builder that runs entirely in your web
                browser. This policy explains what data is collected (spoiler: nothing leaves your
                device) and how the application handles your information.
              </p>
            </Section>

            <Section title="Your résumé stays on your device">
              <p>
                All authoring — editing, template selection, ATS analysis, grammar checking, and PDF
                export — happens locally in your browser. Your résumé is{" "}
                <Strong>never uploaded</Strong> to any server. No content, metadata, or personal
                details are transmitted over the network.
              </p>
            </Section>

            <Section title="Local storage">
              <p>
                So your work survives between sessions, CloakResume saves your résumé, target job
                description, chosen template, document colour, paper size, and current editor
                section to your browser&apos;s{" "}
                <code className="font-mono text-[12.5px] px-1 py-0.5 rounded bg-(--surface-3) text-(--ink-2)">
                  localStorage
                </code>
                . This data stays on your device and is never sent anywhere. Clear it any time via
                your browser&apos;s settings or the “New” button in the toolbar.
              </p>
            </Section>

            <Section title="No personal data collected">
              <p>We do not collect, store, or process any personal information, including:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside marker:text-(--ink-5)">
                <li>Names, email addresses, or account details — there are no accounts</li>
                <li>IP addresses or device identifiers</li>
                <li>Usage analytics or behavioural tracking</li>
                <li>Cookies or persistent identifiers beyond the localStorage entry above</li>
              </ul>
            </Section>

            <Section title="No cookies or tracking">
              <p>
                CloakResume does not use cookies, analytics, or any third-party tracking scripts.
                The application may use your browser&apos;s cache and a Service Worker to enable
                offline use after the first visit; this data is stored only on your device.
              </p>
            </Section>

            <Section title="Third-party services">
              <p>
                CloakResume does not integrate any third-party analytics, advertising, or
                data-collection services. The application is hosted as a static site; standard
                web-server access logs (IP, requested path, timestamp) may be retained by the
                hosting provider for security and operational purposes, subject to that
                provider&apos;s own privacy policy. No résumé content is included in these logs.
              </p>
            </Section>

            <Section title="Open source">
              <p>
                CloakResume is fully open source. You can inspect the source code at{" "}
                <PolicyLink href={REPO_URL}>github.com/cloakyard/cloakresume</PolicyLink> to verify
                these claims independently. CloakResume is part of{" "}
                <PolicyLink href={CLOAKYARD_URL}>Cloakyard</PolicyLink> — a collection of
                privacy-focused open-source tools by Sumit Sahoo.
              </p>
            </Section>

            <Section title="Your rights (GDPR &amp; similar)">
              <p>
                Because we do not collect any personal data, there is nothing for us to disclose,
                correct, or delete on your behalf. If you have questions about this policy, reach
                out via <PolicyLink href={`${REPO_URL}/issues`}>GitHub Issues</PolicyLink>.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If this policy ever changes, the updated version will be published here with a
                revised date at the top. Given the privacy-by-design nature of this application,
                significant changes are unlikely.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[14px] font-semibold text-(--ink-1) tracking-[-0.005em] mb-1.5">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-(--ink-1)">{children}</strong>;
}

function PolicyLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-(--brand) font-medium hover:underline underline-offset-2"
    >
      {children}
    </a>
  );
}
