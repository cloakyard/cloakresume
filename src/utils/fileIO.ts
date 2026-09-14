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
import type { ContactLink, ResumeData, TemplateId } from "../types.ts";
import { resolvePaperSize, type PaperSize } from "./paperSize.ts";
import { normalizePrimaryColor } from "./colors.ts";

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string"
    ? value
    : typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : fallback;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Recover usable rows, assigning stable, unique IDs when an imported file lacks them. */
function rows<T extends { id: string }>(
  value: unknown,
  prefix: string,
  normalize: (row: Record<string, unknown>, id: string) => T,
): T[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = record(item);
    const base = text(row.id).trim() || `${prefix}-${index}`;
    let id = base;
    for (let suffix = 1; used.has(id); suffix++) id = `${base}-${suffix}`;
    used.add(id);
    return [normalize(row, id)];
  });
}

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

/** Normalize file/storage data at the boundary so every editor and template gets a safe shape. */
export function normalizeResumeData(data: unknown): ResumeData {
  const src = record(data);
  const profile = record(src.profile);
  const contactKinds = new Set([
    "email",
    "phone",
    "location",
    "website",
    "linkedin",
    "github",
    "twitter",
    "medium",
    "other",
  ]);
  return {
    profile: {
      name: text(profile.name, blankResume.profile.name),
      title: text(profile.title, blankResume.profile.title),
      summary: text(profile.summary),
      // The upload UI stores local JPEG/PNG data only. Imported remote images
      // would make requests outside the app's private document workflow.
      photoUrl:
        typeof profile.photoUrl === "string" &&
        /^data:image\/(?:jpeg|png);base64,[a-z0-9+/=\s]+$/i.test(profile.photoUrl)
          ? profile.photoUrl
          : undefined,
      logoIconName: optionalText(profile.logoIconName),
    },
    contact: rows(src.contact, "contact", (row, id) => ({
      id,
      kind: contactKinds.has(text(row.kind)) ? (row.kind as ContactLink["kind"]) : "other",
      value: text(row.value),
    })),
    skills: rows(src.skills, "skill", (row, id) => ({
      id,
      label: text(row.label),
      items: text(row.items),
      iconName: optionalText(row.iconName),
    })),
    experience: rows(src.experience, "experience", (row, id) => ({
      id,
      title: text(row.title),
      company: text(row.company),
      location: text(row.location),
      start: text(row.start),
      end: text(row.end),
      bullets: strings(row.bullets),
    })),
    education: rows(src.education, "education", (row, id) => ({
      id,
      degree: text(row.degree),
      school: text(row.school),
      location: text(row.location),
      start: text(row.start),
      end: text(row.end),
      detail: text(row.detail),
    })),
    projects: rows(src.projects, "project", (row, id) => ({
      id,
      name: text(row.name),
      description: text(row.description),
      stack: strings(row.stack),
      roles: Array.isArray(row.roles)
        ? strings(row.roles)
        : typeof row.role === "string" && row.role.trim()
          ? [row.role]
          : [],
    })),
    certifications: rows(src.certifications, "certification", (row, id) => ({
      id,
      issuer: text(row.issuer),
      name: text(row.name),
      year: text(row.year),
      url: optionalText(row.url),
    })),
    awards: rows(src.awards, "award", (row, id) => ({
      id,
      title: text(row.title),
      year: text(row.year),
      detail: text(row.detail),
    })),
    languages: rows(src.languages, "language", (row, id) => ({
      id,
      name: text(row.name),
      level: text(row.level),
    })),
    interests: strings(src.interests),
    tools: strings(src.tools),
    interestsLabel: optionalText(src.interestsLabel),
    toolsLabel: optionalText(src.toolsLabel),
    quickStats: rows(src.quickStats, "stat", (row, id) => ({
      id,
      value: text(row.value),
      label: text(row.label),
    })),
    extras: rows(src.extras, "extra", (row, id) => ({
      id,
      label: text(row.label),
      value: text(row.value),
    })),
    custom: rows(src.custom, "custom", (row, id) => ({
      id,
      header: text(row.header),
      bullets: strings(row.bullets),
    })),
  };
}

/** Sanitise a candidate filename — strip anything filesystem-hostile. */
function safeFilename(input: string): string {
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
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Unexpected file shape — expected a CloakResume JSON object.");
  }
  const obj = parsed as Partial<ResumeSaveFile>;
  if (obj.kind !== "cloakresume.v1") {
    throw new Error("This doesn't look like a CloakResume save file.");
  }
  if (!obj.resume || typeof obj.resume !== "object" || Array.isArray(obj.resume)) {
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
    primary: normalizePrimaryColor(obj.primary),
    paperSize: resolvePaperSize(obj.paperSize),
    jobDescription: typeof obj.jobDescription === "string" ? obj.jobDescription : "",
  };
}
