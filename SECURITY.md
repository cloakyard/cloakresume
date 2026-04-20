# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in CloakResume, please **do not** open a public GitHub issue.

Instead, report it privately via [GitHub Security Advisories](https://github.com/sumitsahoo/cloakresume/security/advisories/new).

You can expect:

- **Acknowledgement** within 48 hours
- **Status update** within 7 days
- Credit in the advisory once the fix is released (if desired)

## Security Model

CloakResume is a **client-side only** application — all resume editing, rendering, ATS scoring, and PDF export happen in your browser. No resume data is transmitted to any server. The attack surface is limited to:

- Third-party npm dependencies (monitored via automated CI security audits and Dependabot)
- Browser sandbox escape (out of scope — report to the browser vendor)

## Dependency Vulnerabilities

Known dependency vulnerabilities are tracked automatically via:

- **GitHub Dependabot** — daily checks against the GitHub Advisory Database
- **OSV-Scanner** — weekly CI workflow against the Open Source Vulnerabilities database

If you spot one that has not been addressed, please follow the disclosure process above.

## Defence-in-Depth Controls

- **Content Security Policy** — declared via `<meta http-equiv="Content-Security-Policy">` in [`index.html`](./index.html). `connect-src` is restricted to the application origin, making it physically impossible for the page to upload user resume content elsewhere. `script-src` disallows remote scripts, `object-src` is `'none'`, and `form-action` is pinned to `'self'`.
- **Subresource integrity** — all first-party JavaScript is bundled and served from the same origin under hashed filenames.
- **Local-only persistence** — resume drafts are saved to `localStorage` on the user's device; nothing is sent over the wire.
- **No tracking or analytics** — the page makes no third-party network requests at runtime.

_Last reviewed: 2026-04-20._
