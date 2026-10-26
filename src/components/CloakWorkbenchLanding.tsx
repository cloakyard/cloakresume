import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  FilePlus2,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { TEMPLATE_COUNT } from "../templates/meta.ts";
import { Storyline } from "./Storyline.tsx";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal.tsx";

const GITHUB_URL = "https://github.com/cloakyard/cloakresume";

interface Props {
  onStartBlank: () => void;
  onLoadSample: () => void;
  onLoadFile: (file: File) => void;
  onDismiss?: () => void;
  onResumeEditing?: () => void;
  lastSavedAt?: string;
  loading?: boolean;
}

function formatSavedAt(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "A local draft is ready";
  const elapsed = Date.parse(value) - Date.now();
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, duration, limit] of [
    ["minute", 60_000, 60],
    ["hour", 3_600_000, 24],
    ["day", 86_400_000, 7],
  ] as const) {
    const amount = Math.round(elapsed / duration);
    if (Math.abs(amount) < limit) return `Saved ${relative.format(amount, unit)}`;
  }
  return `Saved ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(Date.parse(value))}`;
}

export function CloakWorkbenchLanding({
  onStartBlank,
  onLoadSample,
  onLoadFile,
  onDismiss,
  onResumeEditing,
  lastSavedAt,
  loading = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const savedLabel = useMemo(() => formatSavedAt(lastSavedAt), [lastSavedAt]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || privacyOpen || loading) return;
      if (menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector("summary")?.focus();
      } else onDismiss?.();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onDismiss, privacyOpen, loading]);

  // The entry page owns document scrolling; editor overflow is restored on exit.
  useEffect(() => {
    const elements = [document.documentElement, document.body];
    const previous = elements.map((el) => ({
      height: el.style.height,
      overflow: el.style.overflow,
    }));
    elements.forEach((el) => {
      el.style.height = "auto";
      el.style.overflow = "visible";
    });
    return () => elements.forEach((el, i) => Object.assign(el.style, previous[i]));
  }, []);

  const activate = (event: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    // Safari does not focus a pointer-activated button by default. Remember the
    // actual opener so modal dismissal returns to the same action in every engine.
    event.currentTarget.focus({ preventScroll: true });
    action();
  };
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(event.currentTarget.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if (menuRef.current) menuRef.current.open = false;
    if (location.hash !== event.currentTarget.hash)
      history.pushState(null, "", event.currentTarget.hash);
    target.scrollIntoView();
    target.focus({ preventScroll: true });
  };
  const navigation = (
    <>
      <a href="#start" onClick={navigate}>
        Get started
      </a>
      <a href="#features" onClick={navigate}>
        Features
      </a>
      <a href="#privacy" onClick={navigate}>
        Privacy
      </a>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer">
        Source <ArrowUpRight aria-hidden="true" />
      </a>
    </>
  );

  return (
    <div className="resume-site">
      <a
        className="resume-skip air-button air-button--primary"
        href="#main-content"
        onClick={navigate}
      >
        Skip to content
      </a>
      <header className="air-page-header resume-header resume-frame">
        <a
          className="air-page-brand resume-brand"
          href={import.meta.env.BASE_URL}
          aria-label="CloakResume home"
        >
          <img
            src={`${import.meta.env.BASE_URL}cloakresume-mark.svg`}
            alt=""
            className="air-page-mark"
            width="36"
            height="36"
          />
          <span translate="no">CloakResume</span>
        </a>
        <nav className="air-page-nav resume-nav" aria-label="Primary navigation">
          {navigation}
        </nav>
        <details className="resume-menu" ref={menuRef}>
          <summary className="air-button air-button--quiet">
            Menu <ChevronDown aria-hidden="true" />
          </summary>
          <nav
            className="air-page-nav"
            aria-label="Compact navigation"
            onClick={(event) => {
              if ((event.target as Element).closest("a") && menuRef.current?.open) {
                menuRef.current.open = false;
                menuRef.current.querySelector("summary")?.focus({ preventScroll: true });
              }
            }}
          >
            {navigation}
          </nav>
        </details>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="resume-hero resume-frame" aria-labelledby="landing-title">
          <h1 id="landing-title">
            Your story.
            <br />
            <span>Taking shape.</span>
          </h1>
          <p>
            Build, tailor and export your résumé in your browser. Your draft and job description
            stay on your device.
          </p>
          {onResumeEditing && (
            <div className="resume-continue">
              <button
                type="button"
                className="air-button air-button--primary"
                disabled={loading}
                onClick={onResumeEditing}
              >
                Resume editing <ArrowRight aria-hidden="true" />
              </button>
              <span>{savedLabel}</span>
            </div>
          )}
          {!onResumeEditing && (
            <div className="resume-hero-actions">
              <button
                type="button"
                className="air-button air-button--primary"
                disabled={loading}
                onClick={(event) => activate(event, onStartBlank)}
              >
                Start blank <ArrowRight aria-hidden="true" />
              </button>
              <a className="air-button air-button--quiet" href="#start" onClick={navigate}>
                Explore options <ArrowRight aria-hidden="true" />
              </a>
            </div>
          )}
          <Storyline />
        </section>
        <section
          id="start"
          className="resume-start resume-frame"
          tabIndex={-1}
          aria-labelledby="start-title"
        >
          <h2 id="start-title">Start with what you have.</h2>
          <div className="resume-start-options">
            <div>
              <FilePlus2 aria-hidden="true" />
              <h3>A fresh page</h3>
              <p>Make room for your experience, skills and the work you’re proud of.</p>
              <button
                className="air-button air-button--primary"
                disabled={loading}
                onClick={(event) => activate(event, onStartBlank)}
              >
                Start blank <ArrowRight aria-hidden="true" />
              </button>
            </div>
            <div>
              <Sparkles aria-hidden="true" />
              <h3>A little inspiration</h3>
              <p>Explore a complete sample, then make the content and layout your own.</p>
              <button
                className="air-button"
                disabled={loading}
                onClick={(event) => activate(event, onLoadSample)}
              >
                Load sample
              </button>
            </div>
            <div>
              <FolderOpen aria-hidden="true" />
              <h3>Your saved file</h3>
              <p>
                Bring a CloakResume JSON file back into the editor and pick up where you left off.
              </p>
              <button
                className="air-button"
                disabled={loading}
                aria-busy={loading}
                onClick={(event) => activate(event, () => fileRef.current?.click())}
              >
                {loading ? "Opening file…" : "Load saved file"}
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            name="resume-file"
            accept=".json,application/json"
            aria-label="Choose a saved CloakResume JSON file"
            disabled={loading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) onLoadFile(file);
            }}
          />
        </section>
        <section
          id="features"
          className="resume-features resume-frame"
          tabIndex={-1}
          aria-labelledby="features-title"
        >
          <h2 id="features-title">From first draft to ready to send.</h2>
          <div>
            <article>
              <h3>Find the right shape</h3>
              <p>
                Choose from {TEMPLATE_COUNT} templates, set your colour, and preview every page in
                A4 or Letter.
              </p>
            </article>
            <article>
              <h3>Write for the role</h3>
              <p>
                Compare your draft with a job description. Local writing checks and keyword review
                help you spot what to improve.
              </p>
              <p className="resume-note">
                Review scores are guidance, not a guarantee of hiring-system success.
              </p>
            </article>
            <article>
              <h3>Keep a copy</h3>
              <p>
                Export a PDF to share and a JSON file to edit again. Browser-saved drafts make it
                easy to return on this device.
              </p>
            </article>
          </div>
        </section>
        <section
          id="privacy"
          className="resume-privacy resume-frame"
          tabIndex={-1}
          aria-labelledby="privacy-title"
        >
          <h2 id="privacy-title">
            Personal work.
            <br />
            Kept personal.
          </h2>
          <div>
            <p>
              Editing, writing review and export happen on your device. No account, document uploads
              or product analytics.
            </p>
            <p>
              App and language assets may download when needed. Keep a JSON copy of important work;
              browser storage can be cleared.
            </p>
            <button
              className="air-button"
              onClick={(event) => activate(event, () => setPrivacyOpen(true))}
            >
              Read the privacy policy <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
      <footer className="air-page-footer resume-footer resume-frame">
        <p>
          <span translate="no">CloakResume v{__APP_VERSION__}</span>
          <br />
          Built by{" "}
          <a href="https://github.com/sumitsahoo" target="_blank" rel="noreferrer">
            Sumit Sahoo
          </a>
        </p>
        <nav aria-label="Footer">
          <button onClick={(event) => activate(event, () => setPrivacyOpen(true))}>
            Privacy policy
          </button>
          <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            MIT licensed
          </a>
          <a href="https://cloakyard.com" target="_blank" rel="noreferrer">
            Cloakyard <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
      </footer>
      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}
