/** Shared family mark; document branding is independent of application chrome. */
export function BrandLogo() {
  return (
    <a
      href={import.meta.env.BASE_URL}
      aria-label="CloakResume home"
      className="resume-editor-brand"
    >
      <img
        src={`${import.meta.env.BASE_URL}cloakresume-mark.svg`}
        alt=""
        aria-hidden="true"
        width="32"
        height="32"
      />
      <span translate="no">CloakResume</span>
    </a>
  );
}
