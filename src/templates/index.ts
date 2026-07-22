/**
 * Template registry.
 *
 * Adding a new template: create its component in this folder, import
 * it here, add an entry to TEMPLATES, and extend the `TemplateId` union
 * in types.ts. `level` is the ideal experience-level hint shown under
 * the name in the picker, `category` groups it in the picker sidebar,
 * and `badge` is an optional marketing tag.
 */

import { lazy, type ComponentType } from "react";
import type { ResumeData, TemplateCategory, TemplateId, TemplateMeta } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";

// Keep every path literal so Vite can emit one predictable chunk per template.
// React.lazy caches both the import promise and resolved component, so the live
// editor and gallery share each loaded module without repeat network work.
const Academic = lazy(() =>
  import("./Academic.tsx").then(({ Academic: component }) => ({ default: component })),
);
const AtsPlain = lazy(() =>
  import("./AtsPlain.tsx").then(({ AtsPlain: component }) => ({ default: component })),
);
const AtsProfessional = lazy(() =>
  import("./AtsProfessional.tsx").then(({ AtsProfessional: component }) => ({
    default: component,
  })),
);
const Aurora = lazy(() =>
  import("./Aurora.tsx").then(({ Aurora: component }) => ({ default: component })),
);
const Bauhaus = lazy(() =>
  import("./Bauhaus.tsx").then(({ Bauhaus: component }) => ({ default: component })),
);
const ClassicSidebar = lazy(() =>
  import("./ClassicSidebar.tsx").then(({ ClassicSidebar: component }) => ({
    default: component,
  })),
);
const CompactTimeline = lazy(() =>
  import("./CompactTimeline.tsx").then(({ CompactTimeline: component }) => ({
    default: component,
  })),
);
const ExecutiveSerif = lazy(() =>
  import("./ExecutiveSerif.tsx").then(({ ExecutiveSerif: component }) => ({
    default: component,
  })),
);
const GradientHeader = lazy(() =>
  import("./GradientHeader.tsx").then(({ GradientHeader: component }) => ({
    default: component,
  })),
);
const Horizon = lazy(() =>
  import("./Horizon.tsx").then(({ Horizon: component }) => ({ default: component })),
);
const Minimalist = lazy(() =>
  import("./Minimalist.tsx").then(({ Minimalist: component }) => ({ default: component })),
);
const ModernMinimal = lazy(() =>
  import("./ModernMinimal.tsx").then(({ ModernMinimal: component }) => ({
    default: component,
  })),
);
const Monograph = lazy(() =>
  import("./Monograph.tsx").then(({ Monograph: component }) => ({ default: component })),
);
const Prism = lazy(() =>
  import("./Prism.tsx").then(({ Prism: component }) => ({ default: component })),
);
const Typographic = lazy(() =>
  import("./Typographic.tsx").then(({ Typographic: component }) => ({ default: component })),
);

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
    accent: "#047857",
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
  monograph: {
    id: "monograph",
    name: "Monograph",
    description: "Editorial serif · Warm sidebar",
    accent: "#44403C",
    level: "Senior professionals · Consultants · Legal",
    category: "classic",
    badge: { label: "New", tone: "brand" },
    component: Monograph,
  },
  "ats-professional": {
    id: "ats-professional",
    name: "ATS Professional",
    description: "Single column · Subtle accent",
    accent: "#047857",
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
    accent: "#047857",
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
  prism: {
    id: "prism",
    name: "Prism",
    description: "Solid accent sidebar · Crisp sans",
    accent: "#0284C7",
    level: "Product · Engineering · Data · 3–12 years",
    category: "modern",
    badge: { label: "New", tone: "brand" },
    component: Prism,
  },
  horizon: {
    id: "horizon",
    name: "Horizon",
    description: "Light sidebar · Pill headers · Timeline",
    accent: "#14B8A6",
    level: "Design · Product · Tech · 3–12 years",
    category: "modern",
    badge: { label: "New", tone: "brand" },
    component: Horizon,
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
