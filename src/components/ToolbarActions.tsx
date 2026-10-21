/**
 * Right-hand toolbar cluster: Scan résumé · New · Save · Load · Export PDF.
 *
 * Desktop shows the full cluster. Mobile renders nothing — the Export PDF
 * primary action and the secondary actions all live in `ToolbarOverflow`,
 * keeping the mobile header to brand + view-toggle + 3-dot menu.
 */

import { Download, FilePlus2, Save, ScanSearch, Upload } from "lucide-react";
import { useRef } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";

interface ToolbarActionsProps {
  onExportPdf: () => void;
  exporting?: boolean;
  onSaveFile: () => void;
  onLoadFile: (file: File) => void;
  onNewResume: () => void;
  onScanAts: () => void;
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="resume-header-divider" />;
}

export function ToolbarActions({
  onExportPdf,
  exporting = false,
  onSaveFile,
  onLoadFile,
  onNewResume,
  onScanAts,
}: ToolbarActionsProps) {
  const loadInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery(BP.mobile);

  if (isMobile) return null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget.focus();
          onScanAts();
        }}
        className="air-icon-button air-button--quiet resume-toolbar-action"
        title="Scan résumé for ATS and writing issues"
        aria-label="Scan résumé for ATS and writing issues"
      >
        <ScanSearch aria-hidden="true" size={18} strokeWidth={1.6} />
        <span className="resume-toolbar-label">Scan résumé</span>
      </button>

      <ToolbarDivider />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onNewResume}
          className="air-icon-button air-button--quiet resume-toolbar-action"
          title="Start a new blank resume"
          aria-label="Start a new blank resume"
        >
          <FilePlus2 aria-hidden="true" size={18} strokeWidth={1.6} />
          <span className="resume-toolbar-label">New</span>
        </button>
        <button
          type="button"
          onClick={onSaveFile}
          className="air-icon-button air-button--quiet resume-toolbar-action"
          title="Save resume data as JSON file"
          aria-label="Save resume data as JSON file"
        >
          <Save aria-hidden="true" size={18} strokeWidth={1.6} />
          <span className="resume-toolbar-label">Save</span>
        </button>
        <button
          type="button"
          onClick={() => loadInputRef.current?.click()}
          className="air-icon-button air-button--quiet resume-toolbar-action"
          title="Load a previously saved resume file"
          aria-label="Load a previously saved resume file"
        >
          <Upload aria-hidden="true" size={18} strokeWidth={1.6} />
          <span className="resume-toolbar-label">Load</span>
        </button>
      </div>

      <ToolbarDivider />

      <input
        ref={loadInputRef}
        type="file"
        name="resume-file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onLoadFile(f);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={onExportPdf}
        disabled={exporting}
        aria-busy={exporting}
        className="air-icon-button air-button--primary resume-toolbar-action"
        aria-label="Export to PDF"
        title={exporting ? "Exporting PDF…" : "Export to PDF"}
      >
        <Download aria-hidden="true" size={18} strokeWidth={1.6} />
        <span className="resume-toolbar-label">{exporting ? "Exporting…" : "Export PDF"}</span>
      </button>
    </>
  );
}
