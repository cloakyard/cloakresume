/// <reference types="node" />

import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vite-plus/test";

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
    expect(pkg.packageManager).toBe("pnpm@11.21.0");
    expect(workspace).toContain("vite-plus: 0.2.9");
    expect(workspace).toContain("vitest: 4.1.10");
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
    expect(familyCss).toContain("var(--color-accent)");
    expect(`${indexCss}\n${familyCss}\n${tokens}`).not.toMatch(/surface-glass|--glass-/);
  });

  it("registers the same self-hosted UI fonts and wordmark metrics as CloakPDF", async () => {
    const [indexCss, familyCss, brandLogo] = await Promise.all([
      source("src/index.css"),
      source("src/cloak-family.css"),
      source("src/components/BrandLogo.tsx"),
    ]);

    expect(indexCss).toMatch(
      /@font-face\s*\{[\s\S]*?font-family:\s*"Archivo";[\s\S]*?font-weight:\s*100 900;[\s\S]*?url\("\/fonts\/archivo-latin\.woff2"\)/,
    );
    expect(indexCss).toMatch(
      /@font-face\s*\{[\s\S]*?font-family:\s*"JetBrains Mono";[\s\S]*?font-weight:\s*100 800;[\s\S]*?url\("\/fonts\/jetbrains-mono-latin\.woff2"\)/,
    );
    expect(indexCss).not.toMatch(/@fontsource-variable\/(?:archivo|jetbrains-mono|geist-mono)/);
    expect(brandLogo).toContain("text-[1.125rem] leading-none font-[800] tracking-[-0.02em]");
    expect(brandLogo).toContain('width="40"');
    expect(brandLogo).toContain('height="40"');
    expect(brandLogo).toContain('src="/cloakresume-mark.svg"');
    expect(brandLogo).toContain('className="cr-brand-logo__mark shrink-0"');
    expect(familyCss).toMatch(
      /\.cr-brand-logo__mark\s*\{[\s\S]*?width:\s*var\(--logo-size\);[\s\S]*?height:\s*var\(--logo-size\);/,
    );
    expect(brandLogo).toContain('translate="no"');
  });

  it("matches CloakPDF footer provenance and privacy-document structure", async () => {
    const [landing, privacy, familyCss, tokens, tokenJson] = await Promise.all([
      source("src/components/CloakWorkbenchLanding.tsx"),
      source("src/components/PrivacyPolicyModal.tsx"),
      source("src/cloak-family.css"),
      source("tokens.css"),
      source("tokens.json"),
    ]);
    const footer = landing.match(
      /<footer className="cr-statement-footer">([\s\S]*?)<\/footer>/,
    )?.[1];
    const portable = JSON.parse(tokenJson) as { size: Record<string, { $value: string }> };

    expect(footer).toBeDefined();
    expect(footer).toContain("CloakResume / Cloakyard");
    expect(footer).toContain("Build a résumé.");
    expect(footer).toContain("Keep it local.");
    expect(footer).toContain("CloakResume v{__APP_VERSION__}");
    expect(footer).toContain("Built by");
    expect(footer).toContain("Sumit Sahoo");
    expect(footer).toContain("MIT licensed");
    expect(footer).not.toContain("<BrandLogo");

    expect(privacy).toContain("cr-dialog cr-dialog-wide cr-sheet cr-privacy-dialog");
    expect(privacy).toContain("The privacy promise has an architecture.");
    expect(privacy).toContain("Document path");
    expect(privacy).toContain("Routes not present");
    expect(privacy).toContain("Upload server — none");
    expect(privacy).toContain("Complete privacy policy");
    expect(familyCss).toContain(".cr-privacy-dialog__architecture");
    expect(familyCss).toContain(".cr-privacy-policy__section");
    expect(tokens).not.toContain("--logo-size-footer");
    expect(portable.size["logo-footer"]).toBeUndefined();
  });

  it("keeps the shared frame, logo, editor, and overlay geometry explicit", async () => {
    const [tokens, tokenJson, layout, paperToggle, indexCss] = await Promise.all([
      source("tokens.css"),
      source("tokens.json"),
      source("src/components/Layout.tsx"),
      source("src/components/PaperSizeToggle.tsx"),
      source("src/index.css"),
    ]);
    const portable = JSON.parse(tokenJson) as {
      size: Record<string, { $value: string }>;
    };

    expect(tokens).toContain("--color-accent: oklch(0.508 0.118 165.612)");
    expect(tokens).toContain("--page-max: 88rem");
    expect(tokens).toContain("--header-height: 4.5rem");
    expect(tokens).toContain("--editor-header-height: 4rem");
    expect(tokens).toContain("--editor-rail-width: 4.5rem");
    expect(tokens).toContain("--editor-panel-width: 20.5rem");
    expect(tokens).toContain("--editor-panel-width-wide: 24rem");
    expect(tokens).toMatch(
      /@media \(min-width: 80rem\)[\s\S]*?--editor-panel-width:\s*var\(--editor-panel-width-wide\)/,
    );
    expect(portable.size["editor-panel"].$value).toBe("20.5rem");
    expect(portable.size["editor-panel-wide"].$value).toBe("24rem");
    expect(layout).toContain(
      "grid-cols-[var(--editor-rail-width)_var(--editor-panel-width)_minmax(0,1fr)]",
    );
    expect(layout).not.toContain("grid-cols-[72px_328px_1fr]");
    expect(layout).not.toContain("100% Private · Open Source");
    expect(layout).not.toContain("GithubIcon");
    expect(indexCss).toMatch(/\.tb\s*\{[\s\S]*?\bh-10\s+min-h-10\b/);
    expect(paperToggle).toContain("data-paper-size-control={size}");
    expect(paperToggle).toContain('size === "lg" ? "" : "h-10"');
    expect(paperToggle).toContain('size === "lg" ? "min-h-11" : "h-[34px] min-h-0"');
    expect(tokens).toContain("--logo-size: 2.5rem");
    expect(tokens).toContain("--dialog-max: 36rem");
    expect(tokens).toContain("--dialog-wide-max: 68.75rem");
    expect(tokens).toContain("--sheet-max-block-size: 92dvh");
    expect(tokens).toContain("--popover-safe-edge: 1rem");
  });

  it("keeps mobile toolbar, editor entry, and date popovers on the shared geometry", async () => {
    const [viewSegment, layout, monthYear, indexCss, familyCss] = await Promise.all([
      source("src/components/ViewSegment.tsx"),
      source("src/components/Layout.tsx"),
      source("src/components/MonthYearField.tsx"),
      source("src/index.css"),
      source("src/cloak-family.css"),
    ]);

    expect(viewSegment).toContain('className="cr-view-segment');
    expect(viewSegment).toContain("inline-flex h-11");
    expect(viewSegment).toContain("grid h-11 min-h-11 min-w-11");
    expect(familyCss).toContain(".cr-view-segment::after");
    expect(familyCss).toMatch(
      /\.cr-editor-header \.cr-view-segment \.cr-segment-button\[aria-pressed="true"\]\s*\{[\s\S]*?display:\s*none/,
    );
    expect(familyCss).toMatch(
      /@media \(min-width: 21\.25rem\)[\s\S]*?\.cr-editor-header \.cr-view-segment \.cr-segment-button\[aria-pressed="true"\][\s\S]*?display:\s*grid/,
    );

    expect(layout).toContain('<h1 className="sr-only">CloakResume editor</h1>');
    expect(layout).toContain('href="#editor-content"');
    expect(layout).toContain('id: "editor-content"');
    expect(layout).toContain('isMobile ? "px-2.5 py-2.5 gap-1.5"');
    expect(layout).toContain("h-[100dvh] flex flex-col overflow-clip");
    expect(indexCss).toMatch(/html,\s*body,\s*#app\s*\{/);
    expect(indexCss).not.toContain("#root");

    expect(monthYear).toContain("window.visualViewport");
    expect(monthYear).toContain('visualViewport?.addEventListener("resize", updateCoords)');
    expect(monthYear).toContain('visualViewport?.addEventListener("scroll", updateCoords)');
    expect(monthYear).toContain("const spaceAbove");
    expect(monthYear).toContain("const spaceBelow");
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

  it("keeps mobile editing as a 50:50 proof plus one lower-pane task", async () => {
    const [layout, panel] = await Promise.all([
      source("src/components/Layout.tsx"),
      source("src/components/SectionPanel.tsx"),
    ]).then(([layoutSource, panelSource]) => [
      withoutComments(layoutSource),
      withoutComments(panelSource),
    ]);

    expect(layout).toContain("data-mobile-view={mobileView}");
    expect(layout).toMatch(/mobileView === "panel"[\s\S]*?grid-rows-2/);
    expect(layout).toMatch(/grid-rows-2[\s\S]*?aria-label="Résumé preview"[\s\S]*?cr-editor-panel/);
    expect(layout).toContain("mobileSectionOpen ?");
    expect(layout).toContain('aria-label="Résumé section picker"');
    expect(layout).toContain('variant="picker"');
    expect(layout).not.toMatch(/FloatingSectionPill|sectionDrawerOpen|Jump to section/);
    expect(panel).toContain("Close ${meta.label} editor and choose another section");
    expect(panel).toContain("lg:hidden");
    expect(layout).toContain("min-h-0 flex-1");
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
      /(?:contact|skill|stack|handle|chip|pill|url|link|code|email|website)/i;
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
    expect(templateRoots).toHaveLength(15);
    for (const root of templateRoots) {
      expect(root.declarations, root.file).toContain("overflow-wrap: normal");
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
        "src/components/AtsReviewModal.tsx",
        "src/components/PrivacyPolicyModal.tsx",
        "src/components/ConfirmDialog.tsx",
        "src/components/BottomSheet.tsx",
      ].map(source),
    );

    expect(files.every((file) => file.includes("cr-overlay"))).toBe(true);
    expect(files.some((file) => file.includes("cr-dialog-wide"))).toBe(true);
    expect(files.some((file) => file.includes("cr-sheet"))).toBe(true);
    expect(files[1]).toContain("ref={resultsScrollRef}");
    expect(files[1]).toContain("ref={tabAnchorRef}");
    expect(files[1]).toContain("ref={tabPanelScrollRef}");
    expect(files[1]).toContain('onClick={() => selectTab("overview")}');
    expect(files[1]).not.toMatch(
      /onClick=\{\(\) => setTab\("(?:overview|keywords|insights|parse)"\)\}/,
    );
    expect(files[1]).toContain("sticky top-0");
    expect(files[1]).toContain("min-[640px]:overflow-hidden");
    expect(files[4]).toContain("createPortal(");
    expect(files[4]).toContain("document.body");
  });

  it("uses accessible family notices and viewport-safe mobile sheets", async () => {
    const [app, confirm, templates, ats, errors, reload, fieldIssues, notFound] = await Promise.all(
      [
        source("src/App.tsx"),
        source("src/components/ConfirmDialog.tsx"),
        source("src/components/TemplateModal.tsx"),
        source("src/components/AtsReviewModal.tsx"),
        source("src/components/ErrorBoundary.tsx"),
        source("src/components/ReloadPrompt.tsx"),
        source("src/utils/fieldIssues.tsx"),
        source("public/404.html"),
      ],
    );

    expect(app).not.toMatch(/\balert\s*\(/);
    expect(app).toContain('variant="notice"');
    expect(confirm).toContain('variant?: "confirm" | "notice"');
    expect(confirm).toContain('variant === "notice" ? confirmRef : cancelRef');
    expect(confirm).toContain('role={variant === "notice" ? "alertdialog" : "dialog"}');

    for (const sheet of [app, templates, ats]) {
      expect(sheet).toContain("pb-[env(safe-area-inset-bottom,0px)]");
      expect(sheet).toContain("min-[640px]:pb-0");
    }

    expect(errors).toContain('const GITHUB_REPO = "cloakyard/cloakresume"');
    expect(reload).toContain("rounded-md p-4");
    expect(reload).toContain(
      'type ReloadNoticeState = "offline" | "update" | "updating" | "error"',
    );
    expect(reload).toContain("Update & Reload");
    expect(reload).toContain("Updating…");
    expect(reload).toContain("Check your connection, then try again.");
    expect(reload).toContain("This version is cached and ready to use offline.");
    expect(reload).toContain("disabled={isUpdating}");
    expect(reload).toContain('aria-live={isError ? "assertive" : "polite"}');
    expect(reload).not.toContain("now installed for offline use");
    expect(fieldIssues).toContain("divide-y divide-(--line)");
    expect(fieldIssues).not.toContain('className="rounded-md border bg-(--surface) p-2"');
    expect(notFound).toContain("font-size: clamp(2.75rem, 6.4vw, 6.75rem)");
    expect(notFound).toContain("background: var(--color-accent)");
  });

  it("keeps muted and status text legible and preserves keyboard focus cues", async () => {
    const [tokens, tokenJson, ats, contact, viewSegment, overflow, toolbarCenter] =
      await Promise.all([
        source("tokens.css"),
        source("tokens.json"),
        source("src/utils/ats.ts"),
        source("src/components/editor/ContactSection.tsx"),
        source("src/components/ViewSegment.tsx"),
        source("src/components/ToolbarOverflow.tsx"),
        source("src/components/ToolbarCenter.tsx"),
      ]);

    expect(tokens).toContain(
      "--ink-5: color-mix(in oklab, var(--color-ink-3) 95%, var(--color-paper))",
    );
    expect(tokenJson).toContain(
      '"$value": "color-mix(in oklab, var(--color-ink-3) 95%, var(--color-paper))"',
    );
    expect(ats).toContain('color: "var(--color-status-success)"');
    expect(ats).toContain('color: "var(--color-status-warning)"');
    expect(ats).toContain('color: "var(--color-status-danger)"');
    expect(ats).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(contact).toContain("aria-label={`${c.kind} contact value`}");
    expect(contact).not.toContain("focus:outline-none");
    expect(viewSegment).not.toContain("focus-visible:outline-none");
    expect(overflow).not.toContain("focus-visible:outline-none");
    expect(toolbarCenter).toContain('event.key !== "Escape"');
    expect(toolbarCenter).toContain("maxHeight: Math.floor");
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
      orientation,
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
      source("src/components/OrientationLock.tsx"),
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
    expect(tokenCss).toContain("--ease-in: cubic-bezier(0.4, 0, 1, 1)");
    expect(tokenCss).toContain("--ease-standard: cubic-bezier(0.16, 1, 0.3, 1)");
    expect(portable.duration.press.$value).toEqual({ value: 100, unit: "ms" });
    expect(portable.duration.stagger.$value).toEqual({ value: 60, unit: "ms" });
    expect(portable.easing.in.$value).toEqual([0.4, 0, 1, 1]);
    expect(portable.easing.standard.$value).toEqual([0.16, 1, 0.3, 1]);

    expect(indexCss).not.toMatch(/transition-\[[^\]]*box-shadow/);
    const fieldGlowKeyframes =
      indexCss.match(/@keyframes cr-field-glow\s*\{([\s\S]*?)\n\}\n\.cr-field-glow/)?.[1] ?? "";
    expect(fieldGlowKeyframes).not.toContain("box-shadow");
    expect(fieldGlowKeyframes).toContain("opacity");
    expect(fieldGlowKeyframes).toContain("transform");
    expect(indexCss).toContain(".cr-field-glow::after");
    expect(familyCss).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(familyCss).toContain(".cr-family-landing .cr-landing-hero__declaration");
    expect(familyCss).toContain(".cr-overlay {");
    expect(familyCss).toContain('.cr-dialog [role="tabpanel"]:not([hidden])');
    expect(layout).toContain("cr-editor-shell");
    expect(layout).toContain("cr-workspace-enter");
    expect(panel).toContain("cr-section-enter");
    expect(rail).toContain("cr-section-nav-button");
    expect(viewSegment).toContain("cr-segment-button");
    expect(paperToggle).toContain("cr-segment-button");
    expect(templateModal).toContain("cr-template-card");
    expect(reloadPrompt).toContain("cr-toast");
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

    const subCardRule = indexCss.match(/\.sub-card\s*\{([\s\S]*?)\}/)?.[1] ?? "";
    expect(indexCss).not.toMatch(/\.acc(?:[-.]|\s*\{)/);
    expect(subCardRule).toContain("border border-(--line)");
    expect(subCardRule).toContain("bg-(--surface)");
    expect(subCardRule).toContain("p-3");
    expect(subCardRule).not.toContain("rounded-md");
    expect(subCardRule).not.toContain("bg-(--surface-2)");

    expect(panel).toContain("<h2");
    expect(fields).not.toContain("SectionCard");
    expect(emptyState).toContain('<h3 className="m-0 mb-1.5');
    expect(projects).not.toContain("--c-muted");

    expect(app).toContain("fallback={<AtsReviewLoading open={atsOpen} />}");
    expect(app).toContain('role="status"');
    expect(orientation).toContain("useModalDialog<HTMLDivElement>");
    expect(orientation).toContain("tabIndex={-1}");
    expect(orientation).toContain('<span\n        aria-hidden="true"');
    expect(logoPicker).toContain("window.visualViewport");
    expect(fieldIssues).toContain("window.visualViewport");
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
