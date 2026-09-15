import { createContext } from "react";

export const PROFILE_TITLE_MAX_LINES = 4;
export const ProfileTitleOverflowContext = createContext(false);

/** Check actual template wrapping at its paper width, independent of preview zoom. */
export function profileTitleOverflows(root: HTMLElement): boolean {
  return Array.from(root.querySelectorAll<HTMLElement>(".resume-page .resume-profile-title")).some(
    (title) =>
      (title.textContent ?? "").split(/\r\n|\r|\n/).length > PROFILE_TITLE_MAX_LINES ||
      (title.clientHeight > 0 && title.scrollHeight > title.clientHeight + 1),
  );
}
