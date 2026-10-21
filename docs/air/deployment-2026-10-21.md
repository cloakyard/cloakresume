# Air deployment — 2026-10-21

The user authorized deployment of the validated Air stage, with the remaining
font/token and physical-device acceptance tasks still open. PR #39 merged dev
into main at `31a5448`; dev was synchronized to the merge commit. Its rebuilt
105-file output exactly matches the dependency acceptance build.

The first live response exposed Cloudflare JavaScript Detection injection in
the HTML. Add `Cache-Control: no-transform` for every static response, matching
the existing family deployment rule. This changes response headers only; the
application, templates, worker and all 105 existing output files remain unchanged.
The recorded 372-test acceptance and exact document-output proof therefore still
describe the app bytes. Verify the header and exact live HTML after the follow-up
dev → main PR; do not call the injected response a passing deployment.

Follow-up validation: format/lint/types, production build, Air contract and local
Workers header checks pass. All 105 prior output-file hashes are identical; the
only added build file is `_headers`.
