/** Profile section: avatar/photo + name + headline + logo + summary. */

import { useRef } from "react";
import { Camera } from "lucide-react";
import type { ResumeData } from "../../types.ts";
import { TextField } from "../fields.tsx";
import { RichTextArea } from "../RichTextArea.tsx";
import { FormatScope, FormatToolbar } from "../FormatScope.tsx";
import { LogoPicker } from "../LogoPicker.tsx";
import { usePatch, type SectionProps } from "./shared.tsx";

export function ProfileSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = (partial: Partial<ResumeData["profile"]>) =>
    patch("profile", { ...resume.profile, ...partial });

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        updateProfile({ photoUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const initials =
    resume.profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <FormatScope>
      <div className="cr-stack">
        <div className="flex items-center gap-4 pb-2">
          <div
            className="w-20 h-20 rounded-full grid place-items-center text-white font-semibold text-xl shrink-0"
            style={{
              background: resume.profile.photoUrl
                ? "transparent"
                : "linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)",
              border: "2px solid var(--line)",
              overflow: "hidden",
            }}
          >
            {resume.profile.photoUrl ? (
              <img src={resume.profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">{initials}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12.5px] font-medium text-(--ink-1) bg-(--surface-2) border border-(--line) transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-(--ink-4)" />
              {resume.profile.photoUrl ? "Change photo" : "Add photo"}
            </button>
            <span className="text-[11px] text-(--ink-5)">JPG or PNG · max 2 MB</span>
            {resume.profile.photoUrl && (
              <button
                type="button"
                onClick={() => updateProfile({ photoUrl: undefined })}
                className="text-[11px] text-(--ink-4) hover:text-(--danger) text-left"
              >
                Remove photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <TextField
          label="Full name"
          value={resume.profile.name}
          onChange={(v) => updateProfile({ name: v })}
        />
        <TextField
          label="Title / headline"
          value={resume.profile.title}
          onChange={(v) => updateProfile({ title: v })}
        />

        <div>
          <span className="cr-field-label">Header logo (optional)</span>
          <LogoPicker
            value={resume.profile.logoIconName}
            onChange={(name) => updateProfile({ logoIconName: name })}
          />
        </div>

        <div data-field-id="profile.summary">
          <div className="cr-field-row">
            <span className="cr-field-label">Professional summary</span>
            <FormatToolbar />
          </div>
          <RichTextArea
            value={resume.profile.summary}
            onChange={(v) => updateProfile({ summary: v })}
            rows={8}
          />
          <div className="text-[11px] text-(--ink-5) mt-2">
            Tip: wrap text in **bold** or *italic* for emphasis.
          </div>
        </div>
      </div>
    </FormatScope>
  );
}
