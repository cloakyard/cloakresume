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
};
