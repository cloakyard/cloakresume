/**
 * Root application component for CloakResume.
 *
 * Owns the top-level state — the resume data, the chosen template id,
 * the primary colour, the optional job description, and the currently
 * active section in the icon rail. The shell is laid out as a CSS grid
 * (header / rail | panel | preview) and each region is fed by a single
 * piece of state owned here.
 *
 * All state is persisted to localStorage so refreshing doesn't lose
 * work. Nothing ever leaves the browser.
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AtsReviewDialog } from "./components/AtsReviewDialog.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { Layout } from "./components/Layout.tsx";
import { ReloadPrompt } from "./components/ReloadPrompt.tsx";
import { ToolbarActions } from "./components/ToolbarActions.tsx";
import { ToolbarCenter } from "./components/ToolbarCenter.tsx";
import { ToolbarOverflow } from "./components/ToolbarOverflow.tsx";
import { SectionPanel } from "./components/SectionPanel.tsx";
import { SECTIONS, type SectionId } from "./components/SectionRail.tsx";
import type { MobileView } from "./components/ViewSegment.tsx";
import { Preview } from "./components/Preview.tsx";

// Keep review panes lazy while dismissal/focus remain available in the shared frame.
const AtsReviewContent = lazy(() =>
  import("./components/AtsReviewContent.tsx").then((m) => ({ default: m.AtsReviewContent })),
);

import { CloakWorkbenchLanding } from "./components/CloakWorkbenchLanding.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { generateSampleResume } from "./data/sampleResume.ts";
import { TEMPLATES } from "./templates/index.ts";
import type { ResumeData, TemplateId } from "./types.ts";
import { derivePalette, normalizePrimaryColor } from "./utils/colors.ts";
import { useAutosave } from "./utils/useAutosave.ts";
import { computeAts } from "./utils/ats.ts";
import { useGrammarScan } from "./utils/grammar.ts";
import { FieldIssuesProvider } from "./utils/fieldIssues.tsx";
import { ProfileTitleOverflowContext } from "./utils/profileTitle.ts";
import { highlightField } from "./utils/highlightField.ts";
import {
  buildDownloadFilename,
  downloadResumeFile,
  normalizeResumeData,
  readResumeFile,
} from "./utils/fileIO.ts";
import { DEFAULT_PAPER_SIZE, resolvePaperSize, type PaperSize } from "./utils/paperSize.ts";
import { blankResume, resumeHasContent } from "./data/blankResume.ts";

const LS_KEY = "cloakresume:v1";
const DEFAULT_TEMPLATE_ID: TemplateId = "classic-sidebar";
const DEFAULT_PRIMARY = "#047857";

/** Accept only known template ids; fall back silently so a removed template can't crash the preview. */
function resolveTemplateId(candidate: unknown): TemplateId {
  if (typeof candidate === "string" && Object.hasOwn(TEMPLATES, candidate)) {
    return candidate as TemplateId;
  }
  return DEFAULT_TEMPLATE_ID;
}

interface Persisted {
  resume: ResumeData;
  templateId: TemplateId;
  primary: string;
  paperSize: PaperSize;
  jobDescription: string;
  activeSection: SectionId;
  /** ISO timestamp of the most recent persistence write. Surfaced on
   *  the landing "Resume editing" CTA as a "Saved 2h ago" caption.
   *  Undefined on first run (no record yet) and on records written
   *  before this field was introduced. */
  savedAt?: string;
}

interface AppNotice {
  title: string;
  description: string;
}

type PersistedInput = Partial<Persisted>;

