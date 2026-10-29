import { PrivacyPage, type PrivacySection } from "../../docs/air/privacy.tsx";
const REPO_URL = "https://github.com/cloakyard/cloakresume";
const CLOAKYARD_URL = "https://cloakyard.com";
export const privacySections: PrivacySection[] = [
  {
    id: "local-processing",
    title: "Your résumé stays on your device",
    body: (
      <>
        <p>
          Editing, template selection, ATS analysis, spelling and grammar checks, and PDF export run
          inside this browser tab. Your résumé bytes, target job description, document metadata, and
          edits are not sent to a CloakResume upload service because no file-upload route exists.
        </p>
        <p>
          Results are created in browser memory and offered back to you as a PDF or a versioned{" "}
          <code>.cloakresume.json</code> browser download.
        </p>
      </>
    ),
  },
  {
    id: "local-draft",
    title: "Your working draft remains local",
    body: (
      <>
        <p>
          CloakResume stores your résumé, target job description, chosen template, document colour,
          paper size, and current editor section in your browser’s local storage so work can survive
          between sessions on this device.
        </p>
        <p>
          This data is never sent anywhere by CloakResume. Clear it through your browser’s site-data
          settings or start a new document from the toolbar.
        </p>
      </>
    ),
  },
  {
    id: "data-tracking",
    title: "No accounts, advertising, or analytics",
    body: (
      <>
        <p>
          CloakResume does not ask for a name or email address, create user profiles, set tracking
          cookies, or install third-party analytics and advertising scripts. The application does
          not intentionally collect or retain personal information about how you use the editor.
        </p>
        <ul>
          <li>No account or profile database</li>
          <li>No résumé-content telemetry</li>
          <li>No advertising identifiers or behavioural tracking</li>
          <li>No cookies beyond browser-managed local app storage and cache</li>
        </ul>
      </>
    ),
  },
  {
    id: "network-requests",
    title: "Static assets can use the network",
    body: (
      <>
        <p>
          The browser can download CloakResume’s code, fonts, and local language-tooling assets when
          the app needs them. A Service Worker may cache those static assets for later use. Résumé
          content and job-description text are not attached to those requests.
        </p>
        <p>
          The application is hosted as a static site. The hosting provider may retain standard
          access logs—such as IP address, requested path, and timestamp—for security and operations
          under its own privacy policy. Those requests do not contain résumé content.
        </p>
      </>
    ),
  },
  {
    id: "source-rights",
    title: "The implementation is inspectable",
    body: (
      <>
        <p>
          Inspect the source at <PolicyLink href={REPO_URL}>CloakResume on GitHub</PolicyLink>.
          CloakResume is part of <PolicyLink href={CLOAKYARD_URL}>Cloakyard</PolicyLink>, a family
          of privacy-focused open-source tools by Sumit Sahoo.
        </p>
        <p>
          Because CloakResume does not collect personal data, there is nothing for us to disclose,
          correct, or delete on your behalf. Ask a policy question through{" "}
          <PolicyLink href={`${REPO_URL}/issues`}>GitHub Issues</PolicyLink>.
        </p>
      </>
    ),
  },
  {
    id: "revisions",
    title: "Policy revisions remain visible",
    body: (
      <>
        <p>
          If this policy changes, the revised version and date will appear in this document. The
          privacy architecture—local processing, no required account, and no product
          analytics—remains the product contract.
        </p>
      </>
    ),
  },
];
export function PrivacyPolicy() {
  return (
    <PrivacyPage
      product="CloakResume"
      home={import.meta.env.BASE_URL}
      date="2026-07-22"
      lead="Your résumé and target job description stay on your device. App and language assets may download when needed."
      sections={privacySections}
    />
  );
}
function PolicyLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
