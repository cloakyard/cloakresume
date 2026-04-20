/**
 * Mobile/tablet overflow menu — bottom-sheet bundling the toolbar items
 * that don't fit in the header chrome on small screens.
 *
 * Template and Colour open their respective surfaces via window events
 * (`cr:open-template-picker`, `cr:open-color-picker`) handled inside
 * `ToolbarCenter`. Keeps the sheet stateless and picker logic in one place.
 */

import {
  FilePlus2,
  LayoutTemplate,
  MoreHorizontal,
  Palette,
  Save,
  ScanSearch,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { BP, useMediaQuery } from "../utils/useMediaQuery.ts";
import { BottomSheet } from "./BottomSheet.tsx";
import { ColorPickerContent } from "./ColorPickerContent.tsx";
import { GithubIcon } from "./GithubIcon.tsx";

interface ToolbarOverflowProps {
  primary: string;
  onPrimaryChange: (hex: string) => void;
  onNewResume: () => void;
  onSaveFile: () => void;
  onLoadFile: (file: File) => void;
}

export function ToolbarOverflow({
  primary,
  onPrimaryChange,
  onNewResume,
  onSaveFile,
  onLoadFile,
}: ToolbarOverflowProps) {
  const isMobile = useMediaQuery(BP.mobile);
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openTemplate = () => {
    setOpen(false);
    window.dispatchEvent(new Event("cr:open-template-picker"));
  };

  if (!isMobile) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tb ghost"
        aria-label="More options"
        aria-haspopup="menu"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <input
        ref={fileRef}
        type="file"
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
            icon={<ScanSearch className="w-4 h-4" style={{ color: "var(--brand)" }} />}
            label="Scan ATS"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("cr:scan-ats"));
            }}
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
                style={{ background: primary, border: "1px solid rgba(0,0,0,0.08)" }}
              />
            }
            onClick={() => setColorOpen(true)}
          />
          <OverflowDivider />
          <OverflowItem
            icon={<FilePlus2 className="w-4 h-4" />}
            label="New résumé"
            onClick={() => {
              setOpen(false);
              onNewResume();
            }}
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
          <OverflowDivider />
          <OverflowItem
            icon={<GithubIcon className="w-4 h-4" />}
            label="View on GitHub"
            href="https://github.com/cloakyard/cloakresume"
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
  "appearance-none flex items-center gap-3 w-full px-3 py-3 min-h-13",
  "border-0 rounded-lg text-left cursor-pointer bg-transparent",
  "text-[14.5px] font-medium text-(--ink-1) no-underline",
  "transition-[background-color] duration-150",
  "hover:bg-(--ink-1)/4 active:bg-(--ink-1)/6",
].join(" ");

function OverflowItem({
  icon,
  label,
  onClick,
  trailing,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid place-items-center w-9 h-9 rounded-md shrink-0 bg-(--ink-1)/5 text-(--ink-2)"
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">{label}</span>
      {trailing && <span className="flex items-center shrink-0">{trailing}</span>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        className={overflowItemClass}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} role="menuitem" className={overflowItemClass}>
      {content}
    </button>
  );
}

function OverflowDivider() {
  return <hr className="my-2 mx-2 border-0 border-t border-(--ink-1)/8 h-0" />;
}
