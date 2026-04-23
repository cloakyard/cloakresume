/**
 * Template registry.
 *
 * Adding a new template: create its component in this folder, import
 * it here, add an entry to TEMPLATES, and extend the `TemplateId` union
 * in types.ts. `level` is the ideal experience-level hint shown under
 * the name in the picker, `category` groups it in the picker sidebar,
 * and `badge` is an optional marketing tag.
 */

import type { ComponentType } from "react";
import type { ResumeData, TemplateCategory, TemplateId, TemplateMeta } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { Academic } from "./Academic.tsx";
import { AtsPlain } from "./AtsPlain.tsx";
import { AtsProfessional } from "./AtsProfessional.tsx";
import { Aurora } from "./Aurora.tsx";
import { Bauhaus } from "./Bauhaus.tsx";
import { ClassicSidebar } from "./ClassicSidebar.tsx";
import { CompactTimeline } from "./CompactTimeline.tsx";
import { ExecutiveSerif } from "./ExecutiveSerif.tsx";
import { GradientHeader } from "./GradientHeader.tsx";
import { Minimalist } from "./Minimalist.tsx";
import { ModernMinimal } from "./ModernMinimal.tsx";
import { Typographic } from "./Typographic.tsx";

export interface TemplateProps {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export const TEMPLATES: Record<
  TemplateId,
  TemplateMeta & { component: ComponentType<TemplateProps> }
> = {
  "classic-sidebar": {
    id: "classic-sidebar",
    name: "Classic Sidebar",
    description: "Tinted sidebar · Detail-rich",
    accent: "#2563EB",
    level: "Mid–Senior · 5–15 years",
    category: "classic",
    badge: { label: "Recommended", tone: "brand" },
    component: ClassicSidebar,
  },
  "executive-serif": {
    id: "executive-serif",
    name: "Executive Serif",
    description: "Serif headings · Leadership",
    accent: "#334155",
    level: "Senior/Executive · 15+ years",
    category: "classic",
    badge: { label: "Leadership", tone: "brand" },
    component: ExecutiveSerif,
  },
  "ats-professional": {
    id: "ats-professional",
    name: "ATS Professional",
    description: "Single column · Subtle accent",
    accent: "#2563EB",
    level: "All levels · Best for online applications",
    category: "ats",
    badge: { label: "ATS-safe", tone: "ats" },
    component: AtsProfessional,
  },
  "ats-plain": {
    id: "ats-plain",
    name: "ATS Plain",
    description: "Max parseability · Black & white",
    accent: "#0B1220",
    level: "All levels · Strictest ATS filters",
    category: "ats",
    badge: { label: "ATS-safe", tone: "ats" },
    component: AtsPlain,
  },
  "modern-minimal": {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Single column · Clean tech",
    accent: "#059669",
    level: "Early–Mid · 2–8 years",
    category: "modern",
    badge: { label: "Popular", tone: "brand" },
    component: ModernMinimal,
  },
  aurora: {
    id: "aurora",
    name: "Aurora",
    description: "Mesh-gradient hero · Glass card",
    accent: "#4F46E5",
    level: "Tech · SaaS · Product · 3–10 years",
    category: "modern",
    badge: { label: "New", tone: "brand" },
    component: Aurora,
  },
  minimalist: {
    id: "minimalist",
    name: "Minimalist",
    description: "Pure type · Hairline accents",
    accent: "#1F2937",
    level: "All levels · Quiet confidence",
    category: "modern",
    component: Minimalist,
  },
  "compact-timeline": {
    id: "compact-timeline",
    name: "Compact Timeline",
    description: "Dense timeline · One-pager",
    accent: "#0D9488",
    level: "Mid-career · Content-heavy CVs",
    category: "modern",
    component: CompactTimeline,
  },
  typographic: {
    id: "typographic",
    name: "Typographic",
    description: "Numbered sections · Swiss-style",
    accent: "#DC2626",
    level: "Creative · Stands out on the pile",
    category: "creative",
    badge: { label: "New", tone: "brand" },
    component: Typographic,
  },
  bauhaus: {
    id: "bauhaus",
    name: "Bauhaus",
    description: "Geometric color-block · Editorial",
    accent: "#DC2626",
    level: "Designers · Creatives · Brand roles",
    category: "creative",
    badge: { label: "New", tone: "brand" },
    component: Bauhaus,
  },
  "gradient-header": {
    id: "gradient-header",
    name: "Gradient Header",
    description: "Bold coloured banner",
    accent: "#7C3AED",
    level: "Creative · Designers, PMs, marketers",
    category: "creative",
    component: GradientHeader,
  },
  academic: {
    id: "academic",
    name: "Academic CV",
    description: "Scholarly · Researchers & faculty",
    accent: "#B91C1C",
    level: "PhDs · Researchers · Faculty",
    category: "academic",
    component: Academic,
  },
};

export const TEMPLATE_LIST: (TemplateMeta & { component: ComponentType<TemplateProps> })[] =
  Object.values(TEMPLATES);

/** Category metadata — order here drives the order in the template picker. */
export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "ats",
    label: "ATS-Friendly",
    description: "Maximum parseability for online applications",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Timeless, professional layouts",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Clean, contemporary designs",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Stand-out templates with visual personality",
  },
  {
    id: "academic",
    label: "Academic",
    description: "Scholarly CVs for research and faculty roles",
  },
];
