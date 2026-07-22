/**
 * Sizing and artwork usage mirror CloakPDF verbatim: the full-bleed
 * /icons/logo.svg is rendered in a 40px circular clip, paired with an
 * 18px Archivo 800 wordmark, -0.02em tracking, and unit leading.
 *
 * Do not substitute favicon.svg here. Its 128px circle is inset inside
 * the 144px canvas, so it appears only 35.6px wide in a 40px image box.
 */
export function BrandLogo() {
  return (
    <a
      href="/"
      aria-label="CloakResume home"
      className="cr-brand-logo inline-flex items-center no-underline shrink-0"
    >
      <img
        src="/icons/logo.svg"
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
