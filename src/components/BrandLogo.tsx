export function BrandLogo() {
  return (
    <a
      href="/"
      aria-label="CloakResume home"
      className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-0.015em] text-(--ink-1) whitespace-nowrap no-underline shrink-0"
    >
      <img src="/icons/logo.svg" alt="" aria-hidden="true" className="w-10 h-10 shrink-0" />
      <span className="leading-none">
        Cloak<span className="text-(--brand)">Resume</span>
      </span>
    </a>
  );
}
