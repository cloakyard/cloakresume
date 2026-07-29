/**
 * The header uses the canonical /cloakresume-mark.svg family asset.
 *
 * Its 64px canvas, circular field, diameter-42 glyph keyline, and
 * 3px white stroke follow the Cloakyard / CloakPDF mark system.
 * CloakResume retains its emerald palette and profile-led shield glyph.
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
        src="/cloakresume-mark.svg"
        alt=""
        aria-hidden="true"
        width="40"
        height="40"
        className="cr-brand-logo__mark shrink-0"
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
