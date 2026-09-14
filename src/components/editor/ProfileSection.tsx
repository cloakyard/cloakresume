/** Profile section: avatar/photo + name + headline + logo + summary. */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const readerRef = useRef<FileReader | null>(null);
  const photoRequest = useRef(0);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const updateProfile = (partial: Partial<ResumeData["profile"]>) =>
    patch("profile", { ...resume.profile, ...partial });
  const updateProfileRef = useRef(updateProfile);
  useLayoutEffect(() => {
    updateProfileRef.current = updateProfile;
  });
  useEffect(
    () => () => {
      photoRequest.current++;
      readerRef.current?.abort();
    },
    [],
  );

  const handlePhotoUpload = (file: File) => {
    const request = ++photoRequest.current;
    readerRef.current?.abort();
    setPhotoError(null);
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Choose a JPG or PNG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("This photo exceeds 2 MB. Choose a smaller JPG or PNG image.");
      return;
    }
    const reader = new FileReader();
    readerRef.current = reader;
    const fail = () => {
      if (request === photoRequest.current)
        setPhotoError("This image could not be opened. Choose another JPG or PNG.");
    };
    reader.onerror = fail;
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const image = new Image();
        image.onload = () => {
          if (request === photoRequest.current) updateProfileRef.current({ photoUrl: result });
        };
        image.onerror = fail;
        image.src = result;
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
            className="w-20 h-20 rounded-full grid place-items-center text-(--color-accent-ink) font-semibold text-xl shrink-0"
            style={{
              background: resume.profile.photoUrl ? "transparent" : "var(--color-accent)",
              border: "2px solid var(--color-rule)",
              overflow: "hidden",
            }}
          >
            {resume.profile.photoUrl ? (
              <img
                src={resume.profile.photoUrl}
                alt={`${resume.profile.name || "Profile"} portrait`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-(--color-accent-ink)">{initials}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 min-h-11 md:min-h-10 px-3 rounded-md text-sm font-medium text-(--ink-1) bg-(--surface-2) border border-(--line) transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-(--ink-4)" />
              {resume.profile.photoUrl ? "Change photo" : "Add photo"}
            </button>
            <span className="text-[11px] text-(--ink-5)">JPG or PNG · max 2 MB</span>
            {resume.profile.photoUrl && (
              <button
                type="button"
                onClick={() => {
                  photoRequest.current++;
                  readerRef.current?.abort();
                  setPhotoError(null);
                  updateProfile({ photoUrl: undefined });
                }}
                className="min-h-11 md:min-h-10 px-2 rounded-md text-sm text-(--ink-4) hover:text-(--color-status-danger) hover:bg-(--color-status-danger-soft) text-left transition-colors"
              >
                Remove photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              name="profile-photo"
              aria-label="Upload profile photo"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
                e.target.value = "";
              }}
            />
            {photoError && (
              <p role="alert" className="cr-field-hint cr-field-hint--error">
                {photoError}
              </p>
            )}
          </div>
        </div>

        <TextField
          label="Full name"
          name="profile-name"
          autoComplete="name"
          value={resume.profile.name}
          onChange={(v) => updateProfile({ name: v })}
        />
        <TextField
          label="Title / headline"
          name="profile-headline"
          autoComplete="organization-title"
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

        <div>
          <div className="cr-field-row">
            <span className="cr-field-label">Professional summary</span>
            <FormatToolbar />
          </div>
          <RichTextArea
            ariaLabel="Professional summary"
            fieldId="profile.summary"
            value={resume.profile.summary}
            onChange={(v) => updateProfile({ summary: v })}
            rows={8}
          />
          <div className="text-sm text-(--ink-4) mt-2">
            Tip: wrap text in **bold** or *italic* for emphasis.
          </div>
        </div>
      </div>
    </FormatScope>
  );
}
