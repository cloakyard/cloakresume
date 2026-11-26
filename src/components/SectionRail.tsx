import { useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  LayoutGrid,
  type LucideIcon,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  X,
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
    label: "Interests & tools",
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
    description: "Compare a job description with your résumé keywords",
    icon: Target,
  },
];

interface Props {
  active: SectionId;
  onChange: (id: SectionId) => void;
}

export function SectionRail({ active, onChange }: Props) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  return (
    <nav
      className="air-scroll resume-section-nav resume-section-nav--rail"
      aria-label="Resume sections"
    >
      {SECTIONS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={id === active ? "page" : undefined}
          aria-label={label}
          title={label}
          className="cr-section-nav-button resume-section-link"
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.6} />
        </button>
      ))}
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
    </nav>
  );
}

const shortcuts = SECTIONS.filter(
  ({ id }) => id === "profile" || id === "experience" || id === "skills",
);

export function SectionDock({
  onChange,
  onBrowse,
}: Pick<Props, "onChange"> & { onBrowse: () => void }) {
  return (
    <nav className="resume-section-dock print-hide" aria-label="Section shortcuts">
      {shortcuts.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="air-button air-button--quiet"
          onClick={() => onChange(id)}
        >
          <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
          {label}
        </button>
      ))}
      <span className="resume-header-divider" aria-hidden="true" />
      <button
        type="button"
        className="air-button air-button--quiet"
        onClick={onBrowse}
        data-all-sections=""
      >
        <LayoutGrid size={18} strokeWidth={1.6} aria-hidden="true" />
        All sections
      </button>
    </nav>
  );
}

const groupHeadings: Partial<Record<SectionId, string>> = {
  profile: "Personal details",
  experience: "Work and skills",
  education: "Education and recognition",
  languages: "Additional details",
  jd: "Tailoring",
};

export function SectionPicker({
  active,
  onChange,
  onCollapse,
}: Props & { onCollapse: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const terms = filter.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const sections = SECTIONS.filter(({ label, description }) =>
    terms.every((term) => (label + " " + description).toLocaleLowerCase().includes(term)),
  );
  const applyFilter = (value: string) => {
    setFilter(value);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clear = () => {
    setQuery("");
    applyFilter("");
    inputRef.current?.focus();
  };
  return (
    <div
      className="resume-section-picker"
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || composing.current)
          return;
        if (event.key === "Escape") {
          event.preventDefault();
          if (query) clear();
          else onCollapse();
        }
      }}
    >
      <header className="resume-picker-heading">
        <h2 className="resume-section-title" tabIndex={-1}>
          Sections
        </h2>
        <button
          type="button"
          className="air-icon-button air-button--quiet"
          aria-label="Close sections"
          onClick={onCollapse}
        >
          <ChevronDown size={18} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <search aria-label="Résumé sections">
          <div className="air-field-group">
            <Search size={18} strokeWidth={1.6} aria-hidden="true" />
            <input
              className="air-field"
              ref={inputRef}
              type="search"
              name="section-search"
              aria-label="Search sections"
              placeholder="Search sections"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              value={query}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                applyFilter(event.currentTarget.value);
              }}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                if (!composing.current) applyFilter(event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (
                  event.key !== "Enter" ||
                  event.nativeEvent.isComposing ||
                  event.nativeEvent.keyCode === 229 ||
                  composing.current
                )
                  return;
                event.preventDefault();
                if (sections.length === 1) onChange(sections[0].id);
                else listRef.current?.querySelector("button")?.focus();
              }}
            />
            {query && (
              <button
                type="button"
                className="air-icon-button air-button--quiet air-field-clear"
                aria-label="Clear section search"
                onClick={clear}
              >
                <X size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            )}
          </div>
        </search>
      </header>
      <nav
        ref={listRef}
        aria-label="Resume sections"
        className="air-scroll resume-section-nav resume-section-nav--picker"
      >
        <p role="status" className={terms.length ? "resume-picker-group" : "sr-only"}>
          {sections.length
            ? `${sections.length} ${sections.length === 1 ? "section" : "sections"}`
            : "No matching sections"}
        </p>
        {sections.map(({ id, label, description, icon: Icon }) => (
          <div key={id}>
            {!terms.length && groupHeadings[id] && (
              <h3 className="resume-picker-group">{groupHeadings[id]}</h3>
            )}
            <button
              type="button"
              onClick={() => onChange(id)}
              aria-current={id === active ? "page" : undefined}
              aria-label={label}
              aria-describedby={`section-help-${id}`}
              className="cr-section-nav-button resume-section-link"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.6} />
              <span className="resume-section-copy">
                <span>{label}</span>
                <small id={`section-help-${id}`} className={terms.length ? undefined : "sr-only"}>
                  {description}
                </small>
              </span>
              <ChevronRight aria-hidden="true" size={16} strokeWidth={1.6} />
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
}
