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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "./components/Layout.tsx";
import { ToolbarActions } from "./components/ToolbarActions.tsx";
import { ToolbarCenter } from "./components/ToolbarCenter.tsx";
import { ToolbarOverflow } from "./components/ToolbarOverflow.tsx";
import { SectionPanel } from "./components/SectionPanel.tsx";
import type { SectionId } from "./components/SectionRail.tsx";
import { Preview } from "./components/Preview.tsx";
import { AtsPanel } from "./components/AtsPanel.tsx";
import { OnboardingScreen } from "./components/OnboardingScreen.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { sampleResume } from "./data/sampleResume.ts";
import { TEMPLATES } from "./templates/index.ts";
import type { ResumeData, TemplateId } from "./types.ts";
import { derivePalette } from "./utils/colors.ts";
import { useApplyTheme } from "./utils/theme.ts";
import { computeAts } from "./utils/ats.ts";
import { useGrammarScan } from "./utils/grammar.ts";
import { FieldIssuesProvider } from "./utils/fieldIssues.tsx";
import { highlightField } from "./utils/highlightField.ts";
import {
  buildDownloadFilename,
  downloadResumeFile,
  normalizeResumeData,
  readResumeFile,
} from "./utils/fileIO.ts";
import { DEFAULT_PAPER_SIZE, resolvePaperSize, type PaperSize } from "./utils/paperSize.ts";
import { blankResume } from "./data/blankResume.ts";

const LS_KEY = "cloakresume:v1";
const DEFAULT_TEMPLATE_ID: TemplateId = "classic-sidebar";
const DEFAULT_PRIMARY = "#2563EB";

/** Accept only known template ids; fall back silently so a removed template can't crash the preview. */
function resolveTemplateId(candidate: unknown): TemplateId {
  if (typeof candidate === "string" && candidate in TEMPLATES) {
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
}

interface InitialState {
  persisted: Persisted;
  /** True when storage had no valid data — triggers the onboarding screen. */
  firstRun: boolean;
}

function loadPersisted(): InitialState {
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
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      if (parsed.resume && typeof parsed.resume === "object") {
        return {
          persisted: {
            resume: normalizeResumeData(parsed.resume),
            templateId: resolveTemplateId(parsed.templateId),
            primary:
              typeof parsed.primary === "string" && parsed.primary
                ? parsed.primary
                : DEFAULT_PRIMARY,
            paperSize: resolvePaperSize(parsed.paperSize),
            jobDescription: typeof parsed.jobDescription === "string" ? parsed.jobDescription : "",
            activeSection: (parsed.activeSection ?? "profile") as SectionId,
          },
          firstRun: false,
        };
      }
    }
  } catch {
    // Corrupted storage — fall through and show onboarding.
  }
  return { persisted: defaults, firstRun: true };
}

