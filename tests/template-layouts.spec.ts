/// <reference types="node" />
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createServer, preview, type PreviewServer, type ViteDevServer } from "vite-plus";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { TEMPLATE_LIST } from "../src/templates/index.ts";
import type { ResumeData, TemplateId } from "../src/types.ts";
import { templateLayoutFixtures as fixtures } from "./fixtures/template-layouts.ts";

const chrome = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((path) => path && existsSync(path));
const artifactDir = process.env.TEMPLATE_AUDIT_DIR;
const statsTemplates = new Set<TemplateId>([
  "classic-impact",
  "ledger",
  "aurora",
  "bauhaus",
  "horizon",
  "prism",
  "classic-sidebar",
  "monograph",
]);

function displayFields(resume: ResumeData, templateId: TemplateId): string[] {
  const ignored = new Set([
    "id",
    "kind",
    "start",
    "end",
    "year",
    "url",
    "photoUrl",
    "logoIconName",
    "iconName",
  ]);
  const values: string[] = [];
  function walk(value: unknown, key = "") {
    if (ignored.has(key) || (key === "quickStats" && !statsTemplates.has(templateId))) return;
    if (typeof value === "string" && value.trim())
      values.push(...(key === "items" ? value.split(",") : [value]));
    else if (Array.isArray(value)) value.forEach((item) => walk(item));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([name, item]) => walk(item, name));
  }
  walk(resume);
  return values;
}

