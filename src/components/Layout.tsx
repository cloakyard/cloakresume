import { useAirPresence } from "../../docs/air/presence.tsx";
import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { BrandLogo } from "./BrandLogo.tsx";
import { SectionDock, SectionPicker, SectionRail, type SectionId } from "./SectionRail.tsx";
import { ViewSegment, type MobileView } from "./ViewSegment.tsx";

interface LayoutProps {
  /** Centred toolbar cluster: template picker + colour + Scan résumé button. */
  toolbarCenter: ReactNode;
  /** Right action group: New / Save / Load / Export PDF (+ Overflow on mobile). */
  toolbarRight: ReactNode;
  /** Currently selected resume section — drives both rails. */
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
  /** Mobile-only split/full-preview state. Lifted to App so ATS jumps can
   *  restore the split workbench before focusing a field. */
  mobileView: MobileView;
  onMobileViewChange: (next: MobileView) => void;
  /** Mobile lower-pane state: one section editor or the inline picker. */
  mobileSectionOpen: boolean;
  onMobileSectionOpenChange: (open: boolean) => void;
  /** Middle panel (single section editor). */
  panel: ReactNode;
  /** Preview area (resume canvas). */
  preview: ReactNode;
}

export function Layout({
  toolbarCenter,
  toolbarRight,
  activeSection,
  onSectionChange,
  mobileView,
  onMobileViewChange,
  mobileSectionOpen,
  onMobileSectionOpenChange,
  panel,
  preview,
}: LayoutProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const presence = useAirPresence(isMobile && mobileView === "panel", "panel");
  const shellRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const previousPanel = useRef({ isMobile, mobileSectionOpen });
  useLayoutEffect(() => {
    const previous = previousPanel.current;
    previousPanel.current = { isMobile, mobileSectionOpen };
    if (!isMobile || !previous.isMobile) {
      pendingFocus.current = null;
      return;
    }
    // The dock mounts after the sheet finishes its exit.
    if (pendingFocus.current === "[data-all-sections]" && presence.closing) return;
    let selector = pendingFocus.current;
    pendingFocus.current = null;
    if (!selector && previous.mobileSectionOpen !== mobileSectionOpen && mobileView === "panel") {
      selector = mobileSectionOpen
        ? "#editor-content"
        : '.resume-section-nav--picker [aria-current="page"]';
    }
    if (!selector) return;
    const target = shellRef.current?.querySelector<HTMLElement>(selector);
    target?.focus({ preventScroll: true });
    if (target?.hasAttribute("aria-current")) target.scrollIntoView({ block: "nearest" });
  }, [isMobile, mobileSectionOpen, mobileView, presence.mounted, presence.closing]);

  // On iOS the keyboard shrinks the visual viewport while the layout viewport
  // stays tall. Follow the visible area without overriding browser pinch zoom.
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const shell = shellRef.current;
    if (!isMobile || !viewport || !shell) return;
    const reset = () => {
      shell.style.removeProperty("--resume-visible-height");
      shell.style.removeProperty("--resume-visible-top");
    };
    const sync = () => {
      if (Math.abs(viewport.scale - 1) > 0.01 || viewport.height >= window.innerHeight - 1) {
        reset();
        return;
      }
      const shrinking = viewport.height < shell.getBoundingClientRect().height - 1;
      shell.style.setProperty("--resume-visible-height", viewport.height + "px");
      shell.style.setProperty("--resume-visible-top", viewport.offsetTop + "px");
      const field = document.activeElement;
      if (
        shrinking &&
        field instanceof HTMLElement &&
        shell.contains(field) &&
        field.matches("input, textarea, [contenteditable=true]")
      ) {
        field.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      reset();
    };
  }, [isMobile]);

  const handleMobileSectionPick = (id: SectionId) => {
    pendingFocus.current = "#editor-content";
    onSectionChange(id);
    onMobileViewChange("panel");
  };
  const openPicker = () => {
    pendingFocus.current = "#editor-content";
    onMobileSectionOpenChange(false);
    onMobileViewChange("panel");
  };
  const collapsePicker = () => {
    pendingFocus.current = "[data-all-sections]";
    onMobileViewChange("preview");
  };
  // Only one responsive branch is mounted at a time; sharing these props
  // keeps the document to one stable skip target at every viewport.
  const editorTargetProps = {
    id: "editor-content",
    tabIndex: -1,
  } as const;

  const handleSkipToEditor = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isMobile && (mobileView === "preview" || !mobileSectionOpen)) {
      pendingFocus.current = "#editor-content";
      onMobileSectionOpenChange(true);
      onMobileViewChange("panel");
    } else {
      document.getElementById("editor-content")?.focus({ preventScroll: true });
    }
  };

  const shellClass = `cr-editor-shell resume-editor${isMobile ? " resume-editor--compact" : ""}`;

  return (
    <div ref={shellRef} className={shellClass} data-mobile-view={mobileView}>
      <a className="resume-editor-skip" href="#editor-content" onClick={handleSkipToEditor}>
        Skip to résumé editor
      </a>
      <h1 className="sr-only">CloakResume editor</h1>
      <header
        className={`cr-editor-header resume-editor-header print:hidden${isMobile ? " air-editor-header--compact" : ""}`}
      >
        <BrandLogo />

        {/* Flex spacer pushes the remaining groups to the right edge. */}
        <div className="resume-header-spacer" />

        {/* Keep the library and its search mounted across responsive chrome changes. */}
        <div className={isMobile ? "contents" : "resume-header-group"}>{toolbarCenter}</div>
        {!isMobile && <span aria-hidden="true" className="resume-header-divider" />}

        {/* Mobile: edit/preview segmented control sits right before the actions cluster. */}
        {isMobile && <ViewSegment view={mobileView} onChange={onMobileViewChange} />}

        <div className="resume-header-group">{toolbarRight}</div>
      </header>

      {!isMobile && (
        <div className="cr-editor-rail resume-editor-rail">
          <SectionRail active={activeSection} onChange={onSectionChange} />
        </div>
      )}

      {!isMobile && (
        <aside {...editorTargetProps} className="cr-editor-panel resume-editor-panel">
          {panel}
        </aside>
      )}

      {!isMobile && <main className="cr-editor-preview resume-editor-preview">{preview}</main>}

      {/* Portrait Edit keeps the 50:50 preview/workspace split. Short landscape
       * uses side-by-side panes. Preview
       * expands the proof without unmounting any desktop-only state. */}
      {isMobile && (
        <div className={`resume-compact-body${presence.mounted ? " resume-compact-split" : ""}`}>
          <main aria-label="Résumé preview" className="cr-editor-preview resume-editor-preview">
            {preview}
          </main>
          {!presence.mounted && (
            <SectionDock onChange={handleMobileSectionPick} onBrowse={openPicker} />
          )}
          {presence.mounted && (
            <aside
              {...editorTargetProps}
              ref={presence.ref}
              inert={presence.closing}
              aria-label={mobileSectionOpen ? "Résumé editor" : "Résumé section picker"}
              className="cr-editor-panel resume-editor-panel relative"
            >
              <MobilePanelViews
                sectionOpen={mobileSectionOpen}
                active={activeSection}
                onPick={handleMobileSectionPick}
                panel={panel}
                onCollapse={collapsePicker}
              />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function MobilePanelViews({
  sectionOpen,
  active,
  onPick,
  onCollapse,
  panel,
}: {
  sectionOpen: boolean;
  active: SectionId;
  onPick: (id: SectionId) => void;
  onCollapse: () => void;
  panel: ReactNode;
}) {
  const section = useAirPresence(sectionOpen, "fade");
  const picker = useAirPresence(!sectionOpen, "fade");
  return (
    <div className="resume-panel-views">
      {section.mounted && (
        <div
          ref={section.ref}
          className="resume-panel-view"
          inert={section.closing}
          aria-hidden={section.closing || undefined}
        >
          {panel}
        </div>
      )}
      {picker.mounted && (
        <div
          ref={picker.ref}
          className="resume-panel-view"
          inert={picker.closing}
          aria-hidden={picker.closing || undefined}
        >
          <SectionPicker active={active} onChange={onPick} onCollapse={onCollapse} />
        </div>
      )}
    </div>
  );
}
