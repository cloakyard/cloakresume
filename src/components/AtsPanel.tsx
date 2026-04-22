/**
 * ATS review modal — bottom sheet on mobile, centred modal on tablet+.
 *
 * This file is intentionally thin: it owns the surrounding chrome
 * (backdrop, drag-to-dismiss handle, header, hero strip, tab strip) and
 * routes to one of four self-contained panes in `./ats/`. Each pane
 * manages its own data derivation so changes to one tab don't ripple
 * across the others.
 */

import { AlertTriangle, Download, FileText, Hash, LayoutGrid, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AtsReport, ResumeData } from "../types.ts";
import { scoreBand } from "../utils/ats.ts";
import { AtsInsightsPane } from "./ats/AtsInsightsPane.tsx";
import { AtsKeywordsPane } from "./ats/AtsKeywordsPane.tsx";
import { AtsOverviewPane } from "./ats/AtsOverviewPane.tsx";
import { AtsParsePreview } from "./ats/AtsParsePreview.tsx";
import { AtsScoreRing } from "./ats/AtsScoreRing.tsx";

interface AtsPanelProps {
  open: boolean;
  onClose: () => void;
  report: AtsReport;
  resume: ResumeData;
  hasJobDescription: boolean;
  onOpenJdEditor: () => void;
}

type TabId = "overview" | "keywords" | "insights" | "parse";

