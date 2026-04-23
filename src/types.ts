/**
 * Shared TypeScript type definitions for the resume builder.
 *
 * The `ResumeData` shape is deliberately flat and template-agnostic —
 * every template consumes the same data and renders its own layout.
 */

export interface ContactLink {
  /** Stable identifier — used for React keys and for looking up icons. */
  id: string;
  /** Label shown to the reader (e.g. "email", "phone"). */
  kind:
    | "email"
    | "phone"
    | "location"
    | "website"
    | "linkedin"
    | "github"
    | "twitter"
    | "medium"
    | "other";
  /** The actual value (e.g. "sumitsahoo1988@gmail.com"). */
  value: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string; // comma-separated for ergonomic editing
  /** Optional Lucide icon name rendered beside the group label in supported templates. */
  iconName?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start: string; // free-form (e.g. "Mar 2020")
  end: string; // "Present" or date
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  detail: string; // e.g. "8.11 CGPA"
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  role?: string;
  stack: string[];
}

export interface Certification {
  id: string;
  issuer: string;
  name: string;
  year: string;
  /** Optional verification / credential link (e.g. Credly badge URL). */
  url?: string;
}

export interface AwardItem {
  id: string;
  title: string;
  year: string;
  detail: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface CustomSection {
  id: string;
  /** Custom heading label the user provides (e.g. "Volunteering", "Publications"). */
  header: string;
  /** Free-form bullet list. A single bullet renders as a paragraph in templates. */
  bullets: string[];
}

export interface ResumeData {
  /** Top-of-resume identity block. */
  profile: {
    name: string;
    title: string; // headline / role tagline
    photoUrl?: string;
    /** Optional Lucide icon name rendered as a header logo in supported templates. */
    logoIconName?: string;
    summary: string;
  };
  contact: ContactLink[];
  skills: SkillGroup[];
  experience: Experience[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: Certification[];
  awards: AwardItem[];
  languages: LanguageItem[];
  interests: string[];
  tools: string[];
  /** Optional override for the "Interests" heading in templates that render one. */
  interestsLabel?: string;
  /** Optional override for the "Tools" heading in templates that render one. */
  toolsLabel?: string;
  /** One-line extras shown in quick-stat sidebars. */
  quickStats: { id: string; value: string; label: string }[];
  /** Free-form fields rendered at the end (e.g. Visa status). */
  extras: { id: string; label: string; value: string }[];
  /** User-defined sections with custom header + bullets (e.g. Volunteering, Publications). */
  custom: CustomSection[];
}

export type TemplateId =
  | "classic-sidebar"
  | "modern-minimal"
  | "executive-serif"
  | "compact-timeline"
  | "gradient-header"
  | "academic"
  | "ats-plain"
  | "ats-professional"
  | "minimalist"
  | "typographic"
  | "aurora"
  | "bauhaus"
  | "monograph"
  | "prism";

/** Broad design family used to group templates in the picker. */
export type TemplateCategory = "ats" | "classic" | "modern" | "creative" | "academic";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  /** Suggested accent colour that pairs well with the layout. */
  accent: string;
  /** Ideal experience level — shown as a hint inside the template picker. */
  level: string;
  /** Design family used to group templates in the picker. */
  category: TemplateCategory;
  /** Optional marketing badge (e.g. "Recommended", "New", "ATS-safe"). */
  badge?: { label: string; tone: "brand" | "ats" };
}

export interface AtsIssue {
  severity: "info" | "warn" | "fail";
  message: string;
  /** Optional actionable suggestion. */
  suggestion?: string;
}

export interface AtsBreakdownItem {
  category: string;
  earned: number;
  max: number;
  note: string;
}

export interface AtsReport {
  /** Machine-parseability score: structure, contact, keywords, formatting. 0–100. */
  atsScore: number;
  /** Categories contributing to `atsScore`. */
  atsBreakdown: AtsBreakdownItem[];
  /**
   * Writing-polish score: spelling, grammar, style, readability. 0–100.
   * 0 (and `writingReady: false`) until the Harper scan finishes.
   */
  writingScore: number;
  /** Categories contributing to `writingScore`. */
  writingBreakdown: AtsBreakdownItem[];
  /** True once the writing pass has produced a scorable result. */
  writingReady: boolean;
  issues: AtsIssue[];
  wins: string[];
  keywords: { matched: string[]; missing: string[] };
  /** Per-word / per-phrase grammar findings. Present once the scan has run. */
  grammar?: GrammarReport;
}

/** One piece of prose sent to the grammar worker for analysis. */
export interface GrammarSegment {
  id: string;
  /** Human-readable label shown in the Insights tab (e.g. "Senior Engineer · bullet 2"). */
  label: string;
  text: string;
}

export type GrammarIssueKind = "spelling" | "grammar" | "style" | "readability";

export interface GrammarIssue {
  segmentId: string;
  segmentLabel: string;
  kind: GrammarIssueKind;
  /** The offending word or phrase surfaced by retext. */
  actual: string;
  /** Suggested replacements (only meaningful for spelling & repeated-word issues). */
  suggestions: string[];
  /** Raw message from retext, used as a fallback when we can't craft a friendlier one. */
  reason: string;
}

export interface GrammarReport {
  issues: GrammarIssue[];
  /** Total word count the worker inspected — used to scale severity in the ATS score. */
  wordsChecked: number;
}