export function App() {
  const initial = useMemo(() => loadPersisted(), []);
  const [resume, setResume] = useState<ResumeData>(initial.persisted.resume);
  const [templateId, setTemplateId] = useState<TemplateId>(initial.persisted.templateId);
  const [primary, setPrimary] = useState<string>(initial.persisted.primary);
  const [paperSize, setPaperSize] = useState<PaperSize>(initial.persisted.paperSize);
  const [jobDescription, setJobDescription] = useState<string>(initial.persisted.jobDescription);
  const [activeSection, setActiveSection] = useState<SectionId>(initial.persisted.activeSection);
  const [atsOpen, setAtsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(initial.firstRun);
  /**
   * True on first-run; false when the user opens the welcome screen
   * from the "New" button. Controls whether the X / Escape / backdrop
   * affordances are rendered — first-run must pick one of the tiles.
   */
  const [onboardingDismissable, setOnboardingDismissable] = useState(false);
  /** Confirmation prompt before clearing the current work via the "New" button. */
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);

  // Persist everything on change (debounced via rAF to avoid thrash on keystroke).
  // Suppressed while onboarding is visible — the default state is a placeholder
  // and shouldn't bypass the first-run screen by getting written to storage.
  useEffect(() => {
    if (showOnboarding) return;
    const frame = requestAnimationFrame(() => {
      const payload: Persisted = {
        resume,
        templateId,
        primary,
        paperSize,
        jobDescription,
        activeSection,
      };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      } catch {
        // Quota exceeded (e.g. huge photo) — silently skip.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [resume, templateId, primary, paperSize, jobDescription, activeSection, showOnboarding]);

  /** Change-in-one-place: derive palette from primary, memoised. */
  const palette = useMemo(() => derivePalette(primary), [primary]);

  /** Bind palette to CSS variables so editor chrome follows the theme. */
  useApplyTheme(palette);

  /**
   * Grammar / spelling analysis runs in a Web Worker so the ~700 KB English
   * dictionary doesn't land on the main thread. It's triggered lazily when
   * the user opens the ATS review — no per-keystroke work.
   */
  const {
    report: grammarReport,
    scanning: grammarScanning,
    engineReady: grammarEngineReady,
    engineProgress: grammarEngineProgress,
    scan: runGrammarScan,
  } = useGrammarScan(resume);

  /** ATS scoring depends on the resume body, the optional JD, and (once ready) the grammar report. */
  const atsReport = useMemo(
    () => computeAts(resume, jobDescription, grammarReport),
    [resume, jobDescription, grammarReport],
  );

  /** Kick off a fresh grammar scan whenever the panel opens. */
  useEffect(() => {
    if (atsOpen) runGrammarScan();
  }, [atsOpen, runGrammarScan]);

  /**
   * Live in-field writing feedback. Once the Harper engine has been
   * loaded (i.e. the user has opened the ATS review at least once), any
   * resume edit schedules a debounced re-scan so the badges next to each
   * prose field stay in sync with the latest text. Before the engine is
   * ready we stay silent — the ~7 MB WASM payload is deferred to the
   * first intentional scan.
   */
  useEffect(() => {
    if (!grammarEngineReady) return;
    const id = window.setTimeout(() => runGrammarScan(), 800);
    return () => window.clearTimeout(id);
  }, [resume, grammarEngineReady, runGrammarScan]);

  /** Switch the rail to the JD section when the user clicks "add JD" in the panel. */
  const focusJdEditor = useCallback(() => {
    setAtsOpen(false);
    setActiveSection("jd");
  }, []);

  /**
   * Tap-to-fix jump from the Insights tab: translate a grammar segment id
   * (e.g. `experience.0.bullets.2`) into the editor rail section, close
   * the review modal, then soft-glow the specific field so the user sees
   * exactly which bullet / summary / description to edit.
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
              : null;
    if (!target) return;
    setActiveSection(target);
    setAtsOpen(false);
    // Delay past the sheet's close animation + section mount so the field
    // exists in the DOM by the time we try to query + scroll to it.
    window.setTimeout(() => highlightField(segmentId), 320);
  }, []);

  const TemplateComponent = TEMPLATES[templateId].component;

  const handleExportPdf = useCallback(async () => {
    const root = document.querySelector<HTMLElement>(".resume-root");
    if (!root) return;
    try {
      // Lazy-loaded so the ~200 kB html2canvas-pro + jsPDF bundle only lands
      // in the client after the user actually asks for an export.
      const { exportResumeToPdf } = await import("./utils/pdfExport.ts");
      await exportResumeToPdf(root, buildDownloadFilename(resume.profile.name, "pdf"), paperSize);
    } catch (err) {
      alert(`Couldn't generate the PDF. ${err instanceof Error ? err.message : "Unknown error."}`);
    }
  }, [resume.profile.name, paperSize]);

  const handleSaveFile = useCallback(() => {
    downloadResumeFile({ resume, templateId, primary, paperSize, jobDescription });
  }, [resume, templateId, primary, paperSize, jobDescription]);

  const handleLoadFile = useCallback(async (file: File) => {
    try {
      const payload = await readResumeFile(file);
      setResume(payload.resume);
      setTemplateId(resolveTemplateId(payload.templateId));
      setPrimary(payload.primary);
      setPaperSize(payload.paperSize);
      setJobDescription(payload.jobDescription);
      setShowOnboarding(false);
    } catch (err) {
      alert(`Couldn't load that file. ${err instanceof Error ? err.message : "Unknown error."}`);
    }
  }, []);

  /** Welcome-screen → seed with the given resume data and close the overlay. */
  const startWithResume = useCallback((data: ResumeData) => {
    setResume(data);
    setJobDescription("");
    setTemplateId(DEFAULT_TEMPLATE_ID);
    setShowOnboarding(false);
    setOnboardingDismissable(false);
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
    setOnboardingDismissable(true);
    setShowOnboarding(true);
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingDismissable(false);
  }, []);

  return (
    <>
      <Layout
        toolbarCenter={
          <ToolbarCenter
            templateId={templateId}
            onTemplateChange={setTemplateId}
            primary={primary}
            onPrimaryChange={setPrimary}
            paperSize={paperSize}
            onPaperSizeChange={setPaperSize}
            onScanAts={() => setAtsOpen(true)}
            resume={resume}
          />
        }
        toolbarRight={
          <>
            <ToolbarActions
              onExportPdf={handleExportPdf}
              onSaveFile={handleSaveFile}
              onLoadFile={handleLoadFile}
              onNewResume={handleNewResume}
              onScanAts={() => setAtsOpen(true)}
            />
            <ToolbarOverflow
              primary={primary}
              onPrimaryChange={setPrimary}
              paperSize={paperSize}
              onPaperSizeChange={setPaperSize}
              onNewResume={handleNewResume}
              onSaveFile={handleSaveFile}
              onLoadFile={handleLoadFile}
            />
          </>
        }
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        panel={
          <FieldIssuesProvider report={grammarReport}>
            <SectionPanel
              active={activeSection}
              resume={resume}
              onChange={setResume}
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              onAnalyze={() => setAtsOpen(true)}
            />
          </FieldIssuesProvider>
        }
        preview={
          <Preview
            resume={resume}
            palette={palette}
            paperSize={paperSize}
            TemplateComponent={TemplateComponent}
          />
        }
      />

      <AtsPanel
        open={atsOpen}
        onClose={() => setAtsOpen(false)}
        report={atsReport}
        resume={resume}
        hasJobDescription={jobDescription.trim().length > 0}
        onOpenJdEditor={focusJdEditor}
        grammarScanning={grammarScanning}
        engineReady={grammarEngineReady}
        engineProgress={grammarEngineProgress}
        onRescan={runGrammarScan}
        onJumpToField={handleJumpToField}
      />

      {showOnboarding && (
        <OnboardingScreen
          onStartBlank={() => startWithResume(blankResume)}
          onLoadSample={() => startWithResume(sampleResume)}
          onLoadFile={handleLoadFile}
          onDismiss={onboardingDismissable ? dismissOnboarding : undefined}
        />
      )}

      <ConfirmDialog
        open={newConfirmOpen}
        title="Start a new resume?"
        description="Your current resume will be replaced. Save it first if you want to keep a copy."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={confirmNewResume}
        onCancel={() => setNewConfirmOpen(false)}
      />
    </>
  );
}