function loadPersisted(): Persisted {
  const defaults: Persisted = {
    resume: blankResume,
    templateId: DEFAULT_TEMPLATE_ID,
    primary: DEFAULT_PRIMARY,
    paperSize: DEFAULT_PAPER_SIZE,
    jobDescription: "",
    activeSection: "profile",
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedInput;
      if (parsed.resume && typeof parsed.resume === "object") {
        return {
          resume: normalizeResumeData(parsed.resume),
          templateId: resolveTemplateId(parsed.templateId),
          primary: normalizePrimaryColor(parsed.primary),
          paperSize: resolvePaperSize(parsed.paperSize),
          jobDescription: typeof parsed.jobDescription === "string" ? parsed.jobDescription : "",
          activeSection:
            SECTIONS.find((section) => section.id === parsed.activeSection)?.id ?? "profile",
          savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : undefined,
        };
      }
    }
  } catch {
    // Corrupted storage — fall through to defaults.
  }
  return defaults;
}

export function App() {
  const initial = useMemo(() => loadPersisted(), []);
  const [resume, setResume] = useState<ResumeData>(initial.resume);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [templateId, setTemplateId] = useState<TemplateId>(initial.templateId);
  const [primary, setPrimary] = useState<string>(initial.primary);
  const [paperSize, setPaperSize] = useState<PaperSize>(initial.paperSize);
  const [jobDescription, setJobDescription] = useState<string>(initial.jobDescription);
  const [activeSection, setActiveSection] = useState<SectionId>(initial.activeSection);
  const [mobileView, setMobileView] = useState<MobileView>("panel");
  const [mobileSectionOpen, setMobileSectionOpen] = useState(true);
  const handleSectionChange = useCallback((next: SectionId) => {
    setActiveSection(next);
    setMobileSectionOpen(true);
  }, []);
  const [atsOpen, setAtsOpen] = useState(false);
  /**
   * The start landing shows on every app load — users always land here first and
   * pick "Resume editing" (when there's saved work) or one of the
   * fresh-start tiles. Mid-session "New" flow re-opens it with the same UI.
   */
  const [showLanding, setShowLanding] = useState(true);
  /**
   * True when the current résumé has any user-entered content — gates
   * the "Resume editing" tile on the welcome screen so it only shows
   * when there's something worth resuming, and enables Escape/backdrop
   * dismiss (since dismissing would otherwise drop the user into a blank
   * editor with no clear way back).
   */
  const hasSavedWork = useMemo(
    () => resumeHasContent(resume) || jobDescription.trim().length > 0,
    [resume, jobDescription],
  );
  const latestHasSavedWork = useRef(hasSavedWork);
  useEffect(() => {
    latestHasSavedWork.current = hasSavedWork;
  }, [hasSavedWork]);
  /** Open start options without discarding the current draft. */
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<ResumeData | null>(null);
  const [pendingFile, setPendingFile] = useState<Awaited<ReturnType<typeof readResumeFile>> | null>(
    null,
  );
  const [loadingFile, setLoadingFile] = useState(false);
  const fileLoadInFlight = useRef(false);
  /** Family notice used for recoverable file and export failures. */
  const [notice, setNotice] = useState<AppNotice | null>(null);

  const persisted = useMemo(
    () => ({ resume, templateId, primary, paperSize, jobDescription, activeSection }),
    [resume, templateId, primary, paperSize, jobDescription, activeSection],
  );
  const { error: saveError, savedAt, flush } = useAutosave(LS_KEY, persisted, !showLanding);
  useEffect(() => {
    if (saveError) setNotice({ title: "Draft not saved", description: saveError });
  }, [saveError]);

  /** Change-in-one-place: derive palette from primary, memoised. */
  const palette = useMemo(() => derivePalette(primary), [primary]);

  /**
   * Grammar / spelling analysis runs in a Web Worker to keep language
   * processing off the main thread. It's triggered lazily when
   * the user opens the ATS review — no per-keystroke work.
   */
  const {
    report: grammarReport,
    error: grammarError,
    scanning: grammarScanning,
    engineReady: grammarEngineReady,
    engineProgress: grammarEngineProgress,
    completedAt: grammarCompletedAt,
    scan: runGrammarScan,
  } = useGrammarScan(resume);

  /** ATS scoring depends on the resume body, the optional JD, and (once ready) the grammar report. */
  const atsReport = useMemo(
    () => computeAts(resume, jobDescription, grammarReport),
    [resume, jobDescription, grammarReport],
  );

  const openAts = useCallback(() => {
    runGrammarScan();
    setAtsOpen(true);
  }, [runGrammarScan]);

  // Only the current document revision needs a background scan. An edit made
  // during the initial engine download must also be scanned when it becomes ready.
  useEffect(() => {
    if (!grammarEngineReady || grammarScanning || grammarReport || grammarError) return;
    const id = window.setTimeout(runGrammarScan, 800);
    return () => window.clearTimeout(id);
  }, [resume, grammarEngineReady, grammarScanning, grammarReport, grammarError, runGrammarScan]);

  /** Switch the rail to the JD section when the user clicks "add JD" in the panel. */
  const focusJdEditor = useCallback(() => {
    setAtsOpen(false);
    setActiveSection("jd");
    setMobileSectionOpen(true);
    setMobileView("panel");
    highlightField("target-job-description");
  }, []);

  /**
   * Tap-to-fix jump from the Insights tab: translate a grammar segment id
   * (e.g. `experience.0.bullets.2`) into the editor rail section, close
   * the review modal, then focus the specific bullet / summary / description.
   */
  const handleJumpToField = useCallback((segmentId: string) => {
    const prefix = segmentId.split(".")[0];
    const target: SectionId | null =
      prefix === "profile"
        ? "profile"
        : prefix === "experience"
          ? "experience"
          : prefix === "projects"
            ? "projects"
            : prefix === "awards"
              ? "awards"
              : prefix === "custom"
                ? "custom"
                : null;
    if (!target) return;
    setActiveSection(target);
    setMobileSectionOpen(true);
    // On mobile the edit mode contains the split preview/editor workbench.
    setMobileView("panel");
    setAtsOpen(false);
    // The field helper waits for the section mount; review dismissal is immediate.
    highlightField(segmentId);
  }, []);

  const TemplateComponent = TEMPLATES[templateId].component;
  const exportInFlight = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  const handleExportPdf = useCallback(async () => {
    if (exportInFlight.current) return;
    const root = document.querySelector<HTMLElement>('.resume-root[data-template-ready="true"]');
    if (!root) {
      setExportStatus("Document is still preparing. Try again when the preview is ready.");
      setNotice({
        title: "Document is still preparing",
        description:
          "Wait a moment for the selected template to finish loading, then export again.",
      });
      return;
    }
    exportInFlight.current = true;
    setExporting(true);
    setExportStatus("Preparing your PDF…");
    try {
      // Keep the PDF renderer out of the initial editor bundle.
      const { exportResumeToPdf } = await import("./utils/pdfExport.ts");
      await exportResumeToPdf(root, buildDownloadFilename(resume.profile.name, "pdf"), paperSize);
      setExportStatus("PDF download started.");
    } catch (err) {
      setExportStatus("PDF export failed. Dismiss the message, then try again.");
      setNotice({
        title: "PDF export failed",
        description: `CloakResume couldn't generate the PDF. ${
          err instanceof Error ? err.message : "Please try again."
        }`,
      });
    } finally {
      exportInFlight.current = false;
      setExporting(false);
    }
  }, [resume.profile.name, paperSize]);

  const handleSaveFile = useCallback(() => {
    try {
      downloadResumeFile({ resume, templateId, primary, paperSize, jobDescription });
    } catch (err) {
      setNotice({
        title: "Resume file couldn’t be saved",
        description: `Your draft is still here. ${err instanceof Error ? err.message : "Please try again."}`,
      });
    }
  }, [resume, templateId, primary, paperSize, jobDescription]);

  const applyFile = useCallback((payload: Awaited<ReturnType<typeof readResumeFile>>) => {
    setResume(payload.resume);
    setTemplateId(resolveTemplateId(payload.templateId));
    setPrimary(payload.primary);
    setPaperSize(payload.paperSize);
    setJobDescription(payload.jobDescription);
    setActiveSection("profile");
    setMobileSectionOpen(true);
    setMobileView("panel");
    setShowLanding(false);
  }, []);

  const handleLoadFile = useCallback(
    async (file: File) => {
      if (fileLoadInFlight.current) return;
      fileLoadInFlight.current = true;
      setLoadingFile(true);
      try {
        const payload = await readResumeFile(file);
        // Validate before asking to replace; a bad file must never discard a draft.
        if (latestHasSavedWork.current) setPendingFile(payload);
        else applyFile(payload);
      } catch (err) {
        setNotice({
          title: "Resume file couldn't be opened",
          description: `CloakResume couldn't load that file. ${err instanceof Error ? err.message : "Choose another CloakResume file and try again."}`,
        });
      } finally {
        fileLoadInFlight.current = false;
        setLoadingFile(false);
      }
    },
    [applyFile],
  );

  /** Welcome-screen → seed with the given resume data and close the overlay. */
  const startWithResume = useCallback((data: ResumeData) => {
    setResume(data);
    setJobDescription("");
    setActiveSection("profile");
    setMobileSectionOpen(true);
    setMobileView("panel");
    setTemplateId(DEFAULT_TEMPLATE_ID);
    setShowLanding(false);
  }, []);

  /**
   * "New" button in the header — prompts before clearing current work,
   * then reuses the welcome screen (with a close affordance so the user
   * can still back out without losing anything).
   */
  const handleNewResume = useCallback(() => {
    setNewConfirmOpen(true);
  }, []);

  const confirmNewResume = useCallback(() => {
    setNewConfirmOpen(false);
    setShowLanding(true);
  }, []);

  const dismissLanding = useCallback(() => {
    setShowLanding(false);
  }, []);

  const beforeReload = useCallback(() => {
    if (exportInFlight.current || fileLoadInFlight.current)
      return "Finish the current file operation, then try updating again. Your draft stays here.";
    return flush()
      ? null
      : "Your latest changes could not be saved. Keep editing or download a JSON copy before leaving. Free browser storage, then retry the update.";
  }, [flush]);

  return (
    <div className={showLanding ? "resume-app" : "resume-app resume-app--editing"}>
      <ReloadPrompt beforeReload={beforeReload} />

      {/* The editor and the welcome screen are mutually exclusive — only
       * one is mounted at a time. Keeping both mounted (with the editor
       * hidden behind a fixed overlay) was the previous approach, but
       * the editor's `body { overflow: hidden }` lock prevents the
       * document from scrolling, and iOS Safari only collapses its URL
       * bar when the *document* scrolls. By unmounting the editor while
       * the landing is shown, CloakWorkbenchLanding can let the document
       * scroll naturally and the URL bar collapses to its slim pill. */}
      {!showLanding && (
        <Layout
          toolbarCenter={
            <ToolbarCenter
              templateId={templateId}
              onTemplateChange={setTemplateId}
              primary={primary}
              onPrimaryChange={setPrimary}
              paperSize={paperSize}
              onPaperSizeChange={setPaperSize}
              onScanAts={openAts}
              resume={resume}
            />
          }
          toolbarRight={
            <>
              <ToolbarActions
                onExportPdf={handleExportPdf}
                exporting={exporting}
                exportStatus={exportStatus}
                loadingFile={loadingFile}
                onSaveFile={handleSaveFile}
                onLoadFile={handleLoadFile}
                onNewResume={handleNewResume}
                onScanAts={openAts}
              />
              <ToolbarOverflow
                primary={primary}
                onPrimaryChange={setPrimary}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
                onExportPdf={handleExportPdf}
                exporting={exporting}
                exportStatus={exportStatus}
                loadingFile={loadingFile}
                onNewResume={handleNewResume}
                onSaveFile={handleSaveFile}
                onLoadFile={handleLoadFile}
              />
            </>
          }
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          mobileView={mobileView}
          onMobileViewChange={setMobileView}
          mobileSectionOpen={mobileSectionOpen}
          onMobileSectionOpenChange={setMobileSectionOpen}
          panel={
            <FieldIssuesProvider report={grammarReport}>
              <ProfileTitleOverflowContext value={titleOverflows}>
                <SectionPanel
                  active={activeSection}
                  resume={resume}
                  onChange={setResume}
                  jobDescription={jobDescription}
                  onJobDescriptionChange={setJobDescription}
                  onAnalyze={openAts}
                  onClose={() => setMobileSectionOpen(false)}
                />
              </ProfileTitleOverflowContext>
            </FieldIssuesProvider>
          }
          preview={
            <Preview
              resume={resume}
              palette={palette}
              paperSize={paperSize}
              TemplateComponent={TemplateComponent}
              onTitleOverflowChange={setTitleOverflows}
            />
          }
        />
      )}

      {atsOpen && !showLanding && (
        <ErrorBoundary title="ATS review hit a snag">
          <AtsReviewDialog onClose={() => setAtsOpen(false)}>
            <Suspense
              fallback={
                <div className="resume-review-body">
                  <p role="status">Loading the local review workspace…</p>
                </div>
              }
            >
              <AtsReviewContent
                report={atsReport}
                resume={resume}
                hasJobDescription={jobDescription.trim().length > 0}
                onOpenJdEditor={focusJdEditor}
                grammarScanning={grammarScanning}
                grammarError={grammarError}
                engineReady={grammarEngineReady}
                engineProgress={grammarEngineProgress}
                scannedAt={grammarCompletedAt}
                onRescan={runGrammarScan}
                onJumpToField={handleJumpToField}
              />
            </Suspense>
          </AtsReviewDialog>
        </ErrorBoundary>
      )}

      {showLanding && (
        <CloakWorkbenchLanding
          onStartBlank={() =>
            hasSavedWork ? setPendingStart(blankResume) : startWithResume(blankResume)
          }
          onLoadSample={() =>
            hasSavedWork
              ? setPendingStart(generateSampleResume())
              : startWithResume(generateSampleResume())
          }
          onLoadFile={handleLoadFile}
          loading={loadingFile}
          onDismiss={hasSavedWork ? dismissLanding : undefined}
          onResumeEditing={hasSavedWork ? dismissLanding : undefined}
          lastSavedAt={hasSavedWork ? (savedAt ?? initial.savedAt) : undefined}
        />
      )}

      <ConfirmDialog
        open={pendingStart !== null || pendingFile !== null}
        title="Replace this draft?"
        description="Your current résumé will be replaced. Cancel to keep it, or save a JSON copy from the editor first."
        confirmLabel="Replace draft"
        tone="danger"
        onConfirm={() => {
          if (pendingFile) applyFile(pendingFile);
          else if (pendingStart) startWithResume(pendingStart);
          setPendingFile(null);
          setPendingStart(null);
        }}
        onCancel={() => {
          setPendingFile(null);
          setPendingStart(null);
        }}
      />

      <ConfirmDialog
        open={newConfirmOpen}
        title="Open start options?"
        description="Your current draft stays available under Resume editing until you choose to replace it."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={confirmNewResume}
        onCancel={() => setNewConfirmOpen(false)}
      />

      <ConfirmDialog
        open={notice !== null}
        title={notice?.title ?? "Action couldn't be completed"}
        description={notice?.description}
        confirmLabel="Dismiss"
        variant="notice"
        tone="danger"
        onConfirm={() => setNotice(null)}
        onCancel={() => setNotice(null)}
      />
    </div>
  );
}
