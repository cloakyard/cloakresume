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

  /* Mobile-only iOS Safari URL-bar fix.
   *
   * The editor's desktop shell is `h-[100svh] overflow-hidden grid`
   * and the global `body { overflow: hidden; height: 100% }` lock
   * from index.css is what makes that 3-column app shell work. On
   * iPhone Safari, that same lock prevents the document from ever
   * scrolling — and iOS only collapses its bottom URL bar when the
   * *document* scrolls, not when an inner container does. Without
   * this unlock the URL bar stays at full height for the entire
   * editor session (the same "white bar" the welcome screen used to
   * show before its own unlock effect).
   *
   * The mobile shell below is a `flex-col min-h-[100dvh]` page with
   * a sticky header, rather than a fixed grid. With this combined
   * with the unlock, the panel's natural content (which is almost
   * always taller than a phone viewport) scrolls the document, iOS
   * collapses the URL bar to its slim pill, and `100dvh` instantly
   * resizes the layout to fill the now-larger viewport.
   *
   * Restored on unmount and when the viewport crosses back to
   * desktop so the locked-shell behaviour is preserved everywhere
   * else. Mirrors the OnboardingScreen pattern. */
  useEffect(() => {
    if (!isMobile) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
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
      html.style.height = prev.htmlHeight;
      html.style.overflow = prev.htmlOverflow;
      body.style.height = prev.bodyHeight;
      body.style.overflow = prev.bodyOverflow;
    };
  }, [isMobile]);

  const activeMeta = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  // Mobile shell is a normal-flow `flex-col` page with `min-h-[100dvh]`
  // so the document scrolls naturally — required for iOS Safari URL-bar
  // collapse (see unlock effect above). Desktop keeps the original
  // fixed-height 3-column grid.
  const shellClass = isMobile
    ? "bg-(--surface-2) min-h-[100dvh] flex flex-col"
    : "grid bg-(--surface-2) overflow-hidden h-[100svh] grid-rows-[56px_1fr] grid-cols-[56px_400px_1fr] [grid-template-areas:'header_header_header'_'rail_panel_preview']";

  return (
    <div className={shellClass} data-mobile-view={mobileView}>
      <header
        className={`z-50 flex items-center gap-2 px-3 bg-(--surface) border-b border-(--line) print:hidden sm:gap-3 sm:px-4 ${
          isMobile ? "sticky top-0 h-14 shrink-0" : "[grid-area:header]"
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
        {isMobile && <ViewSegment view={mobileView} onChange={setMobileView} />}

        <div className="flex items-center gap-1.5 shrink-0 lg:gap-2">{toolbarRight}</div>

        {!isMobile && (
          <>
            <span aria-hidden="true" className="hidden 2xl:block w-px h-5 bg-(--line)" />
            <div className="hidden 2xl:inline-flex items-center gap-2 text-[12.5px] font-medium text-(--ink-3) tracking-[0.01em] whitespace-nowrap">
              <span>100% Private · Open Source</span>
            </div>
            <span aria-hidden="true" className="hidden 2xl:block w-px h-5 bg-(--line)" />
            <a
              href="https://github.com/cloakyard/cloakresume"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="grid place-items-center text-(--ink-4) transition-colors duration-100 hover:text-(--ink-1)"
            >
              <GithubIcon className="w-4.5 h-4.5" />
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

      {/* Mobile body — natural flow so the document scrolls.
       *
       * Panel renders at its full natural height (its own scroll
       * container is opted out on mobile via `lg:` classes inside
       * SectionPanel), so the document grows with the form content
       * and iOS Safari can collapse its URL bar on user scroll.
       *
       * Preview keeps its internal scroll for the canvas zoom/pan,
       * so its wrapper gets an explicit `100dvh - 56px` height to
       * match the visible body area. The page itself doesn't scroll
       * in preview view, but URL-bar state is preserved across the
       * panel/preview toggle so the slim pill stays once the user
       * has scrolled the panel. */}
      {isMobile && (
        <div data-panel-root className="flex-1 flex flex-col min-w-0 bg-(--surface-2)">
          {mobileView === "panel" && panel}
          {mobileView === "preview" && (
            <div className="flex flex-col min-w-0 min-h-0 h-[calc(100dvh-3.5rem)]">{preview}</div>
          )}

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
