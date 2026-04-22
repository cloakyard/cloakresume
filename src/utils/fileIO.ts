/**
 * File save/load helpers for resume state.
 *
 * The "save" path serialises the full app state (resume body + chosen
 * template + primary colour + optional JD) into a downloadable JSON
 * file so the user can archive or move their work between browsers.
 * "Load" reads a previously saved file back into the same shape,
 * validates the minimum fields, and hands it to the caller.
 */

import type { ResumeData, TemplateId } from "../types.ts";

export interface ResumeSaveFile {
  /** Discriminator so we can evolve the schema later. */
  kind: "cloakresume.v1";
  savedAt: string; // ISO timestamp
  resume: ResumeData;
  templateId: TemplateId;
  primary: string;
  jobDescription: string;
}

/** Sanitise a candidate filename — strip anything filesystem-hostile. */
export function safeFilename(input: string): string {
  const cleaned = input
    .trim()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return cleaned || "resume";
}

/** Trigger a download of the resume state as a JSON file. */
export function downloadResumeFile(payload: Omit<ResumeSaveFile, "kind" | "savedAt">): void {
  const file: ResumeSaveFile = {
    kind: "cloakresume.v1",
    savedAt: new Date().toISOString(),
    ...payload,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const namePart = safeFilename(payload.resume.profile.name || "resume");
  const datePart = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${namePart}-${datePart}.cloakresume.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Parse a previously saved file. Throws on structural mismatch. */
export async function readResumeFile(file: File): Promise<ResumeSaveFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Unexpected file shape — expected a CloakResume JSON object.");
  }
  const obj = parsed as Partial<ResumeSaveFile>;
  if (obj.kind !== "cloakresume.v1") {
    throw new Error("This doesn't look like a CloakResume save file.");
  }
  if (!obj.resume || !obj.templateId || !obj.primary) {
    throw new Error("Save file is missing required fields.");
  }
  return {
    kind: "cloakresume.v1",
    savedAt: obj.savedAt ?? new Date().toISOString(),
    resume: obj.resume,
    templateId: obj.templateId,
    primary: obj.primary,
    jobDescription: obj.jobDescription ?? "",
  };
}
