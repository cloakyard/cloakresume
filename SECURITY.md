# Security policy

## Supported version

Security fixes are applied to the latest code on `main` and the current deployment.

## Report a vulnerability

Do not open a public issue containing vulnerability details. Private vulnerability
reporting is not currently enabled on this repository. Use a contact method listed on
[the maintainer's GitHub profile](https://github.com/sumitsahoo) to request a private
channel, and send only a non-sensitive summary until that channel is established.
Then include reproduction steps, affected browsers, impact, and any suggested
mitigation. The maintainers will coordinate disclosure and credit when appropriate.

For a vulnerable third-party package, include the package name, installed version, and
advisory identifier.

## Security boundary

CloakResume is a static, client-side application. Résumé editing, job-description
matching, writing review, rendering, and export run in the browser. The application
does not configure an account service, analytics service, or endpoint that receives
résumé content.

That boundary does not mean the browser makes no network requests:

- The page, JavaScript, styles, fonts, icons, and service worker come from the app origin.
- Harper's WebAssembly language engine is fetched from the app origin on first review
  and may be cached by the service worker.
- Hosting and browser infrastructure remain outside this repository's control.

Drafts in `localStorage` are not encrypted. Anyone with access to the same browser
profile can read or delete them. Use **Save JSON**, then clear the local draft, when
working on a shared device.

## Defence in depth

- The meta Content Security Policy in [index.html](index.html) limits scripts, workers,
  fonts, images, forms, and connections to declared sources. It reduces exposure but
  does not replace a deployment-level CSP header or make same-origin code trustworthy.
- Production assets are bundled locally; the page does not execute third-party CDN scripts.
- `object-src 'none'`, `base-uri 'self'`, and `form-action 'self'` reduce common injection paths.
- No product analytics or tracking integration is present.
- Dependency review can be run locally with `vp outdated` and `vp pm audit`.

When deploying a fork, serve HTTPS, add security headers at the host, review any new
network destination, and do not weaken the CSP without documenting why.

_Last reviewed: 2026-07-22._
