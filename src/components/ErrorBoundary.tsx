/**
 * Top-level error surface — catches render failures (lazy-chunk load
 * errors, exceptions inside ATS panes, etc.) that would otherwise
 * unmount the whole React tree and leave a white page.
 *
 * Design matches `ConfirmDialog`: glass surface, ocean-blue chrome, the
 * danger palette tokens already used across the ATS insights. Offers
 * the raw error + stack in a copy-able block and a one-click "Report
 * on GitHub" button with title/body prefilled from the exception so a
 * filed issue arrives with the stack already attached.
 */

import { AlertTriangle, Check, Copy, Home } from "lucide-react";
import { Component, createRef, type ErrorInfo, type ReactNode } from "react";
import { GithubIcon } from "./GithubIcon.tsx";

const GITHUB_REPO = "sumitsahoo/cloakresume";

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
  private homeRef = createRef<HTMLButtonElement>();

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? "" });
    console.error("[CloakResume] Unhandled render error:", error, info);
  }

  componentDidUpdate(_: ErrorBoundaryProps, prev: ErrorBoundaryState) {
    if (!prev.error && this.state.error) {
      this.homeRef.current?.focus();
    }
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
      <div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 animate-[fade_0.2s_ease] backdrop"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cr-error-title"
      >
        <div className="surface-glass relative w-full sm:w-[min(920px,100%)] min-[900px]:w-[min(1100px,100%)] max-h-[92svh] sm:max-h-[min(820px,calc(100svh-48px))] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 animate-sheet-rise sm:animate-scale-in">
          <div className="shrink-0 flex items-start gap-3 sm:gap-4 px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-(--line-soft)">
            <span className="w-11 h-11 rounded-xl grid place-items-center bg-(--danger-bg) text-(--danger) shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h2
                id="cr-error-title"
                className="text-[17px] sm:text-[18px] font-semibold text-(--ink-1) tracking-[-0.01em] leading-tight"
              >
                {title}
              </h2>
              <p className="text-[12.5px] sm:text-[13px] text-(--ink-3) mt-1 leading-[1.5]">
                Your résumé data is still safe in this browser — we never uploaded it anywhere.
                Reload to keep editing, or send us the details below so we can fix the bug.
              </p>
            </div>
          </div>

          <div className="cr-scroll overflow-y-auto px-5 sm:px-7 py-4 sm:py-5 flex-1 min-h-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] uppercase text-(--ink-5)">
                Error details
              </span>
              <button
                type="button"
                onClick={this.handleCopy}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-medium text-(--ink-3) bg-(--surface-raised) border border-(--line) hover:border-(--ink-5) hover:bg-(--surface-3) hover:text-(--ink-1) transition-colors"
                aria-label="Copy error details"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-(--ok)" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre
              id="cr-error-details"
              className="m-0 font-mono text-[11.5px] leading-[1.55] text-(--ink-2) bg-(--surface-2) border border-(--line) rounded-lg p-3 whitespace-pre-wrap break-words"
            >
              {details}
            </pre>
          </div>

          <div className="shrink-0 px-5 sm:px-7 py-3 sm:py-4 bg-(--surface-2)/55 border-t border-(--brand)/10 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <a
              href={issueUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-(--ink-2) bg-(--surface-raised) border border-(--line) hover:border-(--ink-5) hover:bg-(--surface-3) transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              Report on GitHub
            </a>
            <button
              ref={this.homeRef}
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-(--brand) hover:bg-(--brand-hover) shadow-sm shadow-(--brand)/30 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to home
            </button>
          </div>
        </div>
      </div>
    );
  }
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
