/**
 * Section router for the active rail item.
 *
 * The icon-only left rail picks ONE section at a time. This component
 * selects the matching per-section editor in `./editor/` — each section
 * owns its own form body and its own immutable update logic.
 */

import type { ResumeData } from "../types.ts";
import type { SectionId } from "./SectionRail.tsx";
import { ProfileSection } from "./editor/ProfileSection.tsx";
import { ContactSection } from "./editor/ContactSection.tsx";
import { ExperienceSection } from "./editor/ExperienceSection.tsx";
import { SkillsSection } from "./editor/SkillsSection.tsx";
import { ProjectsSection } from "./editor/ProjectsSection.tsx";
import { EducationSection } from "./editor/EducationSection.tsx";
import { CertificationsSection } from "./editor/CertificationsSection.tsx";
import { AwardsSection } from "./editor/AwardsSection.tsx";
import { LanguagesSection } from "./editor/LanguagesSection.tsx";
import { InterestsSection } from "./editor/InterestsSection.tsx";
import { StatsSection } from "./editor/StatsSection.tsx";
import { CustomSection } from "./editor/CustomSection.tsx";
import { JdSection } from "./editor/JdSection.tsx";

interface EditorProps {
  active: SectionId;
  resume: ResumeData;
  onChange: (next: ResumeData) => void;
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
  onAnalyze?: () => void;
}

export function Editor({
  active,
  resume,
  onChange,
  jobDescription,
  onJobDescriptionChange,
  onAnalyze,
}: EditorProps) {
  switch (active) {
    case "profile":
      return <ProfileSection resume={resume} onChange={onChange} />;
    case "contact":
      return <ContactSection resume={resume} onChange={onChange} />;
    case "experience":
      return <ExperienceSection resume={resume} onChange={onChange} />;
    case "skills":
      return <SkillsSection resume={resume} onChange={onChange} />;
    case "projects":
      return <ProjectsSection resume={resume} onChange={onChange} />;
    case "education":
      return <EducationSection resume={resume} onChange={onChange} />;
    case "certifications":
      return <CertificationsSection resume={resume} onChange={onChange} />;
    case "awards":
      return <AwardsSection resume={resume} onChange={onChange} />;
    case "languages":
      return <LanguagesSection resume={resume} onChange={onChange} />;
    case "interests":
      return <InterestsSection resume={resume} onChange={onChange} />;
    case "stats":
      return <StatsSection resume={resume} onChange={onChange} />;
    case "custom":
      return <CustomSection resume={resume} onChange={onChange} />;
    case "jd":
      return (
        <JdSection
          jobDescription={jobDescription}
          onJobDescriptionChange={onJobDescriptionChange}
          onAnalyze={onAnalyze}
        />
      );
  }
}
