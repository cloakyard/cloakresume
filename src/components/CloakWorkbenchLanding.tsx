/**
 * CloakResume's public workbench.
 *
 * The composition deliberately mirrors the CloakPDF family grammar:
 * an editorial declaration, a real product instrument, an operational
 * capability ledger, and a dark local-processing receipt. The emerald
 * accent remains CloakResume's own product signature.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  FileJson,
  FilePlus2,
  FileText,
  FolderOpen,
  LockKeyhole,
  Scale,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  SpellCheck2,
} from "lucide-react";
import { TEMPLATE_COUNT } from "../templates/meta.ts";
import { BrandLogo } from "./BrandLogo.tsx";
import { GithubIcon } from "./GithubIcon.tsx";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal.tsx";

const GITHUB_URL = "https://github.com/cloakyard/cloakresume";
const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;
const CLOAKYARD_URL = "https://cloakyard.com";
const AUTHOR_URL = "https://github.com/sumitsahoo";

interface Props {
  onStartBlank: () => void;
  onLoadSample: () => void;
  onLoadFile: (file: File) => void;
  onDismiss?: () => void;
  onResumeEditing?: () => void;
  lastSavedAt?: string;
}

const CAPABILITIES = [
  {
    index: "01",
    title: "Build",
    summary: "Structure the story before styling the page.",
    items: [
      ["Section editor", "Profile, experience, education, skills and nine more sections"],
      ["Template system", `${TEMPLATE_COUNT} live layouts with A4 and Letter preview`],
      ["Document controls", "Colour, typography, order and content stay editable"],
    ],
  },
  {
    index: "02",
    title: "Tailor",
    summary: "Check the résumé against the role without sending it away.",
    items: [
      ["ATS review", "Keyword coverage, structure signals and concrete next actions"],
      ["Job description", "Keep the target role beside the draft while you work"],
      ["Writing checks", "Local spelling and grammar analysis with Harper"],
    ],
  },
  {
    index: "03",
    title: "Carry",
    summary: "Keep a portable copy of the work and its output.",
    items: [
      ["PDF export", "Download a print-ready résumé directly from the browser"],
      ["JSON save", "Move the editable source between browsers or devices"],
      ["Local draft", "Return to the latest browser-saved version without an account"],
    ],
  },
] as const;

function formatSavedAt(value?: string) {
  if (!value) return "A local draft is ready";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "A local draft is ready";

  const elapsed = timestamp - Date.now();
  const minutes = Math.round(elapsed / 60_000);
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return `Saved ${relative.format(minutes, "minute")}`;
  const hours = Math.round(elapsed / 3_600_000);
  if (Math.abs(hours) < 24) return `Saved ${relative.format(hours, "hour")}`;
  const days = Math.round(elapsed / 86_400_000);
  if (Math.abs(days) < 7) return `Saved ${relative.format(days, "day")}`;
  return `Saved ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(timestamp)}`;
}

function ResumeInstrumentPreview() {
  return (
    <div className="cr-resume-proof" aria-label="Example résumé document preview">
      <div className="cr-resume-proof__rail">
        <span>LIVE PREVIEW</span>
        <span>A4 · 01</span>
      </div>
      <div className="cr-resume-proof__paper">
        <div className="cr-resume-proof__identity">
          <span>Jordan Lee</span>
          <small>PRODUCT DESIGNER</small>
        </div>
        <div className="cr-resume-proof__contact">
          Bengaluru · jordan@example.com · portfolio.dev
        </div>
        <div className="cr-resume-proof__rule" aria-hidden="true" />
        <div className="cr-resume-proof__section">
          <small>EXPERIENCE</small>
          <div>
            <strong>Lead Product Designer</strong>
            <span>2022—NOW</span>
          </div>
          <p>Led a design-system migration across three product teams.</p>
          <p>Improved task completion while reducing duplicated UI.</p>
        </div>
        <div className="cr-resume-proof__section">
          <small>SELECTED WORK</small>
          <div>
            <strong>Private document tools</strong>
            <span>CASE STUDY</span>
          </div>
          <p>Browser-native workflows with no server-side document handling.</p>
        </div>
        <div className="cr-resume-proof__skills">
          <span>Research</span>
          <span>Systems</span>
          <span>Prototyping</span>
        </div>
      </div>
    </div>
  );
}

export function CloakWorkbenchLanding({
  onStartBlank,
  onLoadSample,
  onLoadFile,
  onDismiss,
  onResumeEditing,
  lastSavedAt,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const savedLabel = useMemo(() => formatSavedAt(lastSavedAt), [lastSavedAt]);

  useEffect(() => {
    if (!onDismiss) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !privacyOpen) onDismiss();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onDismiss, privacyOpen]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlHeight: html.style.height,
      htmlOverflow: html.style.overflow,
      bodyHeight: body.style.height,
      bodyOverflow: body.style.overflow,
    };
    html.style.height = "auto";
    html.style.overflow = "visible";
    body.style.height = "auto";
    body.style.overflow = "visible";
    return () => {
      html.style.height = previous.htmlHeight;
      html.style.overflow = previous.htmlOverflow;
      body.style.height = previous.bodyHeight;
      body.style.overflow = previous.bodyOverflow;
    };
  }, []);

  const chooseFile = () => fileRef.current?.click();

  return (
    <div className="cr-family-landing">
      <a className="cr-skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="cr-marketing-header">
        <div className="cr-frame cr-marketing-header__grid">
          <BrandLogo />
          <nav className="cr-marketing-nav" aria-label="Primary navigation">
            <a href="#start">Start</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <a className="cr-source-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GithubIcon className="cr-source-link__github" />
            <span>Source</span>
            <span className="cr-motion-icon" aria-hidden="true">
              <ArrowUpRight />
            </span>
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="cr-landing-hero cr-frame" aria-labelledby="landing-title">
          <div className="cr-landing-hero__declaration">
            <p className="cr-kicker">PRIVATE RÉSUMÉ WORKBENCH</p>
            <h1 id="landing-title">
              A complete résumé workbench. Nothing <span>uploaded.</span>
            </h1>
          </div>
          <div className="cr-landing-hero__brief">
            <p>
              Build, tailor and export a serious résumé inside one browser tab. Your draft, target
              role and writing checks stay on your device.
            </p>
            <div className="cr-hero-actions">
              {onResumeEditing ? (
                <button
                  type="button"
                  className="cr-button cr-button--primary"
                  onClick={onResumeEditing}
                >
                  Resume editing
                  <span className="cr-motion-icon" aria-hidden="true">
                    <ArrowRight />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="cr-button cr-button--primary"
                  onClick={onStartBlank}
                >
                  Start a résumé
                  <span className="cr-motion-icon" aria-hidden="true">
                    <ArrowRight />
                  </span>
                </button>
              )}
              <a className="cr-text-link" href="#start">
                See the workflow
              </a>
            </div>
          </div>
        </section>

        <section id="start" className="cr-frame cr-start-instrument" aria-labelledby="start-title">
          <div className="cr-instrument-status">
            <span>
              <i aria-hidden="true" /> LOCAL WORKSPACE
            </span>
            <span>NO ACCOUNT · NO UPLOAD</span>
          </div>
          <div className="cr-instrument-grid">
            <ol className="cr-process-rail" aria-label="Résumé workflow">
              <li>
                <span>01</span>
                <div>
                  <strong>Draft</strong>
                  <small>Structure the evidence</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Tailor</strong>
                  <small>Compare against the role</small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Export</strong>
                  <small>Keep PDF and source</small>
                </div>
              </li>
            </ol>

            <div className="cr-start-workspace">
              <div className="cr-start-copy">
                <p className="cr-kicker">START / CONTINUE</p>
                <h2 id="start-title">Begin with the right amount of structure.</h2>
                <p>
                  Open an empty editor, inspect a complete sample, or load a portable CloakResume
                  file. Every path enters the same private workspace.
                </p>

                <div className="cr-start-actions">
                  {onResumeEditing && (
                    <button
                      type="button"
                      className="cr-start-action cr-start-action--featured"
                      onClick={onResumeEditing}
                    >
                      <span className="cr-start-action__icon">
                        <FileText aria-hidden="true" />
                      </span>
                      <span>
                        <strong>Resume editing</strong>
                        <small>{savedLabel}</small>
                      </span>
                      <span className="cr-motion-icon" aria-hidden="true">
                        <ArrowRight />
                      </span>
                    </button>
                  )}
                  <button type="button" className="cr-start-action" onClick={onStartBlank}>
                    <span className="cr-start-action__icon">
                      <FilePlus2 aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Start blank</strong>
                      <small>Open the full editor</small>
                    </span>
                    <span className="cr-motion-icon" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </button>
                  <button type="button" className="cr-start-action" onClick={onLoadSample}>
                    <span className="cr-start-action__icon">
                      <Sparkles aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Load sample</strong>
                      <small>Explore a completed draft</small>
                    </span>
                    <span className="cr-motion-icon" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </button>
                  <button type="button" className="cr-start-action" onClick={chooseFile}>
                    <span className="cr-start-action__icon">
                      <FolderOpen aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Load saved file</strong>
                      <small>Continue from JSON</small>
                    </span>
                    <span className="cr-motion-icon" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    className="sr-only"
                    type="file"
                    name="resume-file"
                    accept=".json,application/json"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) onLoadFile(file);
                      event.currentTarget.value = "";
                    }}
                    aria-label="Choose a saved CloakResume JSON file"
                  />
                </div>
              </div>
              <ResumeInstrumentPreview />
            </div>
          </div>
        </section>

        <section className="cr-frame cr-fact-strip" aria-label="Product facts">
          <div>
            <strong>0</strong>
            <span>document uploads</span>
          </div>
          <div>
            <strong>{TEMPLATE_COUNT}</strong>
            <span>live templates</span>
          </div>
          <div>
            <strong>Local</strong>
            <span>draft storage</span>
          </div>
          <div>
            <strong>MIT</strong>
            <span>open-source license</span>
          </div>
        </section>

        <section id="capabilities" className="cr-capabilities" aria-labelledby="capabilities-title">
          <div className="cr-frame">
            <div className="cr-section-intro">
              <div>
                <p className="cr-kicker">THE WORKBENCH</p>
                <h2 id="capabilities-title">One résumé, three working modes.</h2>
              </div>
              <p>
                The chrome stays quiet so the document can do the talking. Each mode preserves the
                same draft instead of moving personal data between services.
              </p>
            </div>

            <div className="cr-capability-ledger">
              {CAPABILITIES.map((group) => (
                <article key={group.index} className="cr-capability-row">
                  <div className="cr-capability-row__title">
                    <span>{group.index}</span>
                    <h3>{group.title}</h3>
                    <p>{group.summary}</p>
                  </div>
                  <dl>
                    {group.items.map(([term, description]) => (
                      <div key={term}>
                        <dt>
                          <Check aria-hidden="true" />
                          {term}
                        </dt>
                        <dd>{description}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="cr-privacy-receipt" aria-labelledby="privacy-title">
          <div className="cr-frame cr-privacy-grid">
            <div>
              <p className="cr-kicker cr-kicker--night">LOCAL PROCESSING RECEIPT</p>
              <h2 id="privacy-title">The résumé goes in. Nothing goes out.</h2>
              <p className="cr-privacy-lede">
                Editing, ATS review, grammar checks and export execute in your browser. There is no
                document server in the workflow.
              </p>
              <button type="button" className="cr-night-link" onClick={() => setPrivacyOpen(true)}>
                Read the privacy policy
                <span className="cr-motion-icon" aria-hidden="true">
                  <ArrowRight />
                </span>
              </button>
            </div>

            <div className="cr-receipt" aria-label="Local processing architecture">
              <div className="cr-receipt__head">
                <span>PROCESS / RESUME-01</span>
                <span>LOCAL</span>
              </div>
              <div className="cr-receipt__route">
                <div>
                  <FileJson aria-hidden="true" />
                  <span>INPUT</span>
                  <strong>Résumé draft</strong>
                </div>
                <ArrowRight aria-hidden="true" />
                <div>
                  <ScanSearch aria-hidden="true" />
                  <span>PROCESS</span>
                  <strong>Browser + Harper</strong>
                </div>
                <ArrowRight aria-hidden="true" />
                <div>
                  <Download aria-hidden="true" />
                  <span>OUTPUT</span>
                  <strong>PDF + JSON</strong>
                </div>
              </div>
              <ul>
                <li>
                  <ShieldCheck aria-hidden="true" /> Document upload route <b>not present</b>
                </li>
                <li>
                  <LockKeyhole aria-hidden="true" /> Account and tracking layer <b>not present</b>
                </li>
                <li>
                  <SpellCheck2 aria-hidden="true" /> Writing analysis <b>runs locally</b>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="cr-statement-footer">
        <div className="cr-frame">
          <div className="cr-footer-primary">
            <div>
              <p className="cr-footer-kicker">CloakResume / Cloakyard</p>
              <p className="cr-footer-statement">
                Build a résumé. <span>Keep it local.</span>
              </p>
            </div>
            <div className="cr-footer-index">
              <a href="#start">Start building</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <button type="button" onClick={() => setPrivacyOpen(true)}>
                Privacy policy
              </button>
              <a href={CLOAKYARD_URL} target="_blank" rel="noreferrer">
                Cloakyard <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="cr-footer-meta">
            <div className="cr-footer-meta__identity">
              <span translate="no">CloakResume v{__APP_VERSION__}</span>
              <span aria-hidden="true">/</span>
              <span>
                Built by{" "}
                <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
                  Sumit Sahoo
                </a>
              </span>
            </div>
            <div className="cr-footer-meta__links">
              <button type="button" onClick={() => setPrivacyOpen(true)}>
                <ShieldCheck aria-hidden="true" />
                Privacy
              </button>
              <a href={LICENSE_URL} target="_blank" rel="noreferrer">
                <Scale aria-hidden="true" />
                MIT licensed
              </a>
            </div>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}
