/**
 * Top-level error surface — catches render failures (lazy-chunk load
 * errors, exceptions inside ATS panes, etc.) that would otherwise
 * unmount the whole React tree and leave a white page.
 *
 * Design matches `ConfirmDialog`: solid token surface, brand-emerald chrome, the
 * danger palette tokens already used across the ATS insights. Offers
 * the raw error + stack in a copy-able block and a one-click "Report
 * on GitHub" button with title/body prefilled from the exception so a
 * filed issue arrives with the stack already attached.
 */

import { AlertTriangle, Check, Copy, Home } from "lucide-react";
import { Component, useId, useRef, type ErrorInfo, type ReactNode } from "react";
import { useModalDialog } from "../utils/useModalDialog.ts";
import { GithubIcon } from "./GithubIcon.tsx";

const GITHUB_REPO = "cloakyard/cloakresume";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional label shown as the surface title — defaults to a generic copy. */
  title?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: "", copied: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? "" });
    console.error("[CloakResume] Unhandled render error:", error, info);
  }

  // Navigate to the app root rather than reloading the current URL — if the
  // error was triggered by a query param (e.g. ?preview-error=1) or a route,
  // a plain reload would just re-throw it.
  handleGoHome = () => {
    this.setState({ error: null, componentStack: "", copied: false });
    window.location.assign(`${window.location.origin}/`);
  };

  handleCopy = async () => {
    const payload = buildDetailsText(this.state.error, this.state.componentStack);
    try {
      await navigator.clipboard.writeText(payload);
      this.setState({ copied: true });
      window.setTimeout(() => this.setState({ copied: false }), 1800);
    } catch {
      // Clipboard denied — fall back to selection so the user can copy manually.
      const pre = document.getElementById("cr-error-details");
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  render() {
    const { error, componentStack, copied } = this.state;
    if (!error) return this.props.children;

    const details = buildDetailsText(error, componentStack);
    const issueUrl = buildGithubIssueUrl(error, componentStack);
    const title = this.props.title ?? "Something broke unexpectedly";

    return (
      <ErrorDialog
        title={title}
        details={details}
        issueUrl={issueUrl}
        copied={copied}
        onCopy={this.handleCopy}
        onGoHome={this.handleGoHome}
      />
    );
  }
}

function ErrorDialog({
  title,
  details,
  issueUrl,
  copied,
  onCopy,
  onGoHome,
}: {
  title: string;
  details: string;
  issueUrl: string;
  copied: boolean;
  onCopy: () => void;
  onGoHome: () => void;
}) {
  const homeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useModalDialog<HTMLDivElement>({
    open: true,
    onClose: onGoHome,
    initialFocusRef: homeRef,
  });

  return (
    <div
      className="cr-overlay fixed inset-0 flex items-end justify-center min-[640px]:items-center min-[640px]:p-6"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="cr-dialog cr-sheet relative flex max-h-[var(--sheet-max-block-size)] w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] min-[640px]:!w-[min(var(--dialog-max),calc(100vw-3rem))] min-[640px]:max-h-[var(--dialog-max-block-size)] min-[640px]:pb-0"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div className="shrink-0 flex items-start gap-3 sm:gap-4 px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-(--line-soft)">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-(--danger)">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="cr-dialog__eyebrow">Recovery / local session</p>
            <h2 id={titleId} className="cr-dialog__title">
              {title}
            </h2>
            <p id={descriptionId} className="cr-dialog__description">
              Your résumé data is still safe in this browser — we never uploaded it anywhere. Return
              to the app to keep editing, or send us the details below so we can fix the bug.
            </p>
          </div>
        </div>

        <div className="cr-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center justify-between gap-2 shrink-0">
            <span className="cr-dialog__eyebrow">Error details</span>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-(--line) bg-(--surface-raised) px-2 py-1 text-sm font-medium text-(--ink-3) transition-colors hover:border-(--ink-5) hover:bg-(--surface-3) hover:text-(--ink-1)"
              aria-label="Copy error details"
            >
              {copied ? (
                <>
                  <Check aria-hidden="true" className="w-3.5 h-3.5 text-(--ok)" />
                  <span aria-live="polite">Copied</span>
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre
            id="cr-error-details"
            className="m-0 font-mono text-[11.5px] leading-[1.55] text-(--ink-2) bg-(--surface-2) border border-(--line) rounded-md p-3 whitespace-pre-wrap break-words"
          >
            {details}
          </pre>
        </div>

        <div className="cr-dialog__footer flex-col-reverse items-stretch px-5 py-3 sm:flex-row sm:items-center sm:px-7 sm:py-4">
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md border border-(--line) bg-(--surface-raised) px-4 py-2 text-sm font-medium text-(--ink-2) transition-colors hover:border-(--ink-5) hover:bg-(--surface-3) sm:w-auto"
          >
            <GithubIcon aria-hidden="true" className="w-4 h-4" />
            Report on GitHub
          </a>
          <button
            ref={homeRef}
            type="button"
            onClick={onGoHome}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md bg-(--color-accent) px-4 py-2 text-sm font-semibold text-(--color-accent-ink) transition-colors hover:bg-(--brand-hover) sm:w-auto"
          >
            <Home aria-hidden="true" className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

function buildDetailsText(error: Error | null, componentStack: string): string {
  if (!error) return "";
  const parts = [
    `Message: ${error.message || "(no message)"}`,
    error.name ? `Name:    ${error.name}` : "",
    `Where:   ${window.location.pathname}${window.location.search}`,
    `When:    ${new Date().toISOString()}`,
    `Agent:   ${navigator.userAgent}`,
    "",
    "Stack:",
    error.stack ?? "(no stack)",
  ];
  if (componentStack.trim()) {
    parts.push("", "Component stack:", componentStack.trim());
  }
  return parts.filter((line) => line !== "").join("\n");
}

function buildGithubIssueUrl(error: Error | null, componentStack: string): string {
  const summary = (error?.message ?? "Unknown error").replace(/\s+/g, " ").slice(0, 110);
  const title = `[bug] ${summary}`;
  const body = [
    "## What happened",
    "_Describe what you were doing when this error appeared (e.g. opened ATS review, exported PDF)._",
    "",
    "## Error details",
    "```",
    buildDetailsText(error, componentStack),
    "```",
  ].join("\n");
  const params = new URLSearchParams({ title, body, labels: "bug" });
  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
}
