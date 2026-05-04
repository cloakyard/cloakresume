interface Props {
  /**
   * Compact mode shrinks the mark to 32px and the wordmark to 17px so
   * the brand still reads at a glance on phones without crowding the
   * mobile toolbar. Desktops keep the 40px / 19px size that matches
   * the CloakIMG / CloakPDF family.
   */
  compact?: boolean;
}

export function BrandLogo({ compact = false }: Props) {
  return (
    <a
      href="/"
      aria-label="CloakResume home"
      className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-(--ink-1) whitespace-nowrap no-underline shrink-0"
      style={{ fontSize: compact ? 17 : 19 }}
    >
      <img
        src="/icons/logo.svg"
        alt=""
        aria-hidden="true"
        className={`shrink-0 ${compact ? "w-8 h-8" : "w-10 h-10"}`}
      />
      <span className="leading-none">
        Cloak<span className="text-(--brand)">Resume</span>
      </span>
    </a>
  );
}
