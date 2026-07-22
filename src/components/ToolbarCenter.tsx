/**
 * Centre toolbar cluster: template picker + colour picker + Scan résumé button.
 *
 * Desktop renders both pickers as inline controls; mobile hides them because
 * the same actions live in `ToolbarOverflow`. A window-event bridge lets the
 * overflow menu trigger the template modal or colour sheet without threading
 * refs through the Layout.
 */

import { ChevronDown, LayoutTemplate, Palette } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { TEMPLATE_LIST } from "../templates/index.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { PRESET_COLORS } from "../utils/colors.ts";
import { type PaperSize } from "../utils/paperSize.ts";
import { useAnimatedPresence } from "../utils/useAnimatedPresence.ts";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { ColorPickerContent } from "./ColorPickerContent.tsx";
import { PaperSizeToggle } from "./PaperSizeToggle.tsx";
import { TemplateModal } from "./TemplateModal.tsx";

interface ToolbarCenterProps {
  templateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  primary: string;
  onPrimaryChange: (hex: string) => void;
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  onScanAts: () => void;
  /** Live resume data — rendered at small scale inside the template picker. */
  resume: ResumeData;
}

function ColorName({ hex }: { hex: string }) {
  const preset = PRESET_COLORS.find((c) => c.value.toLowerCase() === hex.toLowerCase());
  return <>{preset?.name ?? "Custom"}</>;
}

export function ToolbarCenter({
  templateId,
  onTemplateChange,
  primary,
  onPrimaryChange,
  paperSize,
  onPaperSizeChange,
  onScanAts,
  resume,
}: ToolbarCenterProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const colorPresence = useAnimatedPresence(colorOpen);
  const colorRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [colorPopoverLayout, setColorPopoverLayout] = useState({
    placement: "below" as "above" | "below",
    maxHeight: 0,
  });
  const colorPopoverId = useId();
  const activeTemplate = TEMPLATE_LIST.find((t) => t.id === templateId) ?? TEMPLATE_LIST[0];

  useEffect(() => {
    if (isMobile) return;
    function handler(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  useEffect(() => {
    if (!templateOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTemplateOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [templateOpen]);

  useEffect(() => {
    if (isMobile) setColorOpen(false);
  }, [isMobile]);

  useLayoutEffect(() => {
    if (!colorOpen || isMobile) return;

    const updateLayout = () => {
      const trigger = colorButtonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const safeEdge = 16;
      const gap = 8;
      const below = Math.max(0, window.innerHeight - rect.bottom - gap - safeEdge);
      const above = Math.max(0, rect.top - gap - safeEdge);
      const placement = below >= Math.min(360, above) || below >= above ? "below" : "above";
      setColorPopoverLayout({
        placement,
        maxHeight: Math.floor(placement === "below" ? below : above),
      });
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [colorOpen, isMobile]);

  useEffect(() => {
    if (!colorOpen || isMobile) return;

    const focusFrame = window.requestAnimationFrame(() => {
      colorRef.current
        ?.querySelector<HTMLElement>(
          '[role="dialog"] button:not([disabled]), [role="dialog"] [role="slider"], [role="dialog"] input:not([disabled])',
        )
        ?.focus({ preventScroll: true });
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setColorOpen(false);
      colorButtonRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [colorOpen, isMobile]);

  return (
    <>
      {!isMobile && (
        <>
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="tb min-h-10"
            aria-haspopup="dialog"
            aria-label={`Template: ${activeTemplate.name}`}
          >
            <LayoutTemplate className="w-4 h-4 text-(--ink-4)" />
            <span className="hidden 2xl:inline">{activeTemplate.name}</span>
          </button>

          <div className="relative" ref={colorRef}>
            <button
              ref={colorButtonRef}
              type="button"
              onClick={() => setColorOpen((v) => !v)}
              className="tb min-h-10"
              aria-haspopup="dialog"
              aria-expanded={colorOpen}
              aria-controls={colorOpen ? colorPopoverId : undefined}
              aria-label="Primary colour"
            >
              <Palette className="w-4 h-4 text-(--ink-4)" />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: primary, border: "1px solid var(--color-rule-strong)" }}
              />
              <span className="hidden 2xl:inline">
                <ColorName hex={primary} />
              </span>
              <span aria-hidden="true" className="caret ml-0.5 hidden 2xl:inline-flex">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </button>
            {colorPresence.mounted && (
              <div
                id={colorPopoverId}
                data-state={colorPresence.state}
                className={`cr-popover popover absolute right-0 w-[320px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain ${
                  colorPopoverLayout.placement === "below" ? "top-full mt-2" : "bottom-full mb-2"
                }`}
                style={{
                  zIndex: "var(--z-popover)",
                  maxHeight: `${colorPopoverLayout.maxHeight}px`,
                }}
                role="dialog"
                aria-label="Primary colour"
              >
                <ColorPickerContent primary={primary} onChange={onPrimaryChange} />
              </div>
            )}
          </div>

          <PaperSizeToggle value={paperSize} onChange={onPaperSizeChange} />
        </>
      )}

      <TemplateModal
        open={templateOpen}
        templateId={templateId}
        onChange={(id) => {
          onTemplateChange(id);
          setTemplateOpen(false);
        }}
        onClose={() => setTemplateOpen(false)}
        resume={resume}
        primary={primary}
      />

      <ToolbarCenterBridge
        onOpenTemplate={() => setTemplateOpen(true)}
        onOpenColor={() => setColorOpen(true)}
        onScanAts={onScanAts}
      />
    </>
  );
}

/**
 * Window-event bridge so the mobile overflow menu can open the template
 * modal or colour sheet without a ref chain through the Layout.
 */
function ToolbarCenterBridge({
  onOpenTemplate,
  onOpenColor,
  onScanAts,
}: {
  onOpenTemplate: () => void;
  onOpenColor: () => void;
  onScanAts: () => void;
}) {
  useEffect(() => {
    const handleTemplate = () => onOpenTemplate();
    const handleColor = () => onOpenColor();
    const handleScanAts = () => onScanAts();
    window.addEventListener("cr:open-template-picker", handleTemplate);
    window.addEventListener("cr:open-color-picker", handleColor);
    window.addEventListener("cr:scan-ats", handleScanAts);
    return () => {
      window.removeEventListener("cr:open-template-picker", handleTemplate);
      window.removeEventListener("cr:open-color-picker", handleColor);
      window.removeEventListener("cr:scan-ats", handleScanAts);
    };
  }, [onOpenTemplate, onOpenColor, onScanAts]);
  return null;
}
