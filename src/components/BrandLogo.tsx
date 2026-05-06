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
 * 19px wordmark, -0.025em tracking, default leading — at every
 * viewport so the family reads the same everywhere. Do not introduce
 * `leading-none` or compact variants here; both siblings render the
 * wordmark at the inherited line-height and any tighter value pinches
 * the cap-height alignment relative to the 40px mark.
 */
export function BrandLogo() {
  return (
    <a
      href="/"
      aria-label="CloakResume home"
      className="inline-flex items-center gap-2.5 no-underline shrink-0"
    >
      <img
        src="/icons/favicon.svg"
        alt=""
        aria-hidden="true"
        className="w-10 h-10 shrink-0 drop-shadow-sm"
      />
      <span className="text-[19px] font-semibold tracking-tight text-(--ink-1) whitespace-nowrap">
        Cloak<span className="text-(--brand)">Resume</span>
      </span>
    </a>
  );
}
