/** Profile section: avatar/photo + name + headline + logo + summary. */

import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { ResumeData } from "../../types.ts";
import { TextArea, TextField } from "../fields.tsx";
import { PROFILE_TITLE_MAX_LINES, ProfileTitleOverflowContext } from "../../utils/profileTitle.ts";
import { RichTextArea } from "../RichTextArea.tsx";
import { FormatScope, FormatToolbar } from "../FormatScope.tsx";
import { LogoPicker } from "../LogoPicker.tsx";
import { usePatch, type SectionProps } from "./shared.tsx";

export function ProfileSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoButtonRef = useRef<HTMLButtonElement>(null);
  const photoHelpId = useId();
  const photoErrorId = useId();
  const readerRef = useRef<FileReader | null>(null);
  const photoRequest = useRef(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const titleOverflows = useContext(ProfileTitleOverflowContext);
  const tooManyTitleLines =
    resume.profile.title.split(/\r\n|\r|\n/).length > PROFILE_TITLE_MAX_LINES;

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
        <div className="resume-photo">
          <div className="resume-photo-preview">
            {resume.profile.photoUrl ? (
              <img
                src={resume.profile.photoUrl}
                alt={`${resume.profile.name || "Profile"} portrait`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="resume-photo-controls">
            <button
              ref={photoButtonRef}
              type="button"
              aria-describedby={`${photoHelpId}${photoError ? ` ${photoErrorId}` : ""}`}
              onClick={(event) => {
                event.currentTarget.focus();
                fileInputRef.current?.click();
              }}
              className="air-button"
            >
              <Camera aria-hidden="true" />
              {resume.profile.photoUrl ? "Change photo" : "Add photo"}
            </button>
            <span id={photoHelpId} className="air-help">
              JPG or PNG · max 2 MB
            </span>
            {resume.profile.photoUrl && (
              <button
                type="button"
                onClick={() => {
                  photoRequest.current++;
                  readerRef.current?.abort();
                  setPhotoError(null);
                  updateProfile({ photoUrl: undefined });
                  photoButtonRef.current?.focus();
                }}
                className="air-button air-button--quiet"
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
              <p id={photoErrorId} role="alert" className="air-help air-help--error">
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
        <TextArea
          label="Title / headline"
          name="profile-headline"
          autoComplete="organization-title"
          value={resume.profile.title}
          onChange={(v) => updateProfile({ title: v })}
          rows={PROFILE_TITLE_MAX_LINES}
          resizable={false}
          invalid={tooManyTitleLines || titleOverflows}
          hint={
            tooManyTitleLines
              ? "Use at most 4 lines. Remove extra line breaks before exporting."
              : titleOverflows
                ? "This title wraps beyond 4 lines in this template. Shorten it or adjust the line breaks before exporting."
                : "Press Enter to choose line breaks. Your title must fit within 4 lines in the résumé."
          }
        />

        <div className="cr-field">
          <span className="air-label">Header logo (optional)</span>
          <LogoPicker
            value={resume.profile.logoIconName}
            onChange={(name) => updateProfile({ logoIconName: name })}
          />
        </div>

        <div className="cr-field">
          <div className="cr-field-row">
            <span className="air-label">Professional summary</span>
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
            Select text to apply bold, italic, underline, or code.
          </div>
        </div>
      </div>
    </FormatScope>
  );
}
