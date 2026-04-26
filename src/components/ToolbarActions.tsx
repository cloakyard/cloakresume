/**
 * Right-hand toolbar cluster: Scan résumé · New · Save · Load · Export PDF.
 *
 * Desktop shows the full cluster. Mobile shows only the primary Export PDF
 * button — the remaining actions live in `ToolbarOverflow`.
 */

import { Download, FilePlus2, Save, ScanSearch, Upload } from "lucide-react";
import { useRef } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";

interface ToolbarActionsProps {
  onExportPdf: () => void;
  onSaveFile: () => void;
  onLoadFile: (file: File) => void;
  onNewResume: () => void;
  onScanAts: () => void;
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="w-px h-5 bg-(--line) mx-0.5" />;
}

export function ToolbarActions({
  onExportPdf,
  onSaveFile,
  onLoadFile,
  onNewResume,
  onScanAts,
}: ToolbarActionsProps) {
  const loadInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery(BP.mobile);

  return (
    <>
      {!isMobile && (
        <>
          <button
            type="button"
            onClick={onScanAts}
            className="tb ghost"
            title="Scan résumé for ATS and writing issues"
            aria-label="Scan résumé for ATS and writing issues"
          >
            <ScanSearch className="w-4 h-4 text-(--ink-4)" />
            <span className="hidden 2xl:inline">Scan résumé</span>
          </button>

          <ToolbarDivider />

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onNewResume}
              className="tb ghost"
              title="Start a new blank resume"
              aria-label="Start a new blank resume"
            >
              <FilePlus2 className="w-4 h-4 text-(--ink-4)" />
              <span className="hidden 2xl:inline">New</span>
            </button>
            <button
              type="button"
              onClick={onSaveFile}
              className="tb ghost"
              title="Save resume data as JSON file"
              aria-label="Save resume data as JSON file"
            >
              <Save className="w-4 h-4 text-(--ink-4)" />
              <span className="hidden 2xl:inline">Save</span>
            </button>
            <button
              type="button"
              onClick={() => loadInputRef.current?.click()}
              className="tb ghost"
              title="Load a previously saved resume file"
              aria-label="Load a previously saved resume file"
            >
              <Upload className="w-4 h-4 text-(--ink-4)" />
              <span className="hidden 2xl:inline">Load</span>
            </button>
          </div>

          <ToolbarDivider />

          <input
            ref={loadInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onLoadFile(f);
              e.target.value = "";
            }}
          />
        </>
      )}
      <button
        type="button"
        onClick={onExportPdf}
        className="tb primary"
        aria-label="Export to PDF"
        title="Export to PDF"
      >
        <Download className="w-4 h-4" />
        {!isMobile && <span className="hidden 2xl:inline">Export PDF</span>}
      </button>
    </>
  );
}
