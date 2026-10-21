/**
 * Top-level error surface — catches render failures (lazy-chunk load
 * errors, exceptions inside ATS panes, etc.) that would otherwise
 * unmount the whole React tree and leave a white page.
 *
 * Uses the shared Air recovery surface. Offers
 * the raw error + stack in a copy-able block and a one-click "Report
 * on GitHub" button with title/body prefilled from the exception so a
 * filed issue arrives with the stack already attached.
 */

import { Check, Copy, Home } from "lucide-react";
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
    window.location.assign(import.meta.env.BASE_URL);
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
    inertBackground: true,
    initialFocusRef: homeRef,
  });

  return (
    <div className="air-modal-viewport resume-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="air-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div className="resume-dialog-heading">
          <h2 id={titleId}>{title}</h2>
        </div>
        <p id={descriptionId}>
          Return to the app to reopen your last browser-saved draft. Recent unsaved changes may be
          missing. You can review and copy the error details before reporting a problem.
        </p>
        <div className="resume-dialog-actions">
          <a href={issueUrl} target="_blank" rel="noreferrer noopener" className="air-button">
            <GithubIcon aria-hidden="true" />
            Report on GitHub
          </a>
          <button
            ref={homeRef}
            type="button"
            onClick={onGoHome}
            className="air-button air-button--primary"
          >
            <Home aria-hidden="true" />
            Go Home
          </button>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="air-button"
          aria-label="Copy error details"
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy error details"}</span>
        </button>
        <pre id="cr-error-details" className="resume-error-details">
          {details}
        </pre>
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
