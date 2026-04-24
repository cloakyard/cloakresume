import type { ResumeData } from "../types.ts";

/**
 * Empty resume used by "Start fresh". Every array is empty and the
 * profile has just enough placeholder copy to keep the preview from
 * looking entirely broken until the user types something.
 */
export const blankResume: ResumeData = {
  profile: {
    name: "Your Name",
    title: "Your headline",
    summary: "",
  },
  contact: [],
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  awards: [],
  languages: [],
  interests: [],
  tools: [],
  quickStats: [],
  extras: [],
  custom: [],
};

/**
 * True when the résumé has any user-entered content — i.e. it
 * differs from `blankResume`. Used to decide whether the welcome
 * screen should offer a "Resume editing" tile; resuming an untouched
 * default doesn't help the user.
 */
export function resumeHasContent(r: ResumeData): boolean {
  const { profile } = r;
  if (profile.summary.trim().length > 0) return true;
  if (profile.name.trim() && profile.name !== blankResume.profile.name) return true;
  if (profile.title.trim() && profile.title !== blankResume.profile.title) return true;
  return (
    r.contact.length > 0 ||
    r.skills.length > 0 ||
    r.experience.length > 0 ||
    r.education.length > 0 ||
    r.projects.length > 0 ||
    r.certifications.length > 0 ||
    r.awards.length > 0 ||
    r.languages.length > 0 ||
    r.interests.length > 0 ||
    r.tools.length > 0 ||
    r.quickStats.length > 0 ||
    r.extras.length > 0 ||
    r.custom.length > 0
  );
}
