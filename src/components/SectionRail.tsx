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

export function SectionRail({ active, onChange, variant = "rail" }: Props) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const picker = variant === "picker";
  return (
    <nav
      className={`cr-scroll resume-section-nav resume-section-nav--${variant}`}
      aria-label="Resume sections"
    >
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-current={s.id === active ? "page" : undefined}
            aria-label={picker ? undefined : s.label}
            title={picker ? undefined : s.label}
            className="cr-section-nav-button resume-section-link"
          >
            <Icon aria-hidden="true" size={18} strokeWidth={1.6} />
            {picker && (
              <>
                <span className="resume-section-copy">
                  <span>{s.label}</span>
                  <small>{s.description}</small>
                </span>
                <ChevronRight aria-hidden="true" size={18} strokeWidth={1.6} />
              </>
            )}
          </button>
        );
      })}
      {!picker && (
        <>
          <div className="resume-rail-spacer" />
          <button
            type="button"
            onClick={(event) => {
              event.currentTarget.focus();
              setPrivacyOpen(true);
            }}
            className="cr-section-nav-button resume-section-link"
            aria-label="Privacy policy"
            title="Privacy policy"
          >
            <ShieldCheck aria-hidden="true" size={18} strokeWidth={1.6} />
          </button>
          <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        </>
      )}
    </nav>
  );
}
