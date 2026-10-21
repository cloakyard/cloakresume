/**
 * Mobile/tablet overflow menu — bottom-sheet bundling the toolbar items
 * that don't fit in the header chrome on small screens.
 *
 * Template and review use the toolbar event bridge. Primary colour shares
 * the desktop Air picker body and opens as a compact modal surface.
 */

import {
  Download,
  FileText,
  FilePlus2,
  LayoutTemplate,
  MoreVertical,
  Palette,
  Save,
  ScanSearch,
  Upload,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { type PaperSize } from "../utils/paperSize.ts";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { OptionsDialog } from "./OptionsDialog.tsx";
import { ColorPickerPopover } from "./ColorPickerPopover.tsx";
import { PaperSizeToggle } from "./PaperSizeToggle.tsx";

interface ToolbarOverflowProps {
  primary: string;
  onPrimaryChange: (hex: string) => void;
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  onExportPdf: () => void;
  exporting?: boolean;
  exportStatus: string;
  loadingFile: boolean;
  onNewResume: () => void;
  onSaveFile: () => void;
  onLoadFile: (file: File) => void;
}

export function ToolbarOverflow({
  primary,
  onPrimaryChange,
  paperSize,
  onPaperSizeChange,
  onExportPdf,
  exporting = false,
  exportStatus,
  loadingFile,
  onNewResume,
  onSaveFile,
  onLoadFile,
}: ToolbarOverflowProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const colorId = useId();
  const optionsId = useId();
  const moreRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMobile) {
      setColorOpen(false);
      if (colorOpen)
        document.querySelector<HTMLButtonElement>('button[aria-label="Primary colour"]')?.focus();
    }
  }, [isMobile, colorOpen]);

  const closeThenOpen = (next: () => void) => {
    // Finish restoring the opener before the next modal captures it. Keep the
    // native picker in this user activation; no delayed callbacks can reopen UI.
    flushSync(() => setOpen(false));
    next();
  };

  const openTemplate = () => {
    closeThenOpen(() => {
      moreRef.current?.focus();
      window.dispatchEvent(new Event("cr:open-template-picker"));
    });
  };

  return (
    <>
      {isMobile && (
        <button
          ref={moreRef}
          type="button"
          onClick={(event) => {
            event.currentTarget.focus();
            setOpen(true);
          }}
          className="air-icon-button air-button--quiet"
          aria-label="More options"
          aria-expanded={open || colorOpen}
          aria-controls={colorOpen ? colorId : open ? optionsId : undefined}
          aria-haspopup="dialog"
        >
          <MoreVertical aria-hidden="true" size={18} strokeWidth={1.6} />
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        name="resume-file"
        aria-label="Load résumé JSON file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            closeThenOpen(() => onLoadFile(f));
          }
          e.target.value = "";
        }}
      />

      {open && (
        <OptionsDialog id={optionsId} onClose={() => setOpen(false)}>
          <div className="resume-options-actions">
            <OverflowItem
              icon={<Download />}
              label="Export PDF"
              busyLabel="Exporting PDF…"
              busy={exporting}
              onClick={onExportPdf}
              primary
            />
            <p className="resume-options-status" role="status">
              {exportStatus || "Download a PDF. Your draft stays here."}
            </p>
            <OverflowItem
              icon={<ScanSearch />}
              label="Scan résumé"
              onClick={() =>
                closeThenOpen(() => {
                  window.dispatchEvent(new Event("cr:scan-ats"));
                })
              }
            />
            <hr />
            <OverflowItem icon={<LayoutTemplate />} label="Template" onClick={openTemplate} />
            <OverflowItem
              icon={<Palette />}
              label="Primary colour"
              trailing={<span className="resume-options-swatch" style={{ background: primary }} />}
              onClick={() =>
                closeThenOpen(() => {
                  if (isMobile) setColorOpen(true);
                  else
                    document
                      .querySelector<HTMLButtonElement>('button[aria-label="Primary colour"]')
                      ?.click();
                })
              }
            />
            <div className="resume-options-paper">
              <span>
                <FileText aria-hidden="true" />
                Paper size
              </span>
              <PaperSizeToggle value={paperSize} onChange={onPaperSizeChange} />
            </div>
            <hr />
            <OverflowItem
              icon={<FilePlus2 />}
              label="New résumé"
              onClick={() => closeThenOpen(onNewResume)}
            />
            <OverflowItem
              icon={<Save />}
              label="Save to file"
              onClick={() => closeThenOpen(onSaveFile)}
            />
            <OverflowItem
              icon={<Upload />}
              label="Load from file"
              busyLabel="Opening file…"
              busy={loadingFile}
              onClick={() => fileRef.current?.click()}
            />
            <p className="resume-options-status">Open or save a CloakResume JSON file.</p>
          </div>
        </OptionsDialog>
      )}

      {colorOpen && (
        <ColorPickerPopover
          id={colorId}
          primary={primary}
          onChange={onPrimaryChange}
          onClose={() => setColorOpen(false)}
          triggerRef={moreRef}
          modal
        />
      )}
    </>
  );
}

function OverflowItem({
  icon,
  label,
  onClick,
  trailing,
  busy = false,
  busyLabel,
  primary = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  trailing?: ReactNode;
  busy?: boolean;
  busyLabel?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={busy ? busyLabel : label}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      data-export-pdf={primary ? "" : undefined}
      onClick={(event) => {
        event.currentTarget.focus();
        if (!busy) onClick();
      }}
      className={`air-button resume-options-action${primary ? " air-button--primary" : " air-button--quiet"}`}
    >
      <span aria-hidden="true" className="resume-options-icon">
        {icon}
      </span>
      <span className="air-action-labels">
        <span data-active={!busy || undefined} aria-hidden={busy || undefined}>
          {label}
        </span>
        {busyLabel && (
          <span data-active={busy || undefined} aria-hidden={!busy || undefined}>
            {busyLabel}
          </span>
        )}
      </span>
      {trailing && <span aria-hidden="true">{trailing}</span>}
    </button>
  );
}
