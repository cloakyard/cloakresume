/**
 * Centre toolbar cluster: template picker + colour picker + Scan ATS button.
 *
 * Desktop renders both pickers as inline controls; mobile hides them because
 * the same actions live in `ToolbarOverflow`. A window-event bridge lets the
 * overflow menu trigger the template modal or colour sheet without threading
 * refs through the Layout.
 */

import { ChevronDown, LayoutTemplate, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TEMPLATE_LIST } from "../templates/index.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { PRESET_COLORS } from "../utils/colors.ts";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { ColorPickerContent } from "./ColorPickerContent.tsx";
import { TemplateModal } from "./TemplateModal.tsx";

interface ToolbarCenterProps {
  templateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  primary: string;
  onPrimaryChange: (hex: string) => void;
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
  onScanAts,
  resume,
}: ToolbarCenterProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
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

  return (
    <>
      {!isMobile && (
        <>
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="tb"
            aria-haspopup="dialog"
          >
            <LayoutTemplate className="w-4 h-4 text-(--ink-4)" />
            <span>{activeTemplate.name}</span>
            <ChevronDown className="w-3.5 h-3.5 caret" />
          </button>

          <div className="relative" ref={colorRef}>
            <button
              type="button"
              onClick={() => setColorOpen((v) => !v)}
              className="tb"
              aria-haspopup="dialog"
              aria-expanded={colorOpen}
            >
              <Palette className="w-4 h-4 text-(--ink-4)" />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: primary, border: "1px solid rgba(0,0,0,0.08)" }}
              />
              <span>
                <ColorName hex={primary} />
              </span>
              <ChevronDown className="w-3.5 h-3.5 caret" />
            </button>
            {colorOpen && (
              <div
                className="popover absolute top-full right-0 mt-2 w-[320px] animate-scale-in"
                style={{ zIndex: 60 }}
                role="dialog"
              >
                <ColorPickerContent primary={primary} onChange={onPrimaryChange} />
              </div>
            )}
          </div>
        </>
      )}

      {templateOpen && (
        <TemplateModal
          templateId={templateId}
          onChange={(id) => {
            onTemplateChange(id);
            setTemplateOpen(false);
          }}
          onClose={() => setTemplateOpen(false)}
          resume={resume}
          primary={primary}
        />
      )}

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