describe.skipIf(!chrome)("template container and content matrix", () => {
  let server: ViteDevServer | undefined;
  let production: PreviewServer | undefined;
  let cacheDir: string | undefined;
  let browser: Browser;
  let page: Page;
  let url: string;
  const errors: string[] = [];
  const records: unknown[] = [];

  beforeAll(async () => {
    if (process.env.CLOAKRESUME_BROWSER_BUILD === "production") {
      production = await preview({ preview: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
      url = production.resolvedUrls!.local[0];
    } else {
      cacheDir = mkdtempSync(join(tmpdir(), "cloak-template-matrix-"));
      server = await createServer({
        cacheDir,
        server: { host: "127.0.0.1", port: 0 },
        logLevel: "error",
      });
      await server.listen();
      url = server.resolvedUrls!.local[0];
    }
    if (artifactDir) mkdirSync(artifactDir, { recursive: true });
    browser = await puppeteer.launch({ executablePath: chrome, headless: true });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1250 });
    await page.setBypassServiceWorker(true);
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(url);
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
    await server?.close();
    if (production)
      await new Promise<void>((resolve, reject) =>
        production!.httpServer.close((error) => (error ? reject(error) : resolve())),
      );
    if (cacheDir) rmSync(cacheDir, { recursive: true, force: true });
  });

  for (const template of TEMPLATE_LIST)
    for (const paperSize of ["a4", "letter"] as const) {
      it(`${template.name} / ${paperSize}: contains all populated fields`, async () => {
        for (const fixture of fixtures) {
          const errorStart = errors.length;
          await page.emulateMediaType("screen");
          await page.evaluate(
            (payload) => localStorage.setItem("cloakresume:v1", JSON.stringify(payload)),
            {
              resume: fixture.resume,
              templateId: template.id,
              primary: "#047857",
              paperSize,
              activeSection: "profile",
            },
          );
          await page.reload({ waitUntil: "load" });
          await page
            .locator("button")
            .filter((button) => !!button.textContent?.includes("Resume editing"))
            .click();
          await page.waitForSelector('.resume-root[data-template-ready="true"] .resume-page');
          await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            );
          });
          await page.emulateMediaType("print");
          const result = await page.evaluate(
            ({ fields, paperSize }) => {
              const pages = [
                ...document.querySelectorAll<HTMLElement>(".resume-root .resume-page"),
              ];
              const violations: {
                page: number;
                text: string;
                container: string;
                overflow: number[];
              }[] = [];
              const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
              const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
              const readText = (element: Element) => {
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
                let text = "";
                while (walker.nextNode())
                  if (!walker.currentNode.parentElement?.closest("style,script,svg"))
                    text += walker.currentNode.textContent;
                return text;
              };
              for (const [index, page] of pages.entries()) {
                const pageBounds = page.getBoundingClientRect();
                const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                  const node = walker.currentNode;
                  const parent = node.parentElement;
                  if (!parent || parent.closest("style,script,svg") || !node.textContent?.trim())
                    continue;
                  const range = document.createRange();
                  const words: DOMRect[] = [];
                  // Whitespace at a wrapped line can have a box past the line's
                  // right edge, although no ink is painted there.
                  for (const match of node.textContent.matchAll(/\S+/g)) {
                    range.setStart(node, match.index);
                    range.setEnd(node, match.index + match[0].length);
                    words.push(...range.getClientRects());
                  }
                  for (
                    let ancestor: HTMLElement | null = parent;
                    ancestor && page.contains(ancestor);
                    ancestor = ancestor.parentElement
                  ) {
                    const style = getComputedStyle(ancestor);
                    if (["inline", "contents"].includes(style.display)) continue;
                    const box = ancestor.getBoundingClientRect();
                    if (!box.height || !box.width) continue;
                    const background =
                      style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                      style.backgroundColor !== "transparent";
                    const clippedX = ["hidden", "clip"].includes(style.overflowX);
                    const clippedY = ["hidden", "clip"].includes(style.overflowY);
                    const layoutItem =
                      ancestor.parentElement &&
                      ["grid", "flex"].includes(getComputedStyle(ancestor.parentElement).display);
                    const edges = [
                      parseFloat(style.paddingLeft) > 0 ||
                        parseFloat(style.borderLeftWidth) > 0 ||
                        clippedX ||
                        layoutItem,
                      parseFloat(style.paddingRight) > 0 ||
                        parseFloat(style.borderRightWidth) > 0 ||
                        clippedX ||
                        layoutItem,
                      parseFloat(style.paddingTop) > 0 ||
                        parseFloat(style.borderTopWidth) > 0 ||
                        clippedY,
                      parseFloat(style.paddingBottom) > 0 ||
                        parseFloat(style.borderBottomWidth) > 0 ||
                        clippedY,
                    ].map((edge) => !!edge || background || ancestor === page);
                    // Paint boundaries are meaningful even when overflow is visible:
                    // checking paper bounds alone missed the old Bauhaus title box.
                    if (!edges.some(Boolean)) continue;
                    for (const rect of words) {
                      if (!rect.width || !rect.height) continue;
                      const overflow = [
                        box.left - rect.left,
                        rect.right - box.right,
                        box.top - rect.top,
                        rect.bottom - box.bottom,
                      ];
                      if (overflow.some((value, index) => edges[index] && value > 2)) {
                        violations.push({
                          page: index + 1,
                          text: node.textContent.slice(0, 90),
                          container: ancestor.className || ancestor.tagName,
                          overflow,
                        });
                        break;
                      }
                    }
                  }
                }
                const height = ((paperSize === "a4" ? 297 : 279.4) * 96) / 25.4;
                if (Math.abs(pageBounds.height - height) > 2)
                  violations.push({
                    page: index + 1,
                    text: "Paper height",
                    container: "resume-page",
                    overflow: [pageBounds.height - height],
                  });
              }
              // Compare each original atom to the content of all its fragments.
              // This catches lost/duplicated text without confusing sidebar/main
              // interleaving and generated continuation labels with missing prose.
              const changedAtoms: string[] = [];
              let originalText = "";
              for (const channel of ["main", "sidebar"]) {
                const original = [
                  ...document.querySelectorAll(
                    `.resume-root [data-pagination-measure="${channel}"] > [data-pagination-atom]`,
                  ),
                ];
                const fragments = pages
                  .flatMap((page) => [
                    ...page.querySelectorAll<HTMLElement>("[data-pagination-source-index]"),
                  ])
                  .filter((element) => (element.closest("aside") ? "sidebar" : "main") === channel);
                original.forEach((atom, index) => {
                  const before = readText(atom);
                  originalText += before;
                  const after = fragments
                    .filter((fragment) => Number(fragment.dataset.paginationSourceIndex) === index)
                    .map(readText)
                    .join("");
                  // Parallel grid columns interleave differently after a page
                  // break. Their character counts must still match exactly.
                  const characters = (text: string) =>
                    Array.from(segmenter.segment(text.replace(/\s/g, "")), (part) => part.segment)
                      .sort()
                      .join("");
                  if (characters(before) !== characters(after))
                    changedAtoms.push(`${channel}:${index}`);
                });
              }
              const text = normalize(originalText);
              return {
                pages: pages.length,
                violations,
                changedAtoms,
                statCards: pages.flatMap((page) =>
                  [...page.querySelectorAll('[data-stat-card="true"]')].map((card) =>
                    normalize(readText(card)),
                  ),
                ),
                missing: fields.filter((field) => !text.includes(normalize(field))),
              };
            },
            { fields: displayFields(fixture.resume, template.id), paperSize },
          );
          const record = {
            template: template.id,
            paperSize,
            fixture: fixture.name,
            ...result,
            errors: errors.slice(errorStart),
          };
          records.push(record);
          if (artifactDir) {
            const renderedPages = await page.$$(".resume-root .resume-page");
            for (const [index, element] of renderedPages.entries())
              await element.screenshot({
                path: join(
                  artifactDir,
                  `${template.id}-${paperSize}-${fixture.name}-p${index + 1}.png`,
                ),
              });
            writeFileSync(join(artifactDir, "results.json"), JSON.stringify(records, null, 2));
          }
          expect
            .soft(
              { count: result.violations.length, first: result.violations.slice(0, 5) },
              fixture.name,
            )
            .toEqual({ count: 0, first: [] });
          expect.soft(result.missing, fixture.name).toEqual([]);
          expect.soft(result.changedAtoms, fixture.name).toEqual([]);
          const expectedStats = statsTemplates.has(template.id)
            ? fixture.resume.quickStats.map((stat) =>
                `${stat.value}${stat.label}`.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""),
              )
            : [];
          expect.soft(result.statCards, fixture.name).toEqual(expectedStats);
          expect.soft(record.errors, fixture.name).toEqual([]);
        }
      }, 60_000);
    }
});
