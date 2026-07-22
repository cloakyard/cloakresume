/**
 * Mobile/tablet overflow menu — bottom-sheet bundling the toolbar items
 * that don't fit in the header chrome on small screens.
 *
 * Template and Colour open their respective surfaces via window events
 * (`cr:open-template-picker`, `cr:open-color-picker`) handled inside
 * `ToolbarCenter`. Keeps the sheet stateless and picker logic in one place.
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
import { useRef, useState } from "react";
import { type PaperSize } from "../utils/paperSize.ts";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { BottomSheet } from "./BottomSheet.tsx";
import { ColorPickerContent } from "./ColorPickerContent.tsx";
import { PaperSizeToggle } from "./PaperSizeToggle.tsx";

interface ToolbarOverflowProps {
  primary: string;
  onPrimaryChange: (hex: string) => void;
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  onExportPdf: () => void;
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
  onNewResume,
  onSaveFile,
  onLoadFile,
}: ToolbarOverflowProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const closeThenOpen = (next: () => void) => {
    setOpen(false);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(next, reduceMotion ? 0 : 200);
  };

  const openTemplate = () => {
    closeThenOpen(() => window.dispatchEvent(new Event("cr:open-template-picker")));
  };

  if (!isMobile) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border-0 bg-transparent text-(--ink-3) transition-colors hover:bg-(--surface-3) hover:text-(--ink-1)"
        aria-label="More options"
        aria-haspopup="dialog"
      >
        <MoreVertical className="w-4.5 h-4.5" strokeWidth={2} />
      </button>

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
            onLoadFile(f);
            setOpen(false);
          }
          e.target.value = "";
        }}
      />

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Options">
        <div className="flex flex-col gap-0.5">
          <OverflowItem
            icon={<Download className="w-4 h-4" style={{ color: "var(--brand)" }} />}
            label="Export PDF"
            onClick={() => {
              setOpen(false);
              onExportPdf();
            }}
          />
          <OverflowItem
            icon={<ScanSearch className="w-4 h-4" style={{ color: "var(--brand)" }} />}
            label="Scan résumé"
            onClick={() => closeThenOpen(() => window.dispatchEvent(new Event("cr:scan-ats")))}
          />
          <OverflowDivider />
          <OverflowItem
            icon={<LayoutTemplate className="w-4 h-4" />}
            label="Template"
            onClick={openTemplate}
          />
          <OverflowItem
            icon={<Palette className="w-4 h-4" />}
            label="Primary colour"
            trailing={
              <span
                className="w-4 h-4 rounded-full"
                style={{ background: primary, border: "1px solid var(--color-rule-strong)" }}
              />
            }
            onClick={() => closeThenOpen(() => setColorOpen(true))}
          />
          <OverflowRow icon={<FileText className="w-4 h-4" />} label="Paper size">
            <PaperSizeToggle value={paperSize} onChange={onPaperSizeChange} size="lg" />
          </OverflowRow>
          <OverflowDivider />
          <OverflowItem
            icon={<FilePlus2 className="w-4 h-4" />}
            label="New résumé"
            onClick={() => closeThenOpen(onNewResume)}
          />
          <OverflowItem
            icon={<Save className="w-4 h-4" />}
            label="Save to file"
            onClick={() => {
              setOpen(false);
              onSaveFile();
            }}
          />
          <OverflowItem
            icon={<Upload className="w-4 h-4" />}
            label="Load from file"
            onClick={() => fileRef.current?.click()}
          />
        </div>
      </BottomSheet>

      <BottomSheet open={colorOpen} onClose={() => setColorOpen(false)} title="Primary colour">
        <ColorPickerContent primary={primary} onChange={onPrimaryChange} />
      </BottomSheet>
    </>
  );
}

const overflowItemClass = [
  "cr-overflow-item",
  "appearance-none flex items-center gap-3 w-full px-3 py-3 min-h-13",
  "border-0 rounded-md text-left cursor-pointer bg-transparent",
  "text-[14.5px] font-medium text-(--ink-1) no-underline",
  "transition-[background-color] duration-160",
  "hover:bg-(--ink-1)/4 active:bg-(--ink-1)/6",
].join(" ");

function OverflowItem({
  icon,
  label,
  onClick,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={overflowItemClass}>
      <span aria-hidden="true" className="grid place-items-center w-6 h-6 shrink-0 text-(--ink-2)">
        {icon}
      </span>
      <span className="flex-1 min-w-0">{label}</span>
      {trailing && <span className="flex items-center shrink-0">{trailing}</span>}
    </button>
  );
}

function OverflowDivider() {
  return <hr className="my-2 mx-2 border-0 border-t border-(--line) h-0" />;
}

/**
 * Non-button overflow row — same visual grid as OverflowItem but hosts
 * interactive trailing content (e.g. a segmented toggle) without
 * wrapping the whole row in a `<button>`.
 */
function OverflowRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 w-full px-3 py-3 min-h-13 rounded-md">
      <span aria-hidden="true" className="grid place-items-center w-6 h-6 shrink-0 text-(--ink-2)">
        {icon}
      </span>
      <span className="flex-1 min-w-0 text-[14.5px] font-medium text-(--ink-1)">{label}</span>
      <span className="flex items-center shrink-0">{children}</span>
    </div>
  );
}
