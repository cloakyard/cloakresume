/**
 * Shared helpers for resume templates.
 *
 * Templates import these building blocks so icon mapping, contact
 * formatting, and stack-chip rendering stay consistent regardless of
 * the chosen layout.
 *
 * Brand marks (GitHub, LinkedIn, etc.) are inlined as SVG rather than
 * pulled from lucide — some brand icons have been removed from the
 * lucide package and inline SVG is also more print-stable.
 */

import { Globe, Link as LinkIcon, Mail, MapPin, PenLine, Phone } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import type { Certification, ContactLink } from "../types.ts";
import { isValidEmail, isValidPhone, normaliseHttpUrl } from "../utils/validation.ts";

interface BrandIconProps {
  size?: number;
  style?: CSSProperties;
}

function LinkedInIcon({ size = 12, style }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={style}
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.339 18.337v-8.59H5.667v8.59h2.672zM7.003 8.574a1.548 1.548 0 1 0 0-3.096 1.548 1.548 0 0 0 0 3.096zm11.335 9.763V13.64c0-2.565-1.387-3.76-3.237-3.76-1.493 0-2.162.82-2.534 1.397v-1.198H9.895c.035.756 0 8.59 0 8.59h2.672V13.54c0-.24.017-.48.088-.652.193-.48.635-.978 1.376-.978.97 0 1.358.738 1.358 1.82v4.607h2.673z" />
    </svg>
  );
}

function GithubIcon({ size = 12, style }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={style}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ size = 12, style }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={style}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function contactIcon(kind: ContactLink["kind"], size: number = 12) {
  const common = { width: size, height: size, strokeWidth: 2 };
  switch (kind) {
    case "email":
      return <Mail {...common} />;
    case "phone":
      return <Phone {...common} />;
    case "location":
      return <MapPin {...common} />;
    case "website":
      return <Globe {...common} />;
    case "linkedin":
      return <LinkedInIcon size={size} />;
    case "github":
      return <GithubIcon size={size} />;
    case "medium":
      return <PenLine {...common} />;
    case "twitter":
      return <TwitterIcon size={size} />;
    default:
      return <LinkIcon {...common} />;
  }
}

/**
 * Resolve a contact row to its canonical href, or `null` when the value
 * isn't something we can meaningfully link to.
 *
 *   email → `mailto:<value>`  (only when the value looks like a real address)
 *   phone → `tel:+<digits>`   (digits/`+` only; dashes, spaces, parens dropped)
 *   location → Google Maps search URL for the given place
 *   URL-ish kinds → `https://<value>` (adds the scheme when missing)
 *   malformed values → `null`
 */
export function contactHref(kind: ContactLink["kind"], value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (kind) {
    case "email":
      return isValidEmail(v) ? `mailto:${v}` : null;
    case "phone": {
      if (!isValidPhone(v)) return null;
      const digits = v.replace(/[^+\d]/g, "");
      return `tel:${digits}`;
    }
    case "location":
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
    default:
      // website, linkedin, github, twitter, medium, other — all URL-ish.
      return normaliseHttpUrl(v);
  }
}

/**
 * Render a contact value — either as a styled anchor when the value
 * resolves to an href (email, phone, URL) or as plain text otherwise.
 * Templates use this to get clickable links in the live preview and in
 * the exported PDF without each layout having to repeat the conversion.
 */
export function renderContactValue(c: ContactLink): ReactNode {
  const href = contactHref(c.kind, c.value);
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="tpl-link">
        {c.value}
      </a>
    );
  }
  return c.value;
}

/**
 * Wrap arbitrary content (typically a `<strong>` with the certification
 * name) in an anchor when the certification has a validated URL.
 * Templates call this so the existing name markup stays template-local.
 */
export function certificationLink(c: Certification, content: ReactNode): ReactNode {
  const href = c.url ? normaliseHttpUrl(c.url) : null;
  if (!href) return content;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="tpl-link">
      {content}
    </a>
  );
}

/**
 * Format a start/end date pair as "start – end", or just "start" when
 * no end date is set. Templates use this for roles, education, and
 * projects so the separator stays consistent.
 */
export function formatDateRange(start: string, end?: string): string {
  return end ? `${start} – ${end}` : start;
}

/**
 * Format an optional location as a prefixed suffix (e.g. ", Berlin" or
 * " · Berlin"). Returns an empty string when the location is blank so
 * templates can concatenate it unconditionally.
 */
export function formatLocation(location: string | undefined, separator: string = ", "): string {
  return location ? `${separator}${location}` : "";
}

/** Split a comma-separated skill list into trimmed items, ignoring blanks. */
export function splitSkills(items: string): string[] {
  return items
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Extract up to two uppercase initials from a display name (for avatar fallbacks). */
export function extractInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
