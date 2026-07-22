/**
 * Section navigation — two layouts driven by one `variant` prop.
 *
 *   • `rail` (default, desktop) — icon-only vertical column pinned to
 *     the left of the shell.
 *   • `picker` (mobile) — a full-width list with icon + label + short
 *     description, rendered in the lower half of the mobile workbench.
 *
 * Keeping both surfaces in a single component avoids the list and the
 * rail drifting as sections are added or relabelled.
 */

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  BarChart3,
  Briefcase,
  ChevronRight,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  type LucideIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal.tsx";

export type SectionId =
  | "profile"
  | "contact"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "certifications"
  | "awards"
  | "languages"
  | "interests"
  | "stats"
  | "custom"
  | "jd";

export interface SectionMeta {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Single source of truth for the section list, also consumed by the panel. */
export const SECTIONS: SectionMeta[] = [
  { id: "profile", label: "Profile", description: "Name, headline, logo, and summary", icon: User },
  {
    id: "contact",
    label: "Contact",
    description: "Email, phone, location, social links",
    icon: Mail,
  },
  {
    id: "experience",
    label: "Experience",
    description: "Roles, companies, dates, achievements",
    icon: Briefcase,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Technical expertise grouped by category",
    icon: Sparkles,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Notable work with description, role, and stack",
    icon: Folder,
  },
  {
    id: "education",
    label: "Education",
    description: "Degrees, schools, dates, and CGPA",
    icon: GraduationCap,
  },
  {
    id: "certifications",
    label: "Certifications",
    description: "Professional certifications and licences",
    icon: BadgeCheck,
  },
  {
    id: "awards",
    label: "Awards",
    description: "Honours, recognition, and achievements",
    icon: Award,
  },
  {
    id: "languages",
    label: "Languages",
    description: "Languages you speak and proficiency level",
    icon: Globe,
  },
  {
    id: "interests",
    label: "Interests & Tools",
    description: "Personal interests and daily tools",
    icon: Heart,
  },
  {
    id: "stats",
    label: "Quick stats",
    description: "Headline stats plus miscellaneous fields",
    icon: BarChart3,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Your own sections — volunteering, publications, anything personal",
    icon: Layers,
  },
  {
    id: "jd",
    label: "Target JD",
    description: "Paste a JD to check ATS keyword coverage",
    icon: Target,
  },
];

interface Props {
  active: SectionId;
  onChange: (id: SectionId) => void;
  /** Layout: condensed icon rail (default) or full list for the mobile picker. */
  variant?: "rail" | "picker";
}

/**
 * Structural styles shared by every rail tile — layout, size, focus.
 * Kept free of colour utilities so the active/inactive variants below
 * fully own bg/text without fighting Tailwind's compiled-rule ordering.
 */
const railButtonBase = [
  "relative grid place-items-center w-11 h-11 shrink-0 rounded-md",
  "border border-transparent cursor-pointer",
  "transition-[background-color,border-color,color] duration-160",
  "focus-visible:outline-none focus-visible:shadow-(--sh-focus)",
].join(" ");

/** Resting tile: transparent background, muted glyph, subtle hover. */
const railButtonInactive = [
  "bg-transparent text-(--ink-4)",
  "hover:bg-(--surface-3) hover:text-(--ink-1)",
].join(" ");

/**
 * Active tile. Reads clearly as "selected" without overpowering the rail:
 *   • soft brand-tinted background with the brand-coloured glyph (icon
 *     stays readable, tile doesn't turn into a solid block)
 *   • 1px inset brand ring for a crisp edge
 *   • one-pixel edge marker shared with the CloakPDF rail
 */
const railButtonActive = [
  "bg-(--brand-50) text-(--brand) border-(--brand-100)",
  "hover:bg-(--brand-100) hover:text-(--brand-700)",
  "before:content-[''] before:absolute before:left-[-14px] before:inset-y-0",
  "before:w-px before:bg-(--brand)",
].join(" ");

export function SectionRail({ active, onChange, variant = "rail" }: Props) {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  if (variant === "picker") {
    return (
      <nav className="flex flex-col gap-1" aria-label="Resume sections">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "appearance-none flex items-center gap-3 w-full px-3 py-3 min-h-15",
                "border border-transparent rounded-md text-left cursor-pointer",
                "transition-[background-color,border-color] duration-160",
                isActive
                  ? "bg-(--brand-50)/85 border-(--brand-100)"
                  : "bg-transparent hover:bg-(--ink-1)/4 active:bg-(--ink-1)/6",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="grid h-10 w-7 shrink-0 place-items-center text-(--brand)"
              >
                <Icon className="w-4.5 h-4.5" strokeWidth={2} />
              </span>
              <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span
                  className={[
                    "text-[14.5px] font-semibold tracking-[-0.005em]",
                    isActive ? "text-(--brand-700)" : "text-(--ink-1)",
                  ].join(" ")}
                >
                  {s.label}
                </span>
                <span className="truncate text-sm leading-[1.4] text-(--ink-4)">
                  {s.description}
                </span>
              </span>
              <ChevronRight
                className={[
                  "w-4 h-4 shrink-0 transition-[color,transform] duration-160",
                  isActive ? "text-(--brand) translate-x-0.5" : "text-(--ink-5)",
                ].join(" ")}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className="cr-scroll flex h-full w-full flex-col items-center gap-0.5 overflow-y-auto print:hidden"
      aria-label="Resume sections"
    >
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={s.label}
            title={s.label}
            className={[railButtonBase, isActive ? railButtonActive : railButtonInactive].join(" ")}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
          </button>
        );
      })}
      <div className="flex-1" />
      <div className="w-6 h-px bg-(--line) my-2" />
      <button
        type="button"
        onClick={() => setPrivacyOpen(true)}
        className={`${railButtonBase} ${railButtonInactive}`}
        aria-label="Privacy policy"
        title="Privacy policy"
      >
        <ShieldCheck className="w-4 h-4" strokeWidth={2} />
      </button>
      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </nav>
  );
}
