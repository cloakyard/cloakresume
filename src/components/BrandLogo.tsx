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
 * Sizing mirrors the CloakPDF / CloakIMG family verbatim — 40px mark,
 * 18px Archivo 800 wordmark, -0.02em tracking, and unit leading — at
 * every viewport so the family reads the same everywhere.
 */
export function BrandLogo() {
  return (
    <a
      href="/"
      aria-label="CloakResume home"
      className="cr-brand-logo inline-flex items-center no-underline shrink-0"
    >
      <img
        src="/icons/favicon.svg"
        alt=""
        aria-hidden="true"
        width="40"
        height="40"
        className="w-10 h-10 shrink-0"
      />
      <span
        translate="no"
        className="whitespace-nowrap text-[1.125rem] leading-none font-[800] tracking-[-0.02em] text-(--ink-1)"
      >
        Cloak<span className="text-(--brand)">Resume</span>
      </span>
    </a>
  );
}