function formatTimestamp(d: Date): string {
  const date = d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} · ${time}`;
}

export function AtsPanel({
  open,
  onClose,
  report,
  resume,
  hasJobDescription,
  onOpenJdEditor,
}: AtsPanelProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [scanning, setScanning] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setScanning(true);
    setTab("overview");
    const t = window.setTimeout(() => setScanning(false), 900);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragDeltaRef.current = 0;
  }, []);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      dragDeltaRef.current = delta;
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "";
    if (dragDeltaRef.current > 120) {
      onClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    dragDeltaRef.current = 0;
  }, [onClose]);

  const band = useMemo(() => scoreBand(report.score), [report.score]);
  const timestamp = useMemo(() => (open ? formatTimestamp(new Date()) : ""), [open]);
  const failCount = report.issues.filter((i) => i.severity !== "info").length;
  const kwTotal = report.keywords.matched.length + report.keywords.missing.length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:p-6 backdrop print:hidden"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="surface-glass relative w-full flex flex-col overflow-hidden rounded-t-[22px] h-[92svh] sm:rounded-[20px] sm:w-[min(920px,100%)] sm:mx-auto sm:h-[min(820px,calc(100svh-48px))] min-[900px]:w-[min(1100px,100%)]"
        style={{
          animation: "ats-slide-up 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="ATS review"
      >
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          className="grid place-items-center pt-2 pb-1 cursor-grab touch-none sm:hidden"
        >
          <span aria-hidden="true" className="w-10 h-1 rounded-sm bg-(--ink-6)" />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 border-b border-(--line-soft) shrink-0 sm:px-6 sm:py-3 sm:border-(--line)">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-[15px] font-semibold tracking-[-0.005em] text-(--ink-1)">
              Résumé review
            </h2>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-(--ink-6)" />
            <span className="hidden sm:inline font-mono text-[10.5px] text-(--ink-5) tracking-[0.03em]">
              {timestamp}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ATS review"
            className="grid place-items-center w-9 h-9 rounded-md border-0 bg-transparent text-(--ink-4) cursor-pointer transition-colors duration-100 hover:bg-(--surface-3) hover:text-(--ink-1)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {scanning ? (
          <div className="flex-1 grid place-items-center p-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-(--line) border-t-(--brand) animate-spin mx-auto mb-5 sm:w-20 sm:h-20" />
              <div className="text-[18px] font-semibold tracking-[-0.015em] text-(--ink-1) mb-1.5 sm:text-[20px]">
                Scanning résumé{" "}
                <em
                  className="italic font-normal"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--brand)" }}
                >
                  locally
                </em>
                …
              </div>
              <div className="text-[13px] text-(--ink-4) max-w-[400px] mx-auto leading-[1.55]">
                Checking keywords, structure, and parseability. Nothing leaves your browser.
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-start gap-3 px-4 pt-3 pb-3 shrink-0 border-b border-(--line) sm:gap-5 sm:px-6 sm:py-5 min-[900px]:px-9 min-[900px]:py-6">
              <div className="shrink-0 flex flex-col items-center gap-1 sm:order-1 sm:p-4 sm:border sm:border-(--line) sm:rounded-2xl sm:bg-white sm:shadow-(--sh-xs) sm:gap-2 min-[900px]:p-5">
                <AtsScoreRing score={report.score} color={band.color} size={80} />
                <span
                  className="font-mono text-[9px] font-bold tracking-[0.07em] px-2.5 py-0.5 rounded-full border uppercase sm:text-[10px] min-[900px]:text-[11px] min-[900px]:px-3"
                  style={{ color: band.color, background: band.bg, borderColor: band.border }}
                >
                  {band.label}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1 sm:order-0 sm:gap-0">
                <h1 className="text-[18px] font-bold tracking-[-0.025em] leading-[1.2] text-(--ink-1) m-0 sm:text-[26px] sm:mb-1.5 min-[900px]:text-[32px] min-[900px]:leading-[1.1]">
                  Scored{" "}
                  <em
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: band.color,
                      fontStyle: "italic",
                      fontWeight: 400,
                    }}
                  >
                    {band.label.toLowerCase()}
                  </em>
                  .
                </h1>
                <p className="m-0 text-[11.5px] leading-[1.4] text-(--ink-3) sm:text-[13.5px] min-[900px]:text-[14px] min-[900px]:leading-[1.55]">
                  {report.score >= 85
                    ? "Passes Workday, Greenhouse, and Lever."
                    : report.score >= 55
                      ? "Parses reliably — a few tweaks will push it into the green."
                      : "Fundamentals need work before most ATS pipelines will rank this well."}{" "}
                  {failCount > 0 ? (
                    <>
                      Fix{" "}
                      <strong className="text-(--ink-1) font-semibold">
                        {failCount} issue{failCount === 1 ? "" : "s"}
                      </strong>{" "}
                      to reach 95+.
                    </>
                  ) : (
                    <>No blocking issues detected.</>
                  )}
                </p>
                <div className="flex gap-1.5 mt-2 sm:mt-3 sm:gap-2">
                  <button
                    type="button"
                    className="tb ghost"
                    onClick={() => {
                      setScanning(true);
                      window.setTimeout(() => setScanning(false), 900);
                    }}
                    aria-label="Re-scan"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Re-scan</span>
                  </button>
                  <button
                    type="button"
                    className="tb ghost"
                    onClick={() => window.print()}
                    aria-label="Export report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export report</span>
                  </button>
                </div>
              </div>
            </header>

            <div
              className="mx-3 my-2 flex items-stretch p-0.5 border border-(--line) bg-white/70 rounded-(--r-md) shrink-0 sm:mx-0 sm:my-0 sm:p-0 sm:border-0 sm:border-y sm:border-(--line) sm:rounded-none sm:bg-transparent sm:px-4 min-[900px]:px-9"
              role="tablist"
              aria-label="ATS review sections"
            >
              <TabButton
                active={tab === "overview"}
                onClick={() => setTab("overview")}
                icon={<LayoutGrid className="w-4 h-4" />}
                label="Overview"
              />
              <TabButton
                active={tab === "keywords"}
                onClick={() => setTab("keywords")}
                icon={<Hash className="w-4 h-4" />}
                label="Keywords"
                count={
                  hasJobDescription && kwTotal > 0
                    ? `${report.keywords.matched.length}/${kwTotal}`
                    : undefined
                }
              />
              <TabButton
                active={tab === "insights"}
                onClick={() => setTab("insights")}
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Insights"
                count={
                  report.wins.length + report.issues.length > 0
                    ? String(report.wins.length + report.issues.length)
                    : undefined
                }
              />
              <TabButton
                active={tab === "parse"}
                onClick={() => setTab("parse")}
                icon={<FileText className="w-4 h-4" />}
                label="Parse"
              />
            </div>

            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 cr-scroll sm:px-6 sm:py-5 sm:[scrollbar-gutter:stable] min-[900px]:px-9 min-[900px]:py-6"
              role="tabpanel"
            >
              {tab === "overview" && (
                <AtsOverviewPane report={report} hasJobDescription={hasJobDescription} />
              )}
              {tab === "keywords" && (
                <AtsKeywordsPane
                  report={report}
                  resume={resume}
                  hasJobDescription={hasJobDescription}
                  onOpenJdEditor={onOpenJdEditor}
                />
              )}
              {tab === "insights" && <AtsInsightsPane report={report} />}
              {tab === "parse" && <AtsParsePreview resume={resume} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={[
        "flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 text-[10px] font-medium rounded-[6px] cursor-pointer transition-all duration-100 min-h-[34px]",
        "sm:flex-none sm:flex-row sm:gap-1.5 sm:py-3 sm:px-3 sm:text-[13px] sm:rounded-none sm:border-b-2 sm:-mb-px",
        active
          ? "bg-white text-(--brand) shadow-(--sh-xs) sm:bg-transparent sm:shadow-none sm:border-b-(--brand)"
          : "text-(--ink-4) hover:text-(--ink-1) hover:bg-white/60 sm:border-b-transparent sm:hover:bg-transparent",
      ].join(" ")}
      onClick={onClick}
    >
      {icon}
      {label}
      {count != null && (
        <span
          className={[
            "hidden sm:inline font-mono text-[10.5px] font-medium px-1.5 py-px rounded-[5px] border tracking-[0.02em]",
            active
              ? "text-(--brand) bg-(--brand-50) border-(--brand-200)"
              : "text-(--ink-5) bg-(--surface-2) border-(--line)",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}
