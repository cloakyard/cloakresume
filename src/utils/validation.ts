/**
 * Field-level validators and link-normalisation helpers.
 *
 * Kept intentionally permissive: the editor is an assistive surface, not
 * a submission gate. Rules only flag values that are *clearly* malformed
 * (e.g. "foo@" for an email) so users are never blocked mid-typing.
 */

/** RFC-5322–adjacent: good enough for catching typos, not spec-accurate. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** A value is URL-ish when `new URL()` parses it (optionally after adding https://). */
export function isValidHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") && u.hostname.length >= 4;
  } catch {
    return false;
  }
}

/** Accepts common human phone formats — digits, spaces, parens, dashes, + prefix. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 7 && /^[+\d][\d\s().-]*$/.test(v);
}

/** Return a canonical https:// URL for any value that parses as URL-ish. */
export function normaliseHttpUrl(value: string): string | null {
  if (!isValidHttpUrl(value)) return null;
  const v = value.trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
