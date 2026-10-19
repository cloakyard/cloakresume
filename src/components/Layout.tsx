import { useCallback, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { BrandLogo } from "./BrandLogo.tsx";
import { SectionRail, type SectionId } from "./SectionRail.tsx";
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
  const previousPanel = useRef({ isMobile, mobileSectionOpen });
  useLayoutEffect(() => {
    const previous = previousPanel.current;
    previousPanel.current = { isMobile, mobileSectionOpen };
    // A compact section handoff removes its trigger. Keep keyboard focus in the
    // new task without stealing it on initial mount or responsive resizing.
    if (!isMobile || !previous.isMobile || previous.mobileSectionOpen === mobileSectionOpen) return;
    const target = mobileSectionOpen
      ? document.getElementById("editor-content")
      : document.querySelector<HTMLElement>('.resume-section-nav--picker [aria-current="page"]');
    target?.focus({ preventScroll: true });
    if (!mobileSectionOpen) target?.scrollIntoView({ block: "nearest" });
  }, [isMobile, mobileSectionOpen]);

  /** A mobile pick replaces the picker with exactly one editor. */
  const handleMobileSectionPick = useCallback(
    (id: SectionId) => {
      onSectionChange(id);
      onMobileSectionOpenChange(true);
      onMobileViewChange("panel");
    },
    [onMobileSectionOpenChange, onMobileViewChange, onSectionChange],
  );
  // Only one responsive branch is mounted at a time; sharing these props
  // keeps the document to one stable skip target at every viewport.
  const editorTargetProps = {
    id: "editor-content",
    tabIndex: -1,
  } as const;

  const handleSkipToEditor = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (isMobile && mobileView !== "panel") {
        onMobileViewChange("panel");
      }

      const focusTarget = () => {
        const target = document.getElementById("editor-content");
        target?.focus({ preventScroll: true });
        return Boolean(target);
      };

      if (focusTarget()) return;

      // Mobile preview mode mounts the editor in response to this click.
      // Waiting through the next paint keeps the hash target unique while
      // still moving keyboard focus into the newly rendered panel.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          focusTarget();
        });
      });
    },
    [isMobile, mobileView, onMobileViewChange],
  );

  const shellClass = `cr-editor-shell resume-editor${isMobile ? " resume-editor--compact" : ""}`;

  return (
    <div className={shellClass} data-mobile-view={mobileView}>
      <a className="resume-editor-skip" href="#editor-content" onClick={handleSkipToEditor}>
        Skip to résumé editor
      </a>
      <h1 className="sr-only">CloakResume editor</h1>
      <header className="cr-editor-header resume-editor-header print:hidden">
        <BrandLogo />

        {/* Flex spacer pushes the remaining groups to the right edge. */}
        <div className="resume-header-spacer" />

        {/* toolbarCenter is ALWAYS rendered so the template picker's window-event
            bridge stays mounted (the mobile overflow menu dispatches the open event
            and the bridge lives inside ToolbarCenter). The wrapping div + divider
            are desktop-only visual chrome. */}
        {isMobile ? (
          toolbarCenter
        ) : (
          <>
            <div className="resume-header-group">{toolbarCenter}</div>
            <span aria-hidden="true" className="resume-header-divider" />
          </>
        )}

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
        <aside
          {...editorTargetProps}
          data-panel-root
          className="cr-editor-panel resume-editor-panel"
        >
          {panel}
        </aside>
      )}

      {!isMobile && <main className="cr-editor-preview resume-editor-preview">{preview}</main>}

      {/* Portrait Edit keeps the 50:50 preview/workspace split. Short landscape
       * uses side-by-side panes. Preview
       * expands the proof without unmounting any desktop-only state. */}
      {isMobile && (
        <div className="resume-compact-body">
          {mobileView === "panel" ? (
            <div className="resume-compact-split">
              <main aria-label="Résumé preview" className="cr-editor-preview resume-editor-preview">
                {preview}
              </main>
              {mobileSectionOpen ? (
                <aside
                  {...editorTargetProps}
                  aria-label="Résumé editor"
                  data-panel-root
                  className="cr-editor-panel resume-editor-panel relative"
                >
                  {panel}
                </aside>
              ) : (
                <aside
                  {...editorTargetProps}
                  aria-label="Résumé section picker"
                  className="cr-editor-panel resume-editor-panel resume-picker-panel cr-scroll"
                >
                  <header className="resume-section-heading">
                    <h2 className="resume-section-title">Choose a section</h2>
                    <p className="resume-section-help">Open one part of the résumé at a time.</p>
                  </header>
                  <div className="resume-picker-scroll">
                    <SectionRail
                      active={activeSection}
                      onChange={handleMobileSectionPick}
                      variant="picker"
                    />
                  </div>
                </aside>
              )}
            </div>
          ) : (
            <main aria-label="Résumé preview" className="cr-editor-preview resume-editor-preview">
              {preview}
            </main>
          )}
        </div>
      )}
    </div>
  );
}
