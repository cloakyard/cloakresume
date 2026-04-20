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
import { downloadResumeFile, readResumeFile } from "./utils/fileIO.ts";
import { blankResume } from "./data/blankResume.ts";

const LS_KEY = "cloakresume:v1";

interface Persisted {
  resume: ResumeData;
  templateId: TemplateId;
  primary: string;
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
    templateId: "classic-sidebar",
    primary: "#2563EB",
    jobDescription: "",
    activeSection: "profile",
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      if (parsed.resume && parsed.templateId && parsed.primary) {
        return {
          persisted: {
            resume: parsed.resume,
            templateId: parsed.templateId,
            primary: parsed.primary,
            jobDescription: parsed.jobDescription ?? "",
            activeSection: parsed.activeSection ?? "profile",
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
  }, [resume, templateId, primary, jobDescription, activeSection, showOnboarding]);

  /** Change-in-one-place: derive palette from primary, memoised. */
  const palette = useMemo(() => derivePalette(primary), [primary]);

  /** Bind palette to CSS variables so editor chrome follows the theme. */
  useApplyTheme(palette);

  /** ATS scoring depends on the resume body and the optional JD. */
  const atsReport = useMemo(() => computeAts(resume, jobDescription), [resume, jobDescription]);

  /** Switch the rail to the JD section when the user clicks "add JD" in the panel. */
  const focusJdEditor = useCallback(() => {
    setAtsOpen(false);
    setActiveSection("jd");
  }, []);

  const TemplateComponent = TEMPLATES[templateId].component;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSaveFile = useCallback(() => {
    downloadResumeFile({ resume, templateId, primary, jobDescription });
  }, [resume, templateId, primary, jobDescription]);

  const handleLoadFile = useCallback(async (file: File) => {
    try {
      const payload = await readResumeFile(file);
      setResume(payload.resume);
      setTemplateId(payload.templateId);
      setPrimary(payload.primary);
      setJobDescription(payload.jobDescription);
      setShowOnboarding(false);
    } catch (err) {
      alert(`Couldn't load that file. ${err instanceof Error ? err.message : "Unknown error."}`);
    }
  }, []);

  /** Welcome-screen → Start blank. Also closes the onboarding overlay. */
  const onboardStartBlank = useCallback(() => {
    setResume(blankResume);
    setJobDescription("");
    setTemplateId("classic-sidebar");
    setShowOnboarding(false);
    setOnboardingDismissable(false);
  }, []);

  /** Welcome-screen → Load the bundled sample. */
  const onboardLoadSample = useCallback(() => {
    setResume(sampleResume);
    setJobDescription("");
    setTemplateId("classic-sidebar");
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
            onScanAts={() => setAtsOpen(true)}
            resume={resume}
          />
        }
        toolbarRight={
          <>
            <ToolbarActions
              onPrint={handlePrint}
              onSaveFile={handleSaveFile}
              onLoadFile={handleLoadFile}
              onNewResume={handleNewResume}
              onScanAts={() => setAtsOpen(true)}
            />
            <ToolbarOverflow
              primary={primary}
              onPrimaryChange={setPrimary}
              onNewResume={handleNewResume}
              onSaveFile={handleSaveFile}
              onLoadFile={handleLoadFile}
            />
          </>
        }
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        panel={
          <SectionPanel
            active={activeSection}
            resume={resume}
            onChange={setResume}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onAnalyze={() => setAtsOpen(true)}
          />
        }
        preview={
          <Preview resume={resume} palette={palette} TemplateComponent={TemplateComponent} />
        }
      />

      <AtsPanel
        open={atsOpen}
        onClose={() => setAtsOpen(false)}
        report={atsReport}
        resume={resume}
        hasJobDescription={jobDescription.trim().length > 0}
        onOpenJdEditor={focusJdEditor}
      />

      {showOnboarding && (
        <OnboardingScreen
          onStartBlank={onboardStartBlank}
          onLoadSample={onboardLoadSample}
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
