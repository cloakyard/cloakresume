/**
 * Privacy Policy — a lightweight modal describing how CloakResume
 * handles (or rather, doesn't handle) user data.
 *
 * Everything runs in the browser and the résumé is only persisted to
 * localStorage, so the policy is intentionally brief and concrete.
 * Matches the app's token-based design language and is portalled into
 * `document.body` so it overlays the landing screen cleanly.
 */

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X } from "lucide-react";

const LAST_UPDATED = "April 24, 2026";
const REPO_URL = "https://github.com/cloakyard/cloakresume";
const CLOAKYARD_URL = "https://github.com/cloakyard";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrivacyPolicy({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /* Swipe-down-to-dismiss on the handle — matches BottomSheet / AtsPanel.
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
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop animate-[fade_0.2s_ease]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-transparent border-0 cursor-default"
      />

      <div
        ref={panelRef}
        className="surface-glass relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[86vh] rounded-t-[22px] sm:rounded-2xl overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 animate-sheet-rise sm:animate-scale-in"
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
            className="w-11 h-1 rounded-full bg-(--ink-5)/40 transition-colors duration-150 hover:bg-(--ink-5)/60"
          />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 sm:gap-4 px-5 sm:px-7 pt-3 sm:pt-6 pb-4 border-b border-(--line-soft)">
          <span className="w-11 h-11 rounded-xl grid place-items-center bg-(--brand-50) text-(--brand) shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h2
              id="privacy-policy-title"
              className="text-[17px] sm:text-[18px] font-semibold text-(--ink-1) tracking-[-0.01em] leading-tight"
            >
              Privacy Policy
            </h2>
            <p className="text-[12.5px] text-(--ink-4) mt-0.5">Last updated: {LAST_UPDATED}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="w-8 h-8 rounded-lg grid place-items-center text-(--ink-4) bg-transparent cursor-pointer transition-colors duration-150 hover:bg-(--surface-3) hover:text-(--ink-1) shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="cr-scroll overflow-y-auto px-5 sm:px-7 py-5 sm:py-6">
          <div className="space-y-6 text-[13.5px] leading-[1.65] text-(--ink-3)">
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
                So your work survives between sessions, CloakResume saves your résumé, chosen
                template, colour preference, and theme to your browser&apos;s{" "}
                <code className="font-mono text-[12.5px] px-1 py-0.5 rounded bg-(--surface-3) text-(--ink-2)">
                  localStorage
                </code>
                . This data stays on your device and is never sent anywhere. Clear it any time via
                your browser&apos;s settings or the &quot;New&quot; button in the toolbar.
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
