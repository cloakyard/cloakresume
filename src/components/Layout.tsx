/**
 * App shell — header + body (rail | panel | preview on desktop,
 * preview/editor split workbench on mobile).
 *
 * Owns responsive behaviour so the rest of the app is blissfully
 * unaware of viewport size:
 *
 *   • ≥1024px (`lg:` breakpoint) — 3-column grid. Section rail on the
 *     left; panel + preview share the remaining width. The properties
 *     panel grows from 20.5rem to 24rem at the 1280px widescreen token.
 *   • <1024px — Edit keeps the proof and the lower workspace visible in
 *     an exact 50:50 split. The lower pane shows either one open editor
 *     or the section picker, never both. Preview expands the proof.
 *
 * Mobile-first: the base layout is the mobile single-column stack.
 * The `lg:` modifier switches it to the desktop three-column grid.
 */

import { useCallback, type MouseEvent, type ReactNode } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { BrandLogo } from "./BrandLogo.tsx";
import { GithubIcon } from "./GithubIcon.tsx";
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

  // Both modes are viewport instruments; only their internal regions scroll.
  const shellClass = isMobile
    ? "bg-(--surface-2) h-[100dvh] flex flex-col overflow-hidden"
    : "grid bg-(--surface-2) overflow-hidden h-[100svh] grid-rows-[var(--editor-header-height)_minmax(0,1fr)] grid-cols-[var(--editor-rail-width)_var(--editor-panel-width)_minmax(0,1fr)] [grid-template-areas:'header_header_header'_'rail_panel_preview']";

  return (
    <div className={shellClass} data-mobile-view={mobileView}>
      <a className="cr-skip-link" href="#editor-content" onClick={handleSkipToEditor}>
        Skip to résumé editor
      </a>
      <h1 className="sr-only">CloakResume editor</h1>
      <header
        className={`cr-editor-header z-50 flex h-16 shrink-0 items-center bg-(--surface) border-b border-(--line) print:hidden ${
          isMobile ? "px-2.5 py-2.5 gap-1.5" : "[grid-area:header] px-4 py-3 gap-3"
        }`}
      >
        <BrandLogo />

        {/* Flex spacer pushes the remaining groups to the right edge. */}
        <div className="flex-1" />

        {/* toolbarCenter is ALWAYS rendered so the template picker's window-event
            bridge stays mounted (the mobile overflow menu dispatches the open event
            and the bridge lives inside ToolbarCenter). The wrapping div + divider
            are desktop-only visual chrome. */}
        {isMobile ? (
          toolbarCenter
        ) : (
          <>
            <div className="flex items-center gap-2">{toolbarCenter}</div>
            <span aria-hidden="true" className="w-px h-5 bg-(--line)" />
          </>
        )}

        {/* Mobile: edit/preview segmented control sits right before the actions cluster. */}
        {isMobile && <ViewSegment view={mobileView} onChange={onMobileViewChange} />}

        <div className="flex items-center gap-1.5 shrink-0 lg:gap-2">{toolbarRight}</div>

        {!isMobile && (
          <>
            <span aria-hidden="true" className="hidden 2xl:block w-px h-5 bg-(--line)" />
            <div className="hidden 2xl:inline-flex items-center gap-2 text-[11.5px] font-normal text-(--ink-4) tracking-[0.02em] whitespace-nowrap">
              <span>100% Private · Open Source</span>
            </div>
            <span aria-hidden="true" className="hidden 2xl:block w-px h-5 bg-(--line)" />
            <a
              href="https://github.com/cloakyard/cloakresume"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="grid h-10 w-10 place-items-center rounded-md text-(--ink-4) transition-colors duration-160 hover:bg-(--surface-2) hover:text-(--ink-1)"
            >
              <GithubIcon className="w-4.5 h-4.5" />
            </a>
          </>
        )}
      </header>

      {!isMobile && (
        <div className="cr-editor-rail [grid-area:rail] flex flex-col items-center gap-0.5 px-0 pt-4 pb-2.5 bg-(--surface) border-r border-(--line) overflow-hidden">
          <SectionRail active={activeSection} onChange={onSectionChange} />
        </div>
      )}

      {!isMobile && (
        <aside
          {...editorTargetProps}
          data-panel-root
          className="cr-editor-panel [grid-area:panel] flex flex-col min-w-0 overflow-hidden bg-(--surface) border-r border-(--line)"
        >
          {panel}
        </aside>
      )}

      {!isMobile && (
        <main
          className="cr-editor-preview [grid-area:preview] relative flex flex-col overflow-hidden"
          style={{ background: "var(--preview-bg)" }}
        >
          {preview}
        </main>
      )}

      {/* Mobile Edit is the family 50:50 proof/workspace contract. Preview
       * expands the proof without unmounting any desktop-only state. */}
      {isMobile && (
        <div className="flex min-h-0 flex-1 flex-col bg-(--surface-2)">
          {mobileView === "panel" ? (
            <div className="grid min-h-0 flex-1 grid-rows-2 overflow-hidden">
              <main
                aria-label="Résumé preview"
                className="cr-editor-preview flex min-h-0 min-w-0 flex-col border-b border-(--line)"
              >
                {preview}
              </main>
              {mobileSectionOpen ? (
                <aside
                  {...editorTargetProps}
                  aria-label="Résumé editor"
                  data-panel-root
                  className="cr-editor-panel relative flex min-h-0 min-w-0 flex-col overflow-hidden"
                >
                  {panel}
                </aside>
              ) : (
                <aside
                  {...editorTargetProps}
                  aria-label="Résumé section picker"
                  className="cr-editor-panel flex min-h-0 min-w-0 flex-col overflow-hidden bg-(--surface)"
                >
                  <header className="shrink-0 border-b border-(--line) px-4 py-3">
                    <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-(--ink-1)">
                      Choose a section
                    </h2>
                    <p className="m-0 mt-0.5 text-sm leading-[1.45] text-(--ink-4)">
                      Open one part of the résumé at a time.
                    </p>
                  </header>
                  <div className="cr-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
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
            <main aria-label="Résumé preview" className="flex min-h-0 min-w-0 flex-1 flex-col">
              {preview}
            </main>
          )}
        </div>
      )}
    </div>
  );
}
