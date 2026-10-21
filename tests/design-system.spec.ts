/// <reference types="node" />

import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vite-plus/test";
import { TEMPLATE_COUNT } from "../src/templates/meta.ts";

const projectRoot = new URL("../", import.meta.url);

async function source(path: string) {
  return readFile(new URL(path, projectRoot), "utf8");
}

async function filesBelow(relativeDirectory: string, extension: string): Promise<string[]> {
  const absoluteDirectory = new URL(`${relativeDirectory}/`, projectRoot);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = `${relativeDirectory}/${entry.name}`;
      return entry.isDirectory()
        ? filesBelow(relativePath, extension)
        : entry.name.endsWith(extension)
          ? [relativePath]
          : [];
    }),
  );
  return nested.flat().sort();
}

function withoutComments(value: string) {
  return value.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function lineNumber(value: string, index: number) {
  return value.slice(0, index).split("\n").length;
}

function cssDeclarations(css: string) {
  const declarations: { name: string; value: string; index: number }[] = [];
  const declaration = /(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(withoutComments(css)))) {
    declarations.push({ name: match[1], value: match[2].trim(), index: match.index });
  }
  return declarations;
}

function designInventory(markdown: string) {
  const entries = new Map<string, "Aligned" | "Support" | "Output">();
  const row = /\|\s*\d+\s*\|\s*`(src\/[^`]+\.tsx)`\s*\|\s*(Aligned|Support|Output)\s*\|/g;
  for (const match of markdown.matchAll(row)) {
    if (entries.has(match[1])) throw new Error(`Duplicate design-audit row for ${match[1]}`);
    entries.set(match[1], match[2] as "Aligned" | "Support" | "Output");
  }
  return entries;
}

describe("CloakResume family contract", () => {
  it("pins the current TypeScript and Vite+ toolchain", async () => {
    const pkg = JSON.parse(await source("package.json")) as {
      devDependencies: Record<string, string>;
      packageManager: string;
    };
    const workspace = await source("pnpm-workspace.yaml");

    expect(pkg.devDependencies.typescript).toBe("^7.0.2");
    expect(pkg.devDependencies["vite-plus"]).toBe("catalog:");
    expect(pkg.packageManager).toBe("pnpm@12.9.1");
    expect(workspace).toContain("vite-plus: 1.1.0");
    expect(workspace).toContain("vite: npm:@voidzero-dev/vite-plus-core@1.1.0");
    expect(pkg.devDependencies).not.toHaveProperty("vitest");
  });

  it("keeps every normative token value in tokens.css", async () => {
    const tokenCss = await source("tokens.css");
    const cssFiles = await filesBelow("src", ".css");
    const canonicalNames = new Set(cssDeclarations(tokenCss).map(({ name }) => name));
    const duplicateDefinitions: string[] = [];

    for (const file of cssFiles) {
      const css = await source(file);
      for (const declaration of cssDeclarations(css)) {
        if (canonicalNames.has(declaration.name)) {
          duplicateDefinitions.push(
            `${file}:${lineNumber(withoutComments(css), declaration.index)} ${declaration.name}`,
          );
        }
      }
    }

    expect(tokenCss).toContain("single normative source for product chrome");
    expect(duplicateDefinitions, "canonical tokens redefined outside tokens.css").toEqual([]);
  });

  it("keeps CSS bridges token-driven instead of introducing another palette", async () => {
    const [indexCss, familyCss, tokens] = await Promise.all([
      source("src/index.css"),
      source("src/cloak-family.css"),
      source("tokens.css"),
    ]);

    expect(indexCss).toMatch(/^\/\*[\s\S]*?\*\/\s*@import "\.\.\/tokens\.css";/);
    expect(indexCss).toContain("Normative values live in tokens.css");
    expect(familyCss).toContain("var(--color-focus)");
    expect(familyCss).not.toContain(".tb.primary");
    expect(`${indexCss}\n${familyCss}\n${tokens}`).not.toMatch(/surface-glass|--glass-/);
  });

  it("uses the Air editor identity without changing the original mark", async () => {
    const [brandLogo, css] = await Promise.all([
      source("src/components/BrandLogo.tsx"),
      source("src/styles/air-editor.css"),
    ]);
    expect(brandLogo).toContain('width="32"');
    expect(brandLogo).toContain('height="32"');
    expect(brandLogo).toContain("cloakresume-mark.svg");
    expect(brandLogo).toContain('translate="no"');
    expect(css).toContain("font: 500 1.125rem/1.25 var(--air-font)");
    expect(brandLogo).not.toMatch(/Archivo|font-\[800\]|text-\(--brand\)/);
  });

  it("uses Air for entry and policy while retaining provenance and the complete policy", async () => {
    const [landing, privacy, main, entryCss, familyCss] = await Promise.all([
      source("src/components/CloakWorkbenchLanding.tsx"),
      source("src/components/PrivacyPolicyModal.tsx"),
      source("src/main.tsx"),
      source("src/styles/air-entry.css"),
      source("src/cloak-family.css"),
    ]);
    const footer = landing.match(
      /<footer className="resume-footer resume-frame">([\s\S]*?)<\/footer>/,
    )?.[1];
    expect(footer).toBeDefined();
    for (const content of [
      "CloakResume v{__APP_VERSION__}",
      "Built by",
      "Sumit Sahoo",
      "MIT licensed",
      "Cloakyard",
      "Privacy policy",
    ])
      expect(footer).toContain(content);
    expect(main).toContain('import "./styles/air.css"');
    expect(landing).toContain('width="32"');
    expect(landing).toContain('className="resume-menu"');
    expect(landing).toContain("mountAirLight");
    expect(privacy).toContain('className="air-modal resume-policy"');
    expect(privacy).toContain("Complete privacy policy");
    expect(privacy).toContain('LAST_UPDATED_ISO = "2026-07-22"');
    for (const title of [
      "Your résumé stays on your device",
      "Your working draft remains local",
      "No accounts, advertising, or analytics",
      "Static assets can use the network",
      "The implementation is inspectable",
      "Policy revisions remain visible",
    ])
      expect(privacy).toContain(title);
    expect(entryCss).not.toMatch(/--air-[a-z-]+\s*:/);
    expect(familyCss).not.toMatch(
      /cr-family-landing|cr-privacy-dialog|cr-resume-proof|cr-statement-footer/,
    );
  });

  it("uses Air editor geometry and keeps the date popover viewport aware", async () => {
    const [css, layout, view, paper, monthYear, pickerPosition] = await Promise.all([
      source("src/styles/air-editor.css"),
      source("src/components/Layout.tsx"),
      source("src/components/ViewSegment.tsx"),
      source("src/components/PaperSizeToggle.tsx"),
      source("src/components/MonthYearField.tsx"),
      source("src/utils/usePickerPosition.ts"),
    ]);
    expect(css).toContain("var(--air-rail) 360px minmax(0, 1fr)");
    expect(css).toContain("var(--air-rail) 420px minmax(0, 1fr)");
    expect(css).toContain("min-height: var(--air-editor-header)");
    expect(css).not.toMatch(/--air-[a-z-]+\s*:/);
    expect(css).toContain("height: 100dvh");
    expect(layout).toContain('<h1 className="sr-only">CloakResume editor</h1>');
    expect(layout).toContain('href="#editor-content"');
    expect(layout).toContain('id: "editor-content"');
    expect(view).toContain('className="air-segments resume-view-segment"');
    expect(paper).toContain('className="air-segments resume-paper-size"');
    expect(monthYear).toContain(
      "usePickerPosition(open && !disabled, buttonRef, popoverRef, showYearPicker)",
    );
    expect(pickerPosition).toContain("window.visualViewport");
    expect(pickerPosition).toContain('visualViewport?.addEventListener("resize", updateCoords)');
    expect(pickerPosition).toContain('visualViewport?.addEventListener("scroll", updateCoords)');
    expect(pickerPosition).toContain("const spaceAbove");
    expect(pickerPosition).toContain("const spaceBelow");
  });

  it("uses the canonical landing directly and preserves browser zoom", async () => {
    const [app, landing, html] = await Promise.all([
      source("src/App.tsx"),
      source("src/components/CloakWorkbenchLanding.tsx"),
      source("index.html"),
    ]);

    expect(app).toContain(
      'import { CloakWorkbenchLanding } from "./components/CloakWorkbenchLanding.tsx"',
    );
    expect(app).toContain("<CloakWorkbenchLanding");
    expect(landing).toContain("export function CloakWorkbenchLanding");
    expect(html).not.toContain("user-scalable=no");
    expect(html).not.toContain("maximum-scale=1");
  });

  it("does not let the selected resume palette mutate product chrome", async () => {
    const app = withoutComments(await source("src/App.tsx"));

    expect(app).not.toMatch(/useApplyTheme|applyTheme|setTheme/i);
    expect(app).not.toMatch(
      /documentElement\.style\.setProperty\(\s*["'`](?:--brand|--color-accent)/,
    );
    expect(app).toContain("const palette = useMemo(() => derivePalette(primary)");
  });

  it("keeps persistent mobile preview and one lower-pane task with a landscape layout", async () => {
    const [layout, panel] = await Promise.all([
      source("src/components/Layout.tsx"),
      source("src/components/SectionPanel.tsx"),
    ]).then(([layoutSource, panelSource]) => [
      withoutComments(layoutSource),
      withoutComments(panelSource),
    ]);

    expect(layout).toContain("data-mobile-view={mobileView}");
    expect(layout).toMatch(/mobileView === "panel"[\s\S]*?resume-compact-split/);
    expect(layout).toMatch(
      /resume-compact-split[\s\S]*?aria-label="Résumé preview"[\s\S]*?cr-editor-panel/,
    );
    expect(layout).toContain("mobileSectionOpen ?");
    expect(layout).toContain('aria-label="Résumé section picker"');
    expect(layout).toContain('variant="picker"');
    expect(layout).not.toMatch(/FloatingSectionPill|sectionDrawerOpen|Jump to section/);
    expect(panel).toContain("Close ${meta.label} editor and choose another section");
    expect(panel).toContain("resume-section-close");
    expect(layout).toContain("resume-compact-body");
  });

  it("preserves natural word wrapping in every résumé document", async () => {
    const [indexCss, templateFiles] = await Promise.all([
      source("src/index.css"),
      filesBelow("src/templates", ".tsx"),
    ]);
    const resumeRoot =
      [...indexCss.matchAll(/\.resume-root\s*\{([^}]+)\}/g)]
        .map((match) => match[1])
        .find((declarations) => declarations.includes("overflow-wrap")) ?? "";
    const longTokenSelectors =
      /(?:contact|skill|stack|handle|chip|pill|url|link|code|email|website|stat-value)/i;
    const midWordDeclaration =
      /overflow-wrap\s*:\s*anywhere|word-break\s*:\s*(?:break-word|break-all)/i;
    const templateRoots: { file: string; declarations: string }[] = [];
    const violations: string[] = [];

    for (const file of templateFiles) {
      const template = await source(file);
      const root = template.match(/\.[a-z-]+-root\s*\{([^}]+)\}/)?.[1];
      if (!root) continue;
      templateRoots.push({ file, declarations: root });

      // Template styles are flat rules in a local CSS template literal. Removing
      // palette interpolations lets this guard inspect selectors without treating
      // `${...}` as CSS blocks.
      const stylesheet = template
        .match(/const css\s*=\s*`([\s\S]*?)`;/)?.[1]
        ?.replace(/\$\{[^}]+\}/g, "TOKEN");
      if (!stylesheet) {
        violations.push(`${file}: missing inspectable template stylesheet`);
        continue;
      }

      let safeguardCount = 0;
      for (const rule of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1].trim();
        const declarations = rule[2];
        if (!midWordDeclaration.test(declarations)) continue;
        safeguardCount += 1;
        if (/word-break\s*:\s*break-all/i.test(declarations)) {
          violations.push(`${file}: ${selector} uses word-break: break-all`);
        } else if (!longTokenSelectors.test(selector)) {
          violations.push(`${file}: ${selector} applies mid-word wrapping to general prose`);
        }
      }

      if (safeguardCount === 0) {
        violations.push(`${file}: missing an explicit long-token safeguard`);
      }
      if (/\bbreak-all\b|overflowWrap\s*:\s*["']anywhere["']/i.test(template)) {
        violations.push(`${file}: unsafe utility or inline mid-word wrapping`);
      }
    }

    expect(resumeRoot).toContain("overflow-wrap: normal");
    expect(resumeRoot).toContain("word-break: normal");
    expect(resumeRoot).toContain("hyphens: manual");
    expect(indexCss).toMatch(
      /\.resume-root a,\s*\.resume-root code\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;/,
    );
    expect(templateRoots).toHaveLength(TEMPLATE_COUNT);
    for (const root of templateRoots) {
      expect(root.declarations, root.file).toMatch(/overflow-wrap: (?:normal|break-word)/);
      expect(root.declarations, root.file).toContain("word-break: normal");
      expect(root.declarations, root.file).toContain("hyphens: manual");
      expect(root.declarations, root.file).not.toContain("overflow-wrap: anywhere");
      expect(root.declarations, root.file).not.toContain("word-break: break-word");
    }
    expect(violations, "mid-word wrapping must be limited to explicit long-token fields").toEqual(
      [],
    );
  });

  it("routes common overlays through the shared semantic shells", async () => {
    const files = await Promise.all(
      [
        "src/components/TemplateModal.tsx",
        "src/components/AtsReviewDialog.tsx",
        "src/components/PrivacyPolicyModal.tsx",
        "src/components/ConfirmDialog.tsx",
        "src/components/OptionsDialog.tsx",
      ].map(source),
    );

    expect(
      files.every((file) => file.includes("air-modal-viewport") || file.includes("resume-overlay")),
    ).toBe(true);
    expect(files[0]).toContain('className="air-modal resume-library"');
    expect(files[0]).toContain("useModalDialog<HTMLDivElement>");
    expect(files[0]).toContain("inertBackground: true");
    expect(files[1]).toContain('className="air-modal resume-review"');
    expect(files[1]).toContain("inertBackground: true");
    expect(files[4]).toContain('className="air-modal resume-options"');
    expect(files[4]).toContain("inertBackground: true");
    const review = await source("src/components/AtsReviewContent.tsx");
    expect(review).toContain("ref={scrollRef}");
    expect(review).toContain("ref={tabAnchorRef}");
    expect(review).toContain("selectTab(key)");
    expect(review).toContain("useLayoutEffect");
    expect(review).not.toContain("setTimeout");
    expect(review).not.toContain("animate-spin");
    expect(files[1]).toContain("createPortal(");
    expect(files[4]).toContain("createPortal(");
    expect(files[4]).toContain("document.body");
  });

  it("uses accessible family notices and viewport-safe mobile sheets", async () => {
    const [app, confirm, templates, ats, errors, reload, fieldIssues, notFound] = await Promise.all(
      [
        source("src/App.tsx"),
        source("src/components/ConfirmDialog.tsx"),
        source("src/components/TemplateModal.tsx"),
        source("src/components/AtsReviewDialog.tsx"),
        source("src/components/ErrorBoundary.tsx"),
        source("src/components/ReloadPrompt.tsx"),
        source("src/utils/fieldIssues.tsx"),
        source("404.html"),
      ],
    );

    expect(app).not.toMatch(/\balert\s*\(/);
    expect(app).toContain('variant="notice"');
    expect(confirm).toContain('variant?: "confirm" | "notice"');
    expect(confirm).toContain('variant === "notice" ? confirmRef : cancelRef');
    expect(confirm).toContain('role={variant === "notice" ? "alertdialog" : "dialog"}');

    expect(app).toContain("<AtsReviewDialog");
    expect(ats).toContain('className="air-modal resume-review"');
    expect(templates).toContain('className="air-modal resume-library"');
    expect(templates).toContain('className="resume-library-body"');
    expect(await source("src/styles/air.css")).toMatch(
      /\.air-modal\s*\{[^}]*max-block-size: calc\(100dvh - 16px\);[^}]*padding-bottom: max\(24px, env\(safe-area-inset-bottom\)\);/,
    );
    expect(await source("src/styles/air-editor.css")).toMatch(
      /\.resume-library-body\s*\{[^}]*min-block-size: 0;[^}]*overflow: auto;[^}]*overscroll-behavior: contain;/,
    );

    expect(errors).toContain('const GITHUB_REPO = "cloakyard/cloakresume"');
    expect(reload).toContain('className="resume-update"');
    expect(reload).toContain(
      'type ReloadNoticeState = "offline" | "update" | "updating" | "error"',
    );
    expect(reload).toContain("Update and reload");
    expect(reload).toContain("Updating…");
    expect(reload).toContain("Check your connection, then try again.");
    expect(reload).toContain("This version is cached and ready to use offline.");
    expect(reload).toContain("aria-disabled={busy || undefined}");
    expect(reload).toContain('role={state === "error" ? "alert" : "status"}');
    expect(reload).not.toContain("now installed for offline use");
    expect(fieldIssues).toContain('className="resume-hint-list"');
    expect(await source("src/styles/air-editor.css")).toContain(".resume-hint-list > li + li");
    expect(fieldIssues).not.toContain('className="rounded-md border bg-(--surface) p-2"');
    expect(notFound).toContain('class="air-page resume-recovery"');
    expect(notFound).toContain('href="/src/styles/air.css"');
  });

  it("keeps muted and status text legible and preserves keyboard focus cues", async () => {
    const [tokens, tokenJson, ats, contact, viewSegment, overflow, colourPopover] =
      await Promise.all([
        source("tokens.css"),
        source("tokens.json"),
        source("src/utils/ats.ts"),
        source("src/components/editor/ContactSection.tsx"),
        source("src/components/ViewSegment.tsx"),
        source("src/components/ToolbarOverflow.tsx"),
        source("src/components/ColorPickerPopover.tsx"),
      ]);

    expect(tokens).toContain(
      "--ink-5: color-mix(in oklab, var(--color-ink-3) 95%, var(--color-paper))",
    );
    expect(tokenJson).toContain(
      '"$value": "color-mix(in oklab, var(--color-ink-3) 95%, var(--color-paper))"',
    );
    expect(ats).toContain('color: "var(--air-success)"');
    expect(ats).toContain('color: "var(--air-warning)"');
    expect(ats).toContain('color: "var(--air-danger)"');
    expect(ats).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(contact).toContain("aria-label={`${c.kind} contact value`}");
    expect(contact).not.toContain("focus:outline-none");
    expect(viewSegment).not.toContain("focus-visible:outline-none");
    expect(overflow).not.toContain("focus-visible:outline-none");
    expect(colourPopover).toContain('event.key === "Escape"');
    expect(colourPopover).toContain("maxHeight: coords.maxHeight");
  });

  it("locks preview fidelity, editor hierarchy, viewport safety, and family motion", async () => {
    const [
      tokenCss,
      tokenJson,
      indexCss,
      familyCss,
      preview,
      app,
      panel,
      layout,
      rail,
      viewSegment,
      paperToggle,
      templateModal,
      reloadPrompt,
      dragList,
      fields,
      emptyState,
      logoPicker,
      fieldIssues,
      projects,
    ] = await Promise.all([
      source("tokens.css"),
      source("tokens.json"),
      source("src/index.css"),
      source("src/cloak-family.css"),
      source("src/components/Preview.tsx"),
      source("src/App.tsx"),
      source("src/components/SectionPanel.tsx"),
      source("src/components/Layout.tsx"),
      source("src/components/SectionRail.tsx"),
      source("src/components/ViewSegment.tsx"),
      source("src/components/PaperSizeToggle.tsx"),
      source("src/components/TemplateModal.tsx"),
      source("src/components/ReloadPrompt.tsx"),
      source("src/components/DragList.tsx"),
      source("src/components/fields.tsx"),
      source("src/components/editor/shared.tsx"),
      source("src/components/LogoPicker.tsx"),
      source("src/utils/fieldIssues.tsx"),
      source("src/components/editor/ProjectsSection.tsx"),
    ]);
    const portable = JSON.parse(tokenJson) as {
      duration: Record<string, { $value: { value: number; unit: string } }>;
      easing: Record<string, { $value: number[] }>;
    };

    expect(tokenCss).toContain("--duration-press: 100ms");
    expect(tokenCss).toContain("--duration-stagger: 60ms");
    expect(tokenCss).toContain("--motion-distance-small: 4px");
    expect(tokenCss).toContain("--motion-scale-surface: 0.98");
    expect(tokenCss).not.toContain("--ease-in:");
    expect(tokenCss).toContain("--ease-standard: cubic-bezier(0.16, 1, 0.3, 1)");
    expect(portable.duration.press.$value).toEqual({ value: 100, unit: "ms" });
    expect(portable.duration.stagger.$value).toEqual({ value: 60, unit: "ms" });
    expect(portable.easing.in).toBeUndefined();
    expect(portable.easing.standard.$value).toEqual([0.16, 1, 0.3, 1]);

    expect(indexCss).not.toMatch(/transition-\[[^\]]*box-shadow/);
    expect(indexCss).not.toContain("cr-field-glow");
    expect(await source("src/utils/highlightField.ts")).toContain(
      "field.focus({ preventScroll: true })",
    );
    expect(familyCss).not.toContain("cr-sheet-enter");
    expect(familyCss).not.toContain(".cr-family-landing .cr-landing-hero__declaration");
    expect(familyCss).not.toContain(".cr-overlay");
    expect(familyCss).not.toContain(".cr-sheet");
    expect(familyCss).toContain('.cr-popover[data-state="closing"]');
    expect(familyCss).toContain("@starting-style");
    expect(familyCss).not.toContain('.cr-dialog [role="tabpanel"]:not([hidden])');
    expect(layout).toContain("cr-editor-shell");
    expect(layout).not.toContain("cr-workspace-enter");
    expect(panel).not.toContain("cr-section-enter");
    expect(rail).toContain("cr-section-nav-button");
    expect(viewSegment).toContain("air-segments");
    expect(paperToggle).toContain("air-segments");
    expect(templateModal).toContain("resume-template-card");
    expect(templateModal).toContain("<TemplatePreview");
    expect(templateModal).toContain("aria-pressed={active}");
    expect(`${templateModal}\n${familyCss}`).not.toContain("cr-template-card");
    expect(reloadPrompt).not.toContain("cr-toast");
    expect(dragList).toContain("data-dragging");

    const sourceFiles = [
      ...(await filesBelow("src", ".tsx")),
      ...(await filesBelow("src", ".css")),
    ];
    const legacyMotion: string[] = [];
    for (const file of sourceFiles) {
      const contents = withoutComments(await source(file));
      for (const match of contents.matchAll(/\bduration-(?:100|150|200)\b/g)) {
        legacyMotion.push(`${file}:${lineNumber(contents, match.index ?? 0)} ${match[0]}`);
      }
    }
    expect(legacyMotion, "legacy timing utilities must use the 160/220ms family scale").toEqual([]);

    expect(indexCss).not.toContain("filter: brightness");
    expect(indexCss).toContain("box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12)");
    expect(preview).toContain('className="cr-preview-tools');
    expect(preview).toContain("<Suspense fallback={<TemplateLoadingPage />}");
    expect(preview).toContain('data-template-ready={readyTemplate === TemplateComponent ? "true"');
    expect(`${indexCss}\n${preview}`).not.toContain("surface-glass");

    const entryCss = await source("src/styles/air-editor.css");
    expect(indexCss).not.toMatch(/\.acc(?:[-.]|\s*\{)/);
    expect(indexCss).not.toContain(".sub-card");
    expect(entryCss).toContain(".resume-entry-list");
    expect(emptyState).toContain("EntryHeading");
    expect(emptyState).not.toContain("deleteArmed");

    expect(panel).toContain("<h2");
    expect(fields).not.toContain("SectionCard");
    expect(emptyState).toContain("<h3>{heading}</h3>");
    expect(projects).not.toContain("--c-muted");

    expect(app).toContain("<AtsReviewDialog");
    expect(app).toContain("Loading the local review workspace…");
    expect(app).toContain('role="status"');
    expect(app).not.toContain("OrientationLock");
    expect(indexCss).not.toContain("cr-rotate-hint");
    expect(logoPicker).toContain("usePickerPosition(open, buttonRef, popoverRef, query)");
    expect(fieldIssues).toContain("usePickerPosition(open, buttonRef, popoverRef, issues)");
    expect(await source("src/utils/usePickerPosition.ts")).toContain("window.visualViewport");
    expect(logoPicker).not.toContain("focus:outline-none");
  });

  it("documents every live TSX surface and makes output boundaries explicit", async () => {
    const [tsxFiles, audit, readme] = await Promise.all([
      filesBelow("src", ".tsx"),
      source("docs/design-audit.md"),
      source("README.md"),
    ]);
    const inventory = designInventory(audit);

    expect([...inventory.keys()].sort()).toEqual(tsxFiles);
    expect(audit).toContain(`All ${tsxFiles.length} TSX files in \`src/\` were examined`);
    expect(readme).toContain(`complete ${tsxFiles.length}-file TSX audit`);

    for (const file of tsxFiles.filter((path) => path.startsWith("src/templates/"))) {
      expect(inventory.get(file), `${file} must retain the document-output exemption`).toBe(
        "Output",
      );
    }
    expect(inventory.get("src/components/PaginatedCanvas.tsx")).toBe("Output");
    expect(inventory.get("src/utils/richText.tsx")).toBe("Output");
    expect(audit).not.toMatch(/\|\s*Retired\s*\|/);
  });

  it("keeps active product components free of glass, broad transitions, and raw chrome colors", async () => {
    const audit = await source("docs/design-audit.md");
    const inventory = designInventory(audit);
    const activeFiles = [...inventory]
      .filter(([, status]) => status === "Aligned" || status === "Support")
      .map(([path]) => path);
    const rawColorExceptions = new Set([
      // Gamut and document-proof code owns literal colours by definition.
      "src/components/ColorPickerContent.tsx",
      "src/components/TemplatePreview.tsx",
    ]);
    const violations: string[] = [];

    for (const file of activeFiles) {
      let component = withoutComments(await source(file));
      const forbidden = /transition-all|backdrop-(?:blur|filter)|backdropFilter|backdrop-filter/g;
      for (const match of component.matchAll(forbidden)) {
        violations.push(`${file}:${lineNumber(component, match.index ?? 0)} ${match[0]}`);
      }

      // The initial selected *document* colour is data, not chrome. Any other
      // literal in an active component must live in an explicitly named gamut/output file.
      if (file === "src/App.tsx") {
        component = component.replace(/const DEFAULT_PRIMARY\s*=\s*"#[0-9a-f]+";/i, "");
      }
      if (!rawColorExceptions.has(file)) {
        for (const match of component.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
          violations.push(`${file}:${lineNumber(component, match.index ?? 0)} raw ${match[0]}`);
        }
      }
    }

    for (const file of ["src/index.css", "src/cloak-family.css"]) {
      const css = withoutComments(await source(file));
      for (const match of css.matchAll(/transition-all|backdrop-blur/g)) {
        violations.push(`${file}:${lineNumber(css, match.index ?? 0)} ${match[0]}`);
      }
      for (const match of css.matchAll(/backdrop-filter\s*:\s*([^;{}]+)/g)) {
        if (match[1].trim() !== "none") {
          violations.push(`${file}:${lineNumber(css, match.index ?? 0)} ${match[0]}`);
        }
      }
    }

    expect(violations, "active product-chrome exceptions must be explicit").toEqual([]);
  });

  it("does not encode sub-40px targets on active interactive elements", async () => {
    const audit = await source("docs/design-audit.md");
    const inventory = designInventory(audit);
    const activeFiles = [...inventory]
      .filter(([, status]) => status === "Aligned" || status === "Support")
      .map(([path]) => path);
    const violations: string[] = [];
    const interactiveTag = /<(?:button|a|input|select|textarea)\b[\s\S]*?>/g;
    const subForty =
      /\b(?:h|w|min-h|min-w)-(?:[1-9](?:\.5)?|0\.5)!?\b|\b(?:min-|max-)?\[[^\]]+\]:(?:h|w|min-h|min-w)-(?:[1-9](?:\.5)?|0\.5)!?\b/;

    for (const file of activeFiles) {
      const component = withoutComments(await source(file));
      for (const match of component.matchAll(interactiveTag)) {
        const tag = match[0];
        const hiddenControl =
          /type=["']hidden["']/.test(tag) || /className=["'][^"']*\bhidden\b/.test(tag);
        if (!hiddenControl && subForty.test(tag)) {
          violations.push(
            `${file}:${lineNumber(component, match.index ?? 0)} ${tag.replace(/\s+/g, " ").slice(0, 140)}`,
          );
        }
      }
    }

    expect(violations, "interactive elements with explicit targets below 40px").toEqual([]);
  });
});
