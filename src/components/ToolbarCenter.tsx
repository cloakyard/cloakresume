/**
 * Centre toolbar cluster: template, primary colour and paper size.
 *
 * Desktop renders both pickers as inline controls; mobile hides them because
 * the same actions live in `ToolbarOverflow`. A window-event bridge opens
 * the template and review dialogs from the compact toolbar.
 */

import { ChevronDown, LayoutTemplate, Palette } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { TEMPLATE_LIST } from "../templates/index.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { PRESET_COLORS } from "../utils/colors.ts";
import { type PaperSize } from "../utils/paperSize.ts";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { ColorPickerPopover } from "./ColorPickerPopover.tsx";
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
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const colorPopoverId = useId();
  const activeTemplate = TEMPLATE_LIST.find((t) => t.id === templateId) ?? TEMPLATE_LIST[0];

  useEffect(() => {
    if (isMobile) setColorOpen(false);
  }, [isMobile]);

  return (
    <>
      {!isMobile && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.currentTarget.focus();
              setTemplateOpen(true);
            }}
            className="air-icon-button resume-toolbar-action"
            aria-haspopup="dialog"
            aria-label={`Template: ${activeTemplate.name}`}
          >
            <LayoutTemplate size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="resume-toolbar-label">{activeTemplate.name}</span>
          </button>

          <div className="relative">
            <button
              ref={colorButtonRef}
              type="button"
              onClick={(event) => {
                event.currentTarget.focus();
                setColorOpen((v) => !v);
              }}
              className="air-icon-button resume-toolbar-action"
              aria-haspopup="dialog"
              aria-expanded={colorOpen}
              aria-controls={colorOpen ? colorPopoverId : undefined}
              aria-label="Primary colour"
            >
              <Palette size={18} strokeWidth={1.6} aria-hidden="true" />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: primary, border: "1px solid var(--air-line-control)" }}
              />
              <span className="resume-toolbar-label">
                <ColorName hex={primary} />
              </span>
              <span aria-hidden="true" className="resume-toolbar-label">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </button>
            {colorOpen && (
              <ColorPickerPopover
                id={colorPopoverId}
                primary={primary}
                onChange={onPrimaryChange}
                onClose={() => setColorOpen(false)}
                triggerRef={colorButtonRef}
              />
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

      <ToolbarCenterBridge onOpenTemplate={() => setTemplateOpen(true)} onScanAts={onScanAts} />
    </>
  );
}

/**
 * Window-event bridge so the mobile overflow menu can open the template
 * and review dialogs without a ref chain through the Layout.
 */
function ToolbarCenterBridge({
  onOpenTemplate,
  onScanAts,
}: {
  onOpenTemplate: () => void;
  onScanAts: () => void;
}) {
  useEffect(() => {
    const handleTemplate = () => onOpenTemplate();
    const handleScanAts = () => onScanAts();
    window.addEventListener("cr:open-template-picker", handleTemplate);
    window.addEventListener("cr:scan-ats", handleScanAts);
    return () => {
      window.removeEventListener("cr:open-template-picker", handleTemplate);
      window.removeEventListener("cr:scan-ats", handleScanAts);
    };
  }, [onOpenTemplate, onScanAts]);
  return null;
}
