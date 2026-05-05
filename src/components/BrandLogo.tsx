/**
 * The header brand mark uses /icons/favicon.svg rather than logo.svg.
 *
 * - logo.svg is full-bleed (a rect background gradient) so PWA
 *   launcher masks can crop it to circle / squircle without losing
 *   the brand surface.
 * - favicon.svg paints the same shield on a circular background, so
 *   it reads as a circular badge in chrome — matching the CloakPDF /
 *   CloakIMG header style.
 *
 * Sizing is consistent across mobile and desktop (40px mark, 19px
 * wordmark) to mirror the CloakPDF / CloakIMG family — those apps
 * keep one brand size at every viewport so the family reads the same
 * everywhere.
 */
export function BrandLogo() {
  return (
    <a
      href="/"
      aria-label="CloakResume home"
      className="inline-flex items-center gap-2.5 text-[19px] font-semibold tracking-tight text-(--ink-1) whitespace-nowrap no-underline shrink-0"
    >
      <img
        src="/icons/favicon.svg"
        alt=""
        aria-hidden="true"
        className="w-10 h-10 shrink-0 drop-shadow-sm"
      />
      <span className="leading-none">
        Cloak<span className="text-(--brand)">Resume</span>
      </span>
    </a>
  );
}
