<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Cloakyard Air refresh

Read `DESIGN.md` before changing UI. It is the portable family-wide Air contract
and supersedes earlier Workbench styling. It covers every custom component,
editor panel, canvas surround, overlay, state and responsive layout. Résumé
templates and exported documents retain their selected typography and geometry.

Track each source/state in `docs/air/surfaces.json` and run
`node scripts/check-air-design.mjs`. Implement one bounded piece, inspect
desktop/laptop/tablet/phone themes and input modes, run all applicable checks and
feature/template/browser tests, record evidence, then commit only on a complete
pass. An unavailable browser or skipped feature test does not count as a pass.

## Dead-code audit

Run `npx --yes knip@6.42.1` for the declared web graph in `knip.json`. The pinned
CLI can also be supplied externally; no runtime package is required. Manual audit
commands and portable Air library entries are deliberate public entry points.
Static `404.html` imports `src/styles/air-recovery.css`; preserve its explicit entry.
Tailwind scans shipped `src/` and root HTML only. Preserve its Air font mappings,
which the reset consumes even without a `font-mono` utility in JSX.
