/**
 * App shell — header + body (rail | panel | preview on desktop,
 * single-view with floating section pill on mobile).
 *
 * Owns responsive behaviour so the rest of the app is blissfully
 * unaware of viewport size:
 *
 *   • ≥1024px (`lg:` breakpoint) — 3-column grid. Section rail on the
 *     left; panel + preview share the remaining width.
 *   • <1024px — a single view at a time. A segmented toggle in the
 *     header switches between the editor and the preview. A floating
 *     pill anchored above the bottom safe-area shows the current
 *     section and opens the section drawer on tap.
 *
 * Mobile-first: the base layout is the mobile single-column stack.
 * The `lg:` modifier switches it to the desktop three-column grid.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { BottomSheet } from "./BottomSheet.tsx";
import { BrandLogo } from "./BrandLogo.tsx";
import { FloatingSectionPill } from "./FloatingSectionPill.tsx";
import { GithubIcon } from "./GithubIcon.tsx";
import { SECTIONS, SectionRail, type SectionId } from "./SectionRail.tsx";
import { ViewSegment, type MobileView } from "./ViewSegment.tsx";

interface LayoutProps {
  /** Centred toolbar cluster: template picker + colour + Scan résumé button. */
  toolbarCenter: ReactNode;
  /** Right action group: New / Save / Load / Export PDF (+ Overflow on mobile). */
  toolbarRight: ReactNode;
  /** Currently selected resume section — drives both rails. */
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
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
  panel,
  preview,
}: LayoutProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const [mobileView, setMobileView] = useState<MobileView>("panel");
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);

  /** When the user picks a section from the mobile drawer, close it and
   *  switch to the edit panel so they land on the new section. */
  const handleMobileSectionPick = useCallback(
    (id: SectionId) => {
      onSectionChange(id);
      setSectionDrawerOpen(false);
      setMobileView("panel");
    },
    [onSectionChange],
  );

  /** If the viewport crosses the breakpoint, snap state to a sane default. */
  useEffect(() => {
    if (!isMobile) {
      setSectionDrawerOpen(false);
    }
  }, [isMobile]);

  const activeMeta = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  // Mobile-first shell: single-column stack (header + body). `lg:` turns it
  // into the desktop three-column grid with a persistent rail.
  const shellClass = isMobile
    ? "grid bg-(--surface-2) overflow-hidden h-[100svh] grid-rows-[56px_1fr] grid-cols-[1fr] [grid-template-areas:'header'_'body']"
    : "grid bg-(--surface-2) overflow-hidden h-[100svh] grid-rows-[56px_1fr] grid-cols-[56px_400px_1fr] [grid-template-areas:'header_header_header'_'rail_panel_preview']";

  return (
    <div className={shellClass} data-mobile-view={mobileView}>
      <header className="[grid-area:header] z-50 flex items-center gap-2 px-3 bg-(--surface) border-b border-(--line) print:hidden sm:gap-3 sm:px-4">
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
        {isMobile && <ViewSegment view={mobileView} onChange={setMobileView} />}

        <div className="flex items-center gap-1.5 shrink-0 lg:gap-2">{toolbarRight}</div>

        {!isMobile && (
          <>
            <span aria-hidden="true" className="hidden xl:block w-px h-5 bg-(--line)" />
            <div className="hidden xl:inline-flex items-center gap-2 text-[12.5px] font-medium text-(--ink-3) tracking-[0.01em] whitespace-nowrap">
              <span>100% Private · Open Source</span>
            </div>
            <a
              href="https://github.com/cloakyard/cloakresume"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="w-8.5 h-8.5 grid place-items-center rounded-md text-(--ink-4) transition-colors duration-100 hover:bg-(--surface-3) hover:text-(--ink-1)"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </>
        )}
      </header>

      {!isMobile && (
        <div className="[grid-area:rail] flex flex-col items-center gap-0.5 px-0 pt-4 pb-2.5 bg-(--surface) border-r border-(--line) overflow-hidden">
          <SectionRail active={activeSection} onChange={onSectionChange} />
        </div>
      )}

      {!isMobile && (
        <aside
          data-panel-root
          className="[grid-area:panel] flex flex-col min-w-0 overflow-hidden bg-(--surface) border-r border-(--line)"
        >
          {panel}
        </aside>
      )}

      {!isMobile && (
        <main
          className="[grid-area:preview] relative flex flex-col overflow-hidden"
          style={{ background: "var(--preview-bg)" }}
        >
          {preview}
        </main>
      )}

      {isMobile && (
        <div
          data-panel-root
          className="[grid-area:body] relative min-w-0 min-h-0 overflow-hidden bg-(--surface-2)"
        >
          <div
            className={`absolute inset-0 flex-col min-w-0 min-h-0 ${
              mobileView === "panel" ? "flex" : "hidden"
            }`}
          >
            {panel}
          </div>
          <div
            className={`absolute inset-0 flex-col min-w-0 min-h-0 ${
              mobileView === "preview" ? "flex" : "hidden"
            }`}
          >
            {preview}
          </div>

          {mobileView === "panel" && (
            <FloatingSectionPill
              icon={activeMeta.icon}
              label={activeMeta.label}
              onClick={() => setSectionDrawerOpen(true)}
            />
          )}
        </div>
      )}

      <BottomSheet
        open={sectionDrawerOpen}
        onClose={() => setSectionDrawerOpen(false)}
        title="Jump to section"
      >
        <SectionRail active={activeSection} onChange={handleMobileSectionPick} variant="drawer" />
      </BottomSheet>
    </div>
  );
}
