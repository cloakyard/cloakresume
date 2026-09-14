/// <reference types="node" />
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { createServer, type ViteDevServer } from "vite";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { blankResume } from "../src/data/blankResume.ts";
import { derivePalette } from "../src/utils/colors.ts";
import { ClassicSidebar } from "../src/templates/ClassicSidebar.tsx";
import { Monograph } from "../src/templates/Monograph.tsx";
import { ExecutiveSerif } from "../src/templates/ExecutiveSerif.tsx";
import { AtsProfessional } from "../src/templates/AtsProfessional.tsx";
import { ModernMinimal } from "../src/templates/ModernMinimal.tsx";
import { GradientHeader } from "../src/templates/GradientHeader.tsx";
import { Bauhaus } from "../src/templates/Bauhaus.tsx";

declare global {
  interface Window {
    paginationTest: typeof import("../src/utils/pagination.ts").paginateMeasured;
    paginationTextLines: typeof import("../src/utils/pagination.ts").renderedTextLines;
  }
}

const chrome = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((path) => path && existsSync(path));

// A real layout engine is necessary here: mocked offsetHeight cannot catch
// clipped text, grid-column drift, or fractional/zoom measurement regressions.
describe.skipIf(!chrome)("measured resume pagination", () => {
  let cacheDir: string;
  let server: ViteDevServer;
  let browser: Browser;
  let page: Page;
  beforeAll(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), "cloak-pagination-test-"));
    server = await createServer({
      cacheDir,
      configFile: false,
      root: new URL("../", import.meta.url).pathname,
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
    });
    await server.listen();
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: true,
      args: ["--no-sandbox"],
    });
    page = await browser.newPage();
    await page.goto(`${server.resolvedUrls!.local[0]}src/utils/pagination.ts`);
    await page.setContent(
      '<style>*{box-sizing:border-box} body{margin:0;font:14px/20px Arial} p{margin:0 0 8px} #source{width:320px} .atom{display:flow-root} .grid{display:grid;grid-template-columns:70px 1fr;gap:10px} .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px} .card{padding:8px;border:1px solid}</style><div id="source"></div><div id="output"></div>',
    );
    await page.addScriptTag({
      type: "module",
      content:
        'import { paginateMeasured, renderedTextLines } from "/src/utils/pagination.ts"; window.paginationTest = paginateMeasured; window.paginationTextLines = renderedTextLines;',
    });
    await page.waitForFunction(() => typeof window.paginationTest === "function");
  }, 30000);
  afterAll(async () => {
    await browser?.close();
    await server?.close();
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
  });

  async function verify(html: string, budget = 220, scale = 1) {
    return page.evaluate(
      async ({ html, budget, scale }) => {
        // The dynamic URL is resolved by the fixture Vite server in Chromium.
        const paginateMeasured = window.paginationTest;
        const source = document.getElementById("source")!;
        source.innerHTML = html;
        source.style.transform = `scale(${scale})`;
        source.style.transformOrigin = "top left";
        const original = source.textContent!.replace(/\s/g, "");
        const groups = paginateMeasured(source, (index: number) => budget - (index ? 20 : 0));
        const output = document.getElementById("output")!;
        output.innerHTML = "";
        const errors: string[] = [];
        for (const [index, group] of groups.entries()) {
          const sheet = document.createElement("div");
          sheet.style.cssText = `width:320px;height:${budget - (index ? 20 : 0)}px;display:flow-root;margin-bottom:25px`;
          output.append(sheet);
          group.forEach((fragment: { index: number; html?: string }) => {
            const atom = document.createElement("div");
            atom.className = "atom";
            atom.innerHTML = fragment.html ?? source.children[fragment.index].innerHTML;
            sheet.append(atom);
          });
          const bottom = sheet.getBoundingClientRect().bottom;
          const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const rect of range.getClientRects())
              if (rect.bottom > bottom + 1)
                errors.push(`page ${index + 1}: ${node.textContent.slice(0, 30)}`);
          }
        }
        // Grids can interleave columns at a page boundary, so compare characters
        // as a multiset as well as checking a distinct end marker in each cell.
        const actual = output.textContent!.replace(/\s/g, "");
        const sort = (text: string) => text.split("").sort().join("");
        return {
          pages: groups.length,
          groups: groups.map((group: { index: number }[]) => group.map((item) => item.index)),
          errors,
          preserved: sort(original) === sort(actual),
          text: actual,
          rawText: output.textContent,
          pageText: [...output.children].map((sheet) => sheet.textContent),
          contexts: groups.map((group) => group.map((item) => item.contextLabel)),
          orphanHeadings: [...output.children].flatMap((sheet, index) => {
            const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
            let last: Node | null = null;
            while (walker.nextNode()) {
              if (walker.currentNode.textContent?.trim()) last = walker.currentNode;
            }
            return last?.parentElement?.closest('[data-keep-with-next="true"]')
              ? [`page ${index + 1}: ${last.textContent}`]
              : [];
          }),
          brokenCards: [...output.querySelectorAll("[data-stat-card]")].filter(
            (card) => !card.querySelector(".value") || !card.querySelector(".label"),
          ).length,
          links: output.querySelectorAll('a[href="https://example.com"]').length,
          gridColumns: [...output.querySelectorAll(".narrative")].map(
            (node) =>
              node.getBoundingClientRect().left - node.parentElement!.getBoundingClientRect().left,
          ),
        };
      },
      { html, budget, scale },
    );
  }

  it("flows oversized rich text without dropping characters, emphasis or links", async () => {
    const result = await verify(
      `<div class="atom"><h2>Summary</h2><p>${"A thoughtful <strong>engineer</strong> ships reliable systems. ".repeat(35)}<a href="https://example.com">Final link</a> SUMMARY_END</p></div>`,
    );
    expect(result.pages).toBeGreaterThan(3);
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    expect(result.links).toBe(1);
    expect(result.text.match(/SUMMARY_END/g)).toHaveLength(1);
  });

  it("retains the narrative column after repeated splits", async () => {
    const result = await verify(
      `<div class="atom"><section class="grid"><div>01 About</div><div class="narrative"><p>${"Measured prose remains in its original column. ".repeat(80)}NARRATIVE_END</p></div></section></div>`,
    );
    expect(result.pages).toBeGreaterThan(5);
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    expect(result.gridColumns.every((left) => left >= 79)).toBe(true);
  });

  it("preserves every cell of a dense grid and long cells", async () => {
    const cells = Array.from(
      { length: 20 },
      (_, index) =>
        `<div class="card">Card ${index} ${"Useful evidence. ".repeat(index === 0 ? 70 : 6)}END_${index}</div>`,
    ).join("");
    const result = await verify(`<div class="atom"><div class="cards">${cells}</div></div>`);
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    for (let index = 0; index < 20; index++) expect(result.text).toContain(`END_${index}`);
  });

  it("keeps a heading with its first item and accounts for fractional heights", async () => {
    const result = await verify(
      '<div class="atom"><div style="height:170.4px">Intro</div></div><div class="atom"><h2 data-keep-with-next="true" style="height:25.2px;margin:0">Experience</h2></div><div class="atom"><p style="height:30.3px;margin:0">First item</p></div>',
    );
    expect(result.groups).toEqual([[0], [1, 2]]);
    expect(result.errors).toEqual([]);
    const dense = await verify(
      Array.from(
        { length: 50 },
        (_, index) =>
          `<div class="atom"><div style="height:10.6px;font:8px/10px Arial">Item ${index}</div></div>`,
      ).join(""),
      105,
    );
    expect(dense.errors).toEqual([]);
    expect(dense.preserved).toBe(true);
  });

  it("makes identical page breaks at different preview zoom levels", async () => {
    const html = `<div class="atom"><p>${"A complete line of substantial resume content. ".repeat(80)}</p></div>`;
    const full = await verify(html);
    const zoomed = await verify(html, 220, 0.45);
    expect(zoomed.pages).toBe(full.pages);
    expect(zoomed.text).toBe(full.text);
    expect(zoomed.errors).toEqual([]);
  });
  it.each([
    ["Classic Sidebar", ClassicSidebar],
    ["Monograph", Monograph],
    ["Executive Serif", ExecutiveSerif],
    ["ATS Professional", AtsProfessional],
    ["Modern Minimal", ModernMinimal],
    ["Gradient Header", GradientHeader],
  ] as const)("wraps and paginates long education details in %s", async (_name, Template) => {
    const resume = structuredClone(blankResume);
    resume.education = [
      {
        id: "education",
        degree: "Master of Science",
        school: "University",
        location: "Remote",
        start: "2018",
        end: "2020",
        detail: "Research into reliable distributed systems. ".repeat(100) + "DETAIL_END",
      },
    ];
    const markup = renderToStaticMarkup(
      createElement(Template, { resume, palette: derivePalette("#047857") }),
    );
    const result = await page.evaluate((markup) => {
      const staging = document.createElement("div");
      staging.className = "resume-root";
      staging.innerHTML = markup;
      document.body.append(staging);
      const source = staging.querySelector<HTMLElement>('[aria-hidden="true"]')!;
      const width = source.getBoundingClientRect().width;
      const groups = window.paginationTest(source, () => 500);
      const output = document.createElement("div");
      staging.append(output);
      const errors: string[] = [];
      for (const group of groups) {
        const sheet = document.createElement("div");
        sheet.className = source.className;
        sheet.style.cssText = `width:${width}px;height:500px;display:flow-root`;
        output.append(sheet);
        for (const fragment of group) {
          const atom = document.createElement("div");
          atom.style.display = "flow-root";
          atom.innerHTML = fragment.html ?? source.children[fragment.index].innerHTML;
          sheet.append(atom);
        }
        const box = sheet.getBoundingClientRect();
        const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const rect of range.getClientRects())
            if (rect.right > box.right + 1 || rect.bottom > box.bottom + 1)
              errors.push(walker.currentNode.textContent.slice(0, 35));
        }
      }
      const result = {
        errors,
        pages: groups.length,
        markers: output.textContent!.match(/DETAIL_END/g)?.length ?? 0,
      };
      staging.remove();
      return result;
    }, markup);
    expect(result.errors).toEqual([]);
    expect(result.pages).toBeGreaterThan(1);
    expect(result.markers).toBe(1);
  });

  it("grows the Bauhaus header for a long headline and all contacts", async () => {
    const resume = structuredClone(blankResume);
    resume.profile.title = "Senior Backend Engineer · Distributed Systems & Streaming";
    resume.contact = Array.from({ length: 7 }, (_, index) => ({
      id: `contact-${index}`,
      kind: "website" as const,
      value: `https://example.com/profile-${index}`,
    }));
    const markup = renderToStaticMarkup(
      createElement(Bauhaus, { resume, palette: derivePalette("#047857") }),
    );
    const result = await page.evaluate((markup) => {
      const staging = document.createElement("div");
      staging.className = "resume-root";
      staging.innerHTML = markup;
      document.body.append(staging);
      const title = staging.querySelector(".bh-title")!;
      const box = title.parentElement!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(title);
      const fits = [...range.getClientRects()].every(
        (rect) => rect.top >= box.top && rect.bottom <= box.bottom,
      );
      const contacts = staging.querySelectorAll(".bh-contact-block > span").length;
      staging.remove();
      return { fits, contacts };
    }, markup);
    expect(result).toEqual({ fits: true, contacts: 7 });
  });
  it("keeps every word in the PDF text layer at its rendered line position", async () => {
    const result = await page.evaluate(() => {
      const source = document.getElementById("source")!;
      source.style.transform = "none";
      source.textContent =
        "Searchable resume text follows the visible printed lines. ".repeat(20) + "TEXT_LAYER_END";
      const lines = window.paginationTextLines(source.firstChild as Text);
      return {
        count: lines.length,
        preserved:
          lines
            .map((line) => line.text)
            .join("")
            .replace(/\s/g, "") === source.textContent.replace(/\s/g, ""),
        inside: lines.every(
          (line) => line.rect.bottom <= source.getBoundingClientRect().bottom + 1,
        ),
      };
    });
    expect(result.count).toBeGreaterThan(5);
    expect(result.preserved).toBe(true);
    expect(result.inside).toBe(true);
  });
  it("preserves inline separator spaces and keeps mixed-size stats on one line", async () => {
    const stats = Array.from(
      { length: 22 },
      (_, index) =>
        `<span class="stat"><strong style="font-size:24px">${index + 10}</strong> Countries supported<br></span>`,
    ).join("");
    const result = await verify(
      `<div class="atom"><p style="font:13px/38px Arial">${stats}</p></div>`,
      230,
    );
    expect(result.errors).toEqual([]);
    for (let index = 0; index < 22; index++)
      expect(result.rawText).toContain(`${index + 10} Countries supported`);
    const emphasis = await verify(
      `<div class="atom"><p>${"A <strong>re</strong>liable engineer works well. ".repeat(35)}</p></div>`,
    );
    expect(emphasis.rawText).toBe("A reliable engineer works well. ".repeat(35));
  });

  it("keeps a stats row together when it fits on the next page", async () => {
    const result = await verify(
      '<div class="atom"><div style="height:130px">Intro</div></div><div class="atom"><div data-stat-row="true" style="height:110px;break-inside:avoid"><strong style="display:block;height:50px">28%</strong><span>Revenue growth</span></div></div>',
    );
    expect(result.groups).toEqual([[0], [1]]);
    expect(result.errors).toEqual([]);
  });
  it("moves compact avoided cards intact but still splits oversized cards", async () => {
    const compact = await verify(
      '<div class="atom"><div style="height:140px">Intro</div></div><div class="atom"><div style="break-inside:avoid;padding:10px"><h3 style="margin:0;font:14px/30px Arial">Credential</h3><p style="margin:0;line-height:20px">Issued by university<br>Valid through 2028</p></div></div>',
    );
    expect(compact.groups).toEqual([[0], [1]]);
    expect(compact.errors).toEqual([]);
    const long = await verify(
      `<div class="atom"><div style="break-inside:avoid;padding:10px"><p>${"A detailed account of professional contributions. ".repeat(100)}CARD_END</p></div></div>`,
    );
    expect(long.pages).toBeGreaterThan(3);
    expect(long.errors).toEqual([]);
    expect(long.preserved).toBe(true);
  });
  it("keeps exact breaks across zoom for short facts inside long cards", async () => {
    const facts = Array.from(
      { length: 35 },
      (_, index) =>
        `<div style="margin-bottom:8px"><strong>Fact ${index}</strong><p>${"Detailed evidence of measurable professional outcomes. ".repeat((index % 3) + 1)}</p></div>`,
    ).join("");
    const markup = `<div class="atom"><div style="break-inside:avoid;padding:10px">${facts}</div></div>`;
    const full = await verify(markup, 300, 1);
    for (const zoom of [0.36, 1.5]) {
      const scaled = await verify(markup, 300, zoom);
      expect(scaled.groups).toEqual(full.groups);
      expect(scaled.text).toEqual(full.text);
      expect(scaled.pages).toBe(full.pages);
      expect(scaled.errors).toEqual([]);
    }
  });
  it("keeps values and labels associated across a 50-stat grid", async () => {
    const stats = Array.from(
      { length: 50 },
      (_, index) =>
        `<div class="card" data-stat-card="true"><div class="value" style="font:24px/30px Arial">${index}%</div><div class="label">Confirmed outcomes across infrastructure and reliability teams ${index}</div></div>`,
    ).join("");
    const result = await verify(`<div class="atom"><div class="cards">${stats}</div></div>`, 350);
    expect(result.pages).toBeGreaterThan(5);
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    expect(result.brokenCards).toBe(0);
  });

  it("keeps nested project titles and subheadings with their first content", async () => {
    const result = await verify(
      `<div class="atom"><div style="height:144px">Earlier work</div></div><div class="atom"><section><div data-keep-with-next="true" style="height:30px">Atlas</div><div><div data-keep-with-next="true" style="height:30px">ABOUT PROJECT</div><p>${"Reliable infrastructure for engineering teams. ".repeat(20)}</p></div><div><div data-keep-with-next="true" style="height:24px">ROLE</div><ul style="margin:0"><li>${"Delivered measurable performance improvements. ".repeat(20)}</li></ul></div></section></div>`,
    );
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    expect(result.orphanHeadings).toEqual([]);
    expect(result.pageText[0]).toBe("Earlier work");
    expect(result.pageText[1]).toContain("AtlasABOUT PROJECTReliable infrastructure");
  });

  it("keeps compact flex facts and nested avoided award records intact", async () => {
    const result = await verify(
      '<div class="atom"><section><div style="height:194px">Earlier language</div><div style="display:flex;flex-wrap:wrap;break-inside:avoid"><span style="width:100%;line-height:20px">Japanese</span><span style="line-height:20px">Intermediate / Conversational</span></div><div style="height:102px">Previous award</div><div style="break-inside:avoid;padding:8px"><strong>Engineering Excellence Award</strong><p style="margin:0;line-height:20px">Company-wide recognition<br>for outstanding engineering<br>and mentorship.</p></div></section></div>',
    );
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    expect(result.pageText.filter((text) => text?.includes("Japanese"))).toEqual([
      expect.stringContaining("JapaneseIntermediate / Conversational"),
    ]);
    expect(
      result.pageText.filter((text) => text?.includes("Engineering Excellence Award")),
    ).toEqual([
      expect.stringContaining(
        "Engineering Excellence AwardCompany-wide recognitionfor outstanding engineeringand mentorship.",
      ),
    ]);
  });

  it("keeps nested skill labels attached to their list", async () => {
    const result = await verify(
      '<div class="atom"><section><div style="height:194px">Earlier skills</div><div><div data-keep-with-next="true" style="height:20px">Databases &amp; Storage</div><p style="margin:0;line-height:20px">PostgreSQL, Redis, DynamoDB<br>Distributed storage systems</p></div></section></div>',
    );
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    expect(result.orphanHeadings).toEqual([]);
    expect(result.pageText[1]).toContain("Databases & StoragePostgreSQL");
  });

  it("uses actual section markers and collective context for mixed section grids", async () => {
    const result = await verify(
      `<div class="atom"><div class="ct-h2">Experience</div><p>${"Built reliable systems. ".repeat(20)}</p></div><div class="atom"><div class="ct-h2">Projects</div><p>${"Delivered useful products. ".repeat(20)}</p></div><div class="atom"><div class="cards"><section><h2>Certifications</h2><p>Professional credential</p></section><section><h2>Extras</h2><p>${"Advisory and mentoring contributions. ".repeat(20)}</p></section></div></div>`,
    );
    expect(result.errors).toEqual([]);
    expect(result.preserved).toBe(true);
    for (let index = 0; index < result.groups.length; index++) {
      result.groups[index].forEach((source, fragment) => {
        expect(result.contexts[index][fragment]).toBe(
          ["Experience", "Projects", "Additional information"][source],
        );
      });
    }
  });

  it("gives Gradient Header extras its own section heading", () => {
    const resume = structuredClone(blankResume);
    resume.extras = [{ id: "advisory", label: "Advisory", value: "Community board member" }];
    const markup = renderToStaticMarkup(
      createElement(GradientHeader, { resume, palette: derivePalette("#047857") }),
    );
    expect(markup).toContain('class="gh-h2" data-keep-with-next="true">Extras</h2>');
  });
});
