/**
 * File save/load helpers for resume state.
 *
 * The "save" path serialises the full app state (resume body + chosen
 * template + primary colour + optional JD) into a downloadable JSON
 * file so the user can archive or move their work between browsers.
 * "Load" reads a previously saved file back into the same shape,
 * validates the minimum fields, and hands it to the caller.
 */

import { blankResume } from "../data/blankResume.ts";
import type { ResumeData, TemplateId } from "../types.ts";
import { resolvePaperSize, type PaperSize } from "./paperSize.ts";

export interface ResumeSaveFile {
  /** Discriminator so we can evolve the schema later. */
  kind: "cloakresume.v1";
  savedAt: string; // ISO timestamp
  resume: ResumeData;
  templateId: TemplateId;
  primary: string;
  paperSize: PaperSize;
  jobDescription: string;
}

/**
 * Fill in any missing top-level fields from the blank baseline.
 *
 * Guards the render path from partial or slightly-outdated JSON — e.g. a
 * file saved before a new section existed, or one hand-edited to remove
 * an array. Array item shape isn't deep-checked: the save-file format is
 * owned by this app, so we trust inner shapes once the discriminator
 * matches.
 */
export function normalizeResumeData(data: unknown): ResumeData {
  if (!data || typeof data !== "object") return blankResume;
  const src = data as Partial<ResumeData>;
  const profile =
    src.profile && typeof src.profile === "object"
      ? { ...blankResume.profile, ...src.profile }
      : blankResume.profile;
  const arr = <T>(value: unknown, fallback: T[]): T[] =>
    Array.isArray(value) ? (value as T[]) : fallback;
  return {
    profile,
    contact: arr(src.contact, blankResume.contact),
    skills: arr(src.skills, blankResume.skills),
    experience: arr(src.experience, blankResume.experience),
    education: arr(src.education, blankResume.education),
    projects: arr(src.projects, blankResume.projects),
    certifications: arr(src.certifications, blankResume.certifications),
    awards: arr(src.awards, blankResume.awards),
    languages: arr(src.languages, blankResume.languages),
    interests: arr(src.interests, blankResume.interests),
    tools: arr(src.tools, blankResume.tools),
    interestsLabel: typeof src.interestsLabel === "string" ? src.interestsLabel : undefined,
    toolsLabel: typeof src.toolsLabel === "string" ? src.toolsLabel : undefined,
    quickStats: arr(src.quickStats, blankResume.quickStats),
    extras: arr(src.extras, blankResume.extras),
    custom: arr(src.custom, blankResume.custom),
  };
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

/**
 * Build a date-stamped download filename like `jane-doe-2026-04-23.pdf`.
 * Extension is passed without a leading dot and may contain dots itself
 * (e.g. `cloakresume.json`).
 */
export function buildDownloadFilename(displayName: string, extension: string): string {
  const name = safeFilename(displayName || "resume");
  const date = new Date().toISOString().slice(0, 10);
  return `${name}-${date}.${extension}`;
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
  a.href = url;
  a.download = buildDownloadFilename(payload.resume.profile.name, "cloakresume.json");
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
  if (!obj.resume || typeof obj.resume !== "object") {
    throw new Error("Save file is missing resume data.");
  }
  if (typeof obj.templateId !== "string") {
    throw new Error("Save file is missing a template selection.");
  }
  return {
    kind: "cloakresume.v1",
    savedAt: typeof obj.savedAt === "string" ? obj.savedAt : new Date().toISOString(),
    resume: normalizeResumeData(obj.resume),
    templateId: obj.templateId as TemplateId,
    primary: typeof obj.primary === "string" && obj.primary ? obj.primary : "#2563EB",
    paperSize: resolvePaperSize(obj.paperSize),
    jobDescription: typeof obj.jobDescription === "string" ? obj.jobDescription : "",
  };
}
