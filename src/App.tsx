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
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { Layout } from "./components/Layout.tsx";
import { ToolbarActions } from "./components/ToolbarActions.tsx";
import { ToolbarCenter } from "./components/ToolbarCenter.tsx";
import { ToolbarOverflow } from "./components/ToolbarOverflow.tsx";
import { SectionPanel } from "./components/SectionPanel.tsx";
import type { SectionId } from "./components/SectionRail.tsx";
import { Preview } from "./components/Preview.tsx";

// Code-split the ATS review — the panel plus its four sub-panes and the
// Harper grammar engine only need to land in the client the first time
// the user actually opens the review.
const AtsReviewModal = lazy(() =>
  import("./components/AtsReviewModal.tsx").then((m) => ({ default: m.AtsReviewModal })),
);
import { OnboardingScreen } from "./components/OnboardingScreen.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { generateSampleResume } from "./data/sampleResume.ts";
import { TEMPLATES } from "./templates/index.ts";
import type { ResumeData, TemplateId } from "./types.ts";
import { derivePalette } from "./utils/colors.ts";
import { useApplyTheme, useSystemDarkMode } from "./utils/theme.ts";
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
import { blankResume, resumeHasContent } from "./data/blankResume.ts";

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
  /**
   * `null` = follow the OS `prefers-color-scheme` live; `boolean` = user has
   * pinned a specific appearance that should ignore future OS changes. The
   * override auto-clears when the user toggles to a state that already
   * matches the OS, so returning to auto requires no dedicated control.
   */
  darkModeOverride: boolean | null;
}

/**
 * Shape accepted by the loader. Includes the legacy `darkMode: boolean` key
 * used by earlier versions so existing users keep their chosen appearance
 * after the switch to the override model.
 */
type PersistedInput = Partial<Persisted> & { darkMode?: unknown };

interface InitialState {
  persisted: Persisted;
  /** True when storage had no valid data — triggers the onboarding screen. */
  firstRun: boolean;
}

function resolveDarkModeOverride(parsed: PersistedInput): boolean | null {
  if (typeof parsed.darkModeOverride === "boolean" || parsed.darkModeOverride === null) {
    return parsed.darkModeOverride;
  }
  // Legacy key — preserve the user's last explicit state as an override so
  // the first load after upgrade doesn't silently flip their theme.
  if (typeof parsed.darkMode === "boolean") return parsed.darkMode;
  return null;
}

function loadPersisted(): InitialState {
  const defaults: Persisted = {
    resume: blankResume,
    templateId: DEFAULT_TEMPLATE_ID,
    primary: DEFAULT_PRIMARY,
    paperSize: DEFAULT_PAPER_SIZE,
    jobDescription: "",
    activeSection: "profile",
    darkModeOverride: null,
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedInput;
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
            darkModeOverride: resolveDarkModeOverride(parsed),
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
  const [darkModeOverride, setDarkModeOverride] = useState<boolean | null>(
    initial.persisted.darkModeOverride,
  );
  /**
   * Live OS `prefers-color-scheme` so the app can track mid-session changes
   * (macOS auto-schedule flipping at sunset, user toggling system appearance)
   * whenever `darkModeOverride` is null.
   */
  const systemDark = useSystemDarkMode();
  const darkMode = darkModeOverride ?? systemDark;
  const [atsOpen, setAtsOpen] = useState(false);
  /** True once the user has opened the ATS review at least once — gates the
   *  lazy AtsReviewModal chunk so it's not downloaded until actually needed. */
  const [atsMounted, setAtsMounted] = useState(false);
  const openAts = useCallback(() => {
    setAtsMounted(true);
    setAtsOpen(true);
  }, []);
  const [showOnboarding, setShowOnboarding] = useState(initial.firstRun);
  /**
   * True on first-run; false when the user opens the welcome screen
   * from the "New" button. Controls whether the X / Escape / backdrop
   * affordances are rendered — first-run must pick one of the tiles.
   */
  const [onboardingDismissable, setOnboardingDismissable] = useState(false);
  /**
   * True when the current résumé has any user-entered content — gates
   * the "Resume editing" tile on the welcome screen so it only shows
   * when there's something worth resuming.
   */
  const hasSavedWork = useMemo(() => resumeHasContent(resume), [resume]);
  const canResumeEditing = onboardingDismissable && hasSavedWork;
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
        darkModeOverride,
      };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      } catch {
        // Quota exceeded (e.g. huge photo) — silently skip.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [
    resume,
    templateId,
    primary,
    paperSize,
    jobDescription,
    activeSection,
    darkModeOverride,
    showOnboarding,
  ]);

  /** Bind the dark-mode flag to <html data-theme="..."> so the CSS token
   *  overrides in index.css take effect. We always write an explicit
   *  "dark" or "light" value (rather than adding/removing the attribute)
   *  so the user's choice overrides the OS `prefers-color-scheme` rule —
   *  a dark-OS user who toggles to light gets light, and vice versa. */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /**
   * Flip the visible appearance. If the resulting state matches the current
   * OS preference we drop the override (null) so the app keeps tracking
   * future system changes; otherwise we pin the override so an intentional
   * choice survives later OS flips. Effect: toggling back to match the OS
   * implicitly re-arms auto-sync without needing a separate control.
   */
  const toggleDarkMode = useCallback(() => {
    setDarkModeOverride((curr) => {
      const effective = curr ?? systemDark;
      const next = !effective;
      return next === systemDark ? null : next;
    });
  }, [systemDark]);

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
   * first intentional scan. We also skip the first engine-ready
   * transition so the initial [atsOpen] scan isn't shadowed by a
   * second scan firing ~800 ms later, which caused the "Scanning
   * locally…" hero to briefly reappear after content first rendered.
   */
  const sawEngineReadyRef = useRef(false);
  useEffect(() => {
    if (!grammarEngineReady) return;
    if (!sawEngineReadyRef.current) {
      sawEngineReadyRef.current = true;
      return;
    }
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
            onScanAts={openAts}
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
              onScanAts={openAts}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
            <ToolbarOverflow
              primary={primary}
              onPrimaryChange={setPrimary}
              paperSize={paperSize}
              onPaperSizeChange={setPaperSize}
              onNewResume={handleNewResume}
              onSaveFile={handleSaveFile}
              onLoadFile={handleLoadFile}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
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
              onAnalyze={openAts}
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

      {atsMounted && (
        <ErrorBoundary title="ATS review hit a snag">
          <Suspense fallback={null}>
            <AtsReviewModal
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
          </Suspense>
        </ErrorBoundary>
      )}

      {showOnboarding && (
        <OnboardingScreen
          onStartBlank={() => startWithResume(blankResume)}
          onLoadSample={() => startWithResume(generateSampleResume())}
          onLoadFile={handleLoadFile}
          onDismiss={onboardingDismissable ? dismissOnboarding : undefined}
          onResumeEditing={canResumeEditing ? dismissOnboarding : undefined}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
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
