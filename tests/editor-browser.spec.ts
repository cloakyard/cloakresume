/// <reference types="node" />

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer, { type Browser, type BrowserContext, type Page } from "puppeteer-core";
import { createServer, preview, type PreviewServer, type ViteDevServer } from "vite-plus";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";
import { blankResume } from "../src/data/blankResume.ts";
import { TEMPLATE_LIST } from "../src/templates/index.ts";

// Use the same local Chrome override as the project's screenshot scripts.
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const paragraph = "I designed systems that process data and help teams improve their work. ".repeat(
  140,
);
const resume = {
  ...blankResume,
  profile: { ...blankResume.profile, summary: paragraph },
  experience: [
    {
      id: "first",
      title: "Engineer",
      company: "Company",
      location: "",
      start: "2020",
      end: "Sep 2025",
      bullets: [paragraph],
    },
    {
      id: "second",
      title: "Consultant",
      company: "Company",
      location: "",
      start: "2025",
      end: " present ",
      bullets: [],
    },
  ],
  projects: [
    { id: "project", name: "Project", description: paragraph, roles: [paragraph], stack: [] },
  ],
  custom: [{ id: "custom", header: "Volunteering", bullets: [paragraph] }],
};

describe.skipIf(!existsSync(chromePath))(
  "editor browser regressions (requires Chrome or CHROME_PATH)",
  { timeout: 15_000 },
  () => {
    let server: ViteDevServer | undefined;
    let previewServer: PreviewServer | undefined;
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let url: string;
    let cacheDir: string | undefined;
    const browserErrors: string[] = [];

    beforeAll(async () => {
      if (process.env.CLOAKRESUME_BROWSER_BUILD === "production") {
        previewServer = await preview({
          preview: { host: "127.0.0.1", port: 0 },
          logLevel: "error",
        });
        url = previewServer.resolvedUrls!.local[0];
      } else {
        cacheDir = mkdtempSync(join(tmpdir(), "cloakresume-editor-vite-cache-"));
        server = await createServer({
          cacheDir,
          server: { host: "127.0.0.1", port: 0 },
          logLevel: "error",
        });
        await server.listen();
        url = server.resolvedUrls!.local[0];
      }
      browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
    }, 30_000);

    beforeEach(async () => {
      browserErrors.length = 0;
      context = await browser.createBrowserContext();
      page = await context.newPage();
      // Fault-injection requests must reach this page's interception handler.
      await page.setBypassServiceWorker(true);
      page.on("pageerror", (error) =>
        browserErrors.push(error instanceof Error ? error.message : String(error)),
      );
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    });
    afterEach(async () => {
      await context?.close();
      expect(browserErrors).toEqual([]);
    });

    afterAll(async () => {
      await browser?.close();
      await server?.close();
      if (cacheDir) rmSync(cacheDir, { recursive: true, force: true });
      if (previewServer)
        await new Promise<void>((resolve, reject) =>
          previewServer!.httpServer.close((error) => (error ? reject(error) : resolve())),
        );
    });

    async function openSection(section: string) {
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.evaluate(
        ({ resume, section }) => {
          localStorage.setItem(
            "cloakresume:v1",
            JSON.stringify({
              resume,
              activeSection: section,
              templateId: "ats-plain",
              primary: "#047857",
              paperSize: "a4",
            }),
          );
        },
        { resume, section },
      );
      await resumeEditing();
    }

    async function resumeEditing() {
      await page.reload({ waitUntil: "networkidle0" });
      await page.evaluate(() => {
        const button = [...document.querySelectorAll("button")].find((el) =>
          el.textContent?.trim().startsWith("Resume editing"),
        );
        button?.click();
      });
      await page.waitForSelector(
        '.cr-editor-panel input:not([type="file"]), .cr-editor-panel textarea',
        { visible: true },
      );
      await page.evaluate(async () => {
        await document.fonts.ready;
        // Auto-growing fields measure a mirror after fonts finish loading. Wait
        // for that scheduled resize before choosing a caret/scroll baseline.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        );
      });
    }

    for (const width of [1440, 390]) {
      it.each([
        ["profile", "profile.summary"],
        ["experience", "experience.0.bullets.0"],
        ["projects", "projects.0.description"],
        ["projects", "projects.0.roles.0"],
        ["custom", "custom.0.bullets.0"],
      ])(
        `keeps focus, caret, and scroll when editing %s / %s at ${width}px`,
        async (section, fieldId) => {
          await page.setViewport({ width, height: 1000 });
          await openSection(section);
          const selector = `textarea[data-field-id="${fieldId}"]`;
          await page.waitForFunction(
            (selector) => (document.querySelector(selector) as HTMLElement).offsetHeight > 1000,
            {},
            selector,
          );
          const before = await page.$eval(selector, async (element) => {
            const field = element as HTMLTextAreaElement;
            field.focus({ preventScroll: true });
            const position = Math.floor(field.value.length / 2);
            field.setSelectionRange(position, position);
            const scroller = field.closest<HTMLElement>(".cr-scroll")!;
            scroller.scrollTop +=
              field.getBoundingClientRect().top -
              scroller.getBoundingClientRect().top +
              field.offsetHeight / 2 -
              scroller.clientHeight / 2;
            await new Promise<void>((done) =>
              requestAnimationFrame(() => requestAnimationFrame(() => done())),
            );
            return { scroll: scroller.scrollTop, position: field.selectionStart };
          });
          await page.keyboard.type("x");
          const after = await page.$eval(selector, async (element) => {
            const field = element as HTMLTextAreaElement;
            await new Promise<void>((done) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => requestAnimationFrame(() => done())),
              ),
            );
            return {
              scroll: field.closest(".cr-scroll")!.scrollTop,
              position: field.selectionStart,
              focused: document.activeElement === field,
            };
          });
          expect(after.focused).toBe(true);
          expect(after.position).toBe(before.position + 1);
          expect(Math.abs(after.scroll - before.scroll)).toBeLessThanOrEqual(1);
        },
        15_000,
      );
    }

    it("disables the end picker for a current job, restores the date, and persists Present", async () => {
      await page.setViewport({ width: 1440, height: 1000 });
      await openSection("experience");
      const checkbox = 'input[name="experience-first-current"]';
      const state = () =>
        page.evaluate(() => ({
          checked: [
            ...document.querySelectorAll<HTMLInputElement>(
              '.cr-editor-panel input[type="checkbox"]',
            ),
          ].map((el) => el.checked),
          dates: [
            ...document.querySelectorAll<HTMLButtonElement>(
              '.cr-editor-panel button[aria-haspopup="dialog"]',
            ),
          ].map((el) => ({ disabled: el.disabled, text: el.textContent?.trim() })),
          clearEndCount: document.querySelectorAll(
            '.cr-editor-panel button[aria-label="Clear end"]',
          ).length,
        }));
      expect((await state()).checked).toEqual([false, true]);
      expect((await state()).dates[3].disabled).toBe(true);
      await page.click(checkbox);
      expect((await state()).checked).toEqual([true, true]);
      expect((await state()).dates[1]).toEqual({ disabled: true, text: "Present" });
      expect((await state()).clearEndCount).toBe(0);
      await page.click(checkbox);
      expect((await state()).dates[1]).toEqual({ disabled: false, text: "Sep 2025" });
      await page.click(checkbox);
      await page.waitForFunction(
        () =>
          JSON.parse(localStorage.getItem("cloakresume:v1")!).resume.experience[0].end ===
          "Present",
      );
      await resumeEditing();
      expect((await state()).checked).toEqual([true, true]);
      expect((await state()).dates[1].disabled).toBe(true);
    });

    async function openDraft(
      draft: unknown = {
        ...blankResume,
        profile: { ...blankResume.profile, summary: "Draft for audit" },
      },
      options = {},
      width = 1440,
      hasTouch = false,
    ) {
      await page.setViewport({ width, height: 1000, hasTouch });
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.evaluate(
        ({ draft, options }) => {
          localStorage.setItem(
            "cloakresume:v1",
            JSON.stringify({
              resume: draft,
              activeSection: "profile",
              templateId: "ats-plain",
              ...options,
            }),
          );
        },
        { draft, options },
      );
      await resumeEditing();
    }

    async function fillTitle(value: string) {
      await page.$eval('textarea[name="profile-headline"]', (element) => {
        (element as HTMLTextAreaElement).focus();
        (element as HTMLTextAreaElement).select();
      });
      await page.keyboard.sendCharacter(value);
    }

    it.each([
      "classic-impact",
      "ledger",
      "horizon",
      "aurora",
      "bauhaus",
      "prism",
      "classic-sidebar",
      "monograph",
    ])("paints PDF stat symbols with the preview's font metrics in %s", async (templateId) => {
      const stats = ["25+", "120%", "6×", "−10%", "$25k", "€5k", "±3", "1/2"];
      await openDraft(
        {
          ...blankResume,
          profile: { name: "PDF Symbols", title: "Engineer", summary: "Summary." },
          quickStats: stats.map((value, i) => ({ id: `stat-${i}`, value, label: `Metric ${i}` })),
        },
        { templateId, paperSize: "a4" },
      );
      await page.waitForSelector('.resume-root[data-template-ready="true"] .resume-page');
      const metrics = await page.evaluate((stats) => {
        const expected: Record<string, number> = {};
        const elements = [...document.querySelectorAll<HTMLElement>(".resume-page *")].filter(
          (element) => !element.children.length && stats.includes(element.textContent ?? ""),
        );
        for (const element of elements) {
          const computed = getComputedStyle(element);
          const ruler = document.createElement("span");
          Object.assign(ruler.style, {
            position: "fixed",
            whiteSpace: "pre",
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontStyle: computed.fontStyle,
            fontVariantNumeric: computed.fontVariantNumeric,
            fontFeatureSettings: computed.fontFeatureSettings,
            letterSpacing: "0px",
          });
          document.body.appendChild(ruler);
          // html2canvas may paint a digit run or individual glyphs depending on
          // letter spacing. Check both, including the plus/percent boundaries.
          const value = element.textContent!;
          const glyphs = [...new Intl.Segmenter().segment(value)].map((part) => part.segment);
          const fragments = new Set([value, ...glyphs, ...(value.match(/\d+/g) ?? [])]);
          for (const fragment of fragments) {
            ruler.textContent = fragment;
            expected[`${fragment}:${computed.fontWeight}:${computed.fontSize}`] =
              ruler.getBoundingClientRect().width;
          }
          ruler.remove();
        }
        const draws: { key: string; width: number }[] = [];
        // Retain the method for instrumentation; every call below binds its canvas.
        // oxlint-disable-next-line typescript/unbound-method
        const original = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
          const font = document.createElement("span").style;
          font.font = this.font;
          const weight =
            font.fontWeight === "normal"
              ? "400"
              : font.fontWeight === "bold"
                ? "700"
                : font.fontWeight;
          const key = `${text}:${weight}:${font.fontSize}`;
          if (key in expected) draws.push({ key, width: this.measureText(text).width });
          if (maxWidth === undefined) original.call(this, text, x, y);
          else original.call(this, text, x, y, maxWidth);
        };
        Object.assign(window, { pdfSymbolDraws: draws });
        return { expected, count: elements.length };
      }, stats);
      expect(metrics.count).toBe(stats.length);
      const directory = mkdtempSync(join(tmpdir(), "cloak-pdf-symbols-"));
      try {
        const session = await page.createCDPSession();
        await session.send("Browser.setDownloadBehavior", {
          behavior: "allowAndName",
          browserContextId: context.id,
          downloadPath: directory,
          eventsEnabled: true,
        });
        const downloaded = new Promise<string>((resolve) => {
          session.on("Browser.downloadProgress", (event) => {
            if (event.state === "completed") resolve(event.guid);
          });
        });
        await page.click('button[aria-label="Export to PDF"]');
        const filename = await downloaded;
        expect(readFileSync(join(directory, filename)).subarray(0, 5).toString()).toBe("%PDF-");
        const draws = await page.evaluate(
          () =>
            (window as unknown as { pdfSymbolDraws: { key: string; width: number }[] })
              .pdfSymbolDraws,
        );
        expect(draws.length).toBeGreaterThan(0);
        for (const draw of draws)
          expect(Math.abs(draw.width - metrics.expected[draw.key]), draw.key).toBeLessThan(0.05);
        for (const symbol of ["+", "%", "×"])
          expect(
            draws.some((draw) => draw.key.split(":")[0].includes(symbol)),
            symbol,
          ).toBe(true);
        // The export-only faces must never leak into the live document.
        expect(
          await page.$eval(".resume-root", (root) => root.innerHTML.includes("CloakPdfFont")),
        ).toBe(false);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    for (const paperSize of ["a4", "letter"]) {
      it.each([
        {
          name: "descriptive labels",
          columns: 2,
          stats: [
            ["1500+", "HC transformation"],
            ["7%", "CSAT enhancement"],
            ["20%", "Productivity enhancement"],
            ["30%", "Training duration optimized"],
          ],
        },
        {
          name: "long values",
          columns: 2,
          stats: [
            ["1,500,000+", "Customers"],
            ["99.999%", "Availability"],
            ["$250,000", "Savings"],
            ["30%", "Growth"],
          ],
        },
        {
          name: "wide characters in short values",
          columns: 2,
          stats: [
            ["GLOBAL", "Reach"],
            ["WINNER", "Award"],
            ["500MW+", "Power"],
            ["100000", "Customers"],
          ],
        },
        {
          name: "compact metrics",
          columns: 4,
          stats: [
            ["25+", "Projects"],
            ["12+", "Years"],
            ["6×", "Awards"],
            ["4", "Talks"],
          ],
        },
      ])("fits Classic Impact stats with $name on " + paperSize, async ({ stats, columns }) => {
        await openDraft(
          {
            ...blankResume,
            profile: {
              name: "Operations Leader",
              title: "Contact Centre Transformation",
              summary: "Summary.",
            },
            quickStats: stats.map(([value, label], i) => ({ id: `stat-${i}`, value, label })),
          },
          { templateId: "classic-impact", paperSize },
        );
        await page.waitForSelector('.resume-root[data-template-ready="true"] .ci-stat');
        await page.emulateMediaType("print");
        const rows = await page.$$eval(".resume-page .ci-stats-row", (elements) =>
          elements.map((element) =>
            [...element.querySelectorAll<HTMLElement>(".ci-stat")].map((card) => {
              const cardBox = card.getBoundingClientRect();
              return [...card.querySelectorAll<HTMLElement>(".ci-stat-value, .ci-stat-label")].map(
                (text) => {
                  const range = document.createRange();
                  range.selectNodeContents(text);
                  const lines = [...range.getClientRects()];
                  return {
                    text: text.textContent,
                    lines: lines.length,
                    inside: lines.every(
                      (line) =>
                        line.left >= cardBox.left + 5 &&
                        line.right <= cardBox.right - 5 &&
                        line.top >= cardBox.top &&
                        line.bottom <= cardBox.bottom - 5,
                    ),
                  };
                },
              );
            }),
          ),
        );
        expect(rows).toHaveLength(stats.length / columns);
        expect(rows.map((row) => row.length)).toEqual(Array(stats.length / columns).fill(columns));
        expect(rows.flat().map((card) => card.map((text) => text.text))).toEqual(stats);
        for (const text of rows.flat(2)) {
          expect(text.inside, text.text ?? "stat text").toBe(true);
          expect(text.lines, text.text ?? "stat text").toBe(1);
        }
      });
    }

    for (const template of TEMPLATE_LIST)
      for (const paperSize of ["a4", "letter"]) {
        it(`preserves four title lines and flags wrapped overflow in ${template.name} / ${paperSize}`, async () => {
          const title = "Staff Engineer\nPlatform\n& Tooling\nLeadership";
          await openDraft(
            {
              ...blankResume,
              profile: {
                name: "Amara Schmidt",
                title,
                summary: "<u>Underlined summary with **bold**, *italic*, and `code`</u>.",
              },
              contact: [{ id: "email", kind: "email", value: "amara@example.com" }],
            },
            { templateId: template.id, paperSize },
          );
          await page.waitForSelector(
            '.resume-root[data-template-ready="true"] .resume-page .resume-profile-title',
          );
          await page.waitForSelector(".resume-page u");
          expect(
            await page.$eval(
              ".resume-page u",
              (element) => getComputedStyle(element).textDecorationLine,
            ),
          ).toBe("underline");
          expect(
            await page.$$eval(".resume-page u *", (elements) =>
              elements.every(
                (element) => getComputedStyle(element).textDecorationLine === "underline",
              ),
            ),
          ).toBe(true);
          const selector = 'textarea[name="profile-headline"]';
          expect(
            await page.$eval(selector, (element) => ({
              rows: (element as HTMLTextAreaElement).rows,
              resize: getComputedStyle(element).resize,
              invalid: element.getAttribute("aria-invalid"),
            })),
          ).toEqual({ rows: 4, resize: "none", invalid: null });
          const renderedTitle = () =>
            page.$eval(".resume-page .resume-profile-title", (element) => {
              const title = element as HTMLElement;
              const style = getComputedStyle(title);
              const bounds = title.getBoundingClientRect();
              const parent = title.parentElement!.getBoundingClientRect();
              return {
                text: title.textContent,
                lines: title.clientHeight / parseFloat(style.lineHeight),
                whiteSpace: style.whiteSpace,
                overflow: style.overflowY,
                clipped: title.scrollHeight > title.clientHeight + 1,
                outside: bounds.left < parent.left - 1 || bounds.right > parent.right + 1,
              };
            });
          const valid = await renderedTitle();
          expect(valid.text).toBe(title);
          expect(valid.lines).toBeCloseTo(4, 1);
          expect(valid.whiteSpace).toBe("pre-line");
          expect(valid.clipped).toBe(false);
          expect(valid.outside).toBe(false);

          // Covers automatic wrapping and pasted text without word boundaries.
          for (const overflow of [
            "Platform engineering and leadership ".repeat(30),
            "PlatformArchitecture".repeat(60),
          ]) {
            await fillTitle(overflow);
            await page.waitForSelector(`${selector}[aria-invalid="true"]`);
            const invalid = await renderedTitle();
            expect(invalid.lines).toBeLessThanOrEqual(4.05);
            expect(invalid.clipped).toBe(true);
            expect(invalid.outside).toBe(false);
            expect((await savedResume()).profile.title).toBe(overflow);
          }
          await page.emulateMediaType("print");
          const printed = await renderedTitle();
          expect(printed.lines).toBeLessThanOrEqual(4.05);
          expect(printed.overflow).toBe("hidden");
          await page.emulateMediaType("screen");
          await fillTitle(title);
          await page.waitForFunction(
            (selector) => !document.querySelector(selector)?.hasAttribute("aria-invalid"),
            {},
            selector,
          );
          expect((await savedResume()).profile.title).toBe(title);
        }, 20_000);
      }

    it("retires the removed active writing field without resurrecting its bullet", async () => {
      await openDraft(
        {
          ...blankResume,
          custom: [{ id: "scope", header: "Writing", bullets: ["Keep this", "Remove this"] }],
        },
        { activeSection: "custom" },
      );
      await page.$eval('[data-field-id="custom.0.bullets.1"]', (el) => {
        (el as HTMLTextAreaElement).focus();
        (el as HTMLTextAreaElement).select();
      });
      const toolbar = '.cr-editor-panel [role="toolbar"]';
      expect(
        await page.$$eval(`${toolbar} button`, (els) =>
          els.every((el) => !(el as HTMLButtonElement).disabled),
        ),
      ).toBe(true);
      const remove = await page.$$('.resume-bullet-list button[aria-label^="Remove "]');
      await remove[1].click();
      await page.click('.cr-editor-panel button[aria-label^="Confirm removal of "]');
      await page.waitForFunction(
        () =>
          document.activeElement === document.querySelector('[data-field-id="custom.0.bullets.0"]'),
      );
      expect(
        await page.$$eval(`${toolbar} button`, (els) =>
          els.every((el) => !(el as HTMLButtonElement).disabled),
        ),
      ).toBe(true);
      expect((await savedResume()).custom[0].bullets).toEqual(["Keep this"]);
      await page.$eval('[data-field-id="custom.0.bullets.0"]', (el) => {
        (el as HTMLTextAreaElement).focus();
        (el as HTMLTextAreaElement).select();
      });
      await page.locator(`${toolbar} button[aria-label="Bold (⌘B)"]`).click();
      await page.waitForFunction(
        () =>
          (document.querySelector('[data-field-id="custom.0.bullets.0"]') as HTMLTextAreaElement)
            .value === "**Keep this**",
      );
      expect((await savedResume()).custom[0].bullets).toEqual(["**Keep this**"]);
    });

    it.each(["light", "dark"])(
      "keeps Air fields readable with one focus contour on a touch tablet in %s",
      async (theme) => {
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
        await openDraft(
          {
            ...blankResume,
            profile: { name: "Amara Schmidt", title: "Engineer", summary: "Local work" },
          },
          {},
          768,
          true,
        );
        expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
        const fields = await page.$$(".cr-editor-panel .resume-writing-field");
        expect(fields.length).toBe(3);
        for (const field of fields) {
          const measured = await field.evaluate((el) => {
            (el as HTMLElement).focus();
            const css = getComputedStyle(el),
              box = el.getBoundingClientRect();
            return {
              height: box.height,
              fontSize: parseFloat(css.fontSize),
              fontFamily: css.fontFamily,
              outline: css.outlineWidth,
              offset: css.outlineOffset,
              border: css.borderColor,
              shadow: css.boxShadow,
            };
          });
          expect(measured.height).toBeGreaterThanOrEqual(44);
          expect(measured.fontSize).toBeGreaterThanOrEqual(16);
          expect(measured.fontFamily).not.toMatch(/mono|Geist/);
          expect(measured.outline).toBe("2px");
          expect(measured.offset).toBe("0px");
          expect(measured.border).toBe("rgba(0, 0, 0, 0)");
          expect(measured.shadow).toBe("none");
        }
        expect(await page.$$eval(".cr-editor-panel .invisible", (els) => els.length)).toBe(0);
        expect(
          await page.$$eval(".resume-format-toolbar button", (els) =>
            els.every(
              (el) =>
                el.getBoundingClientRect().height >= 44 && el.getBoundingClientRect().width >= 44,
            ),
          ),
        ).toBe(true);
      },
    );

    it.each([1440, 320])(
      "toggles underline using the toolbar and keyboard at %ipx",
      async (width) => {
        await openDraft(
          {
            ...blankResume,
            profile: {
              name: "Amara Schmidt",
              title: "Engineer",
              summary: "Important work\nSecond line",
            },
          },
          { templateId: "classic-impact" },
          width,
        );
        const selector = 'textarea[aria-label="Professional summary"]';
        await page.$eval(selector, (element) => {
          (element as HTMLTextAreaElement).scrollIntoView({ block: "center" });
          (element as HTMLTextAreaElement).focus();
          (element as HTMLTextAreaElement).select();
        });
        const underline = '.cr-editor-panel button[aria-label="Underline (⌘U)"]';
        await page.locator(underline).click();
        await page.waitForFunction(
          (selector) => {
            const field = document.querySelector(selector) as HTMLTextAreaElement;
            return (
              document.activeElement === field &&
              field.value === "<u>Important work</u>\n<u>Second line</u>"
            );
          },
          {},
          selector,
        );
        await page.waitForSelector(`${underline}[aria-pressed="true"]`);
        expect(await page.$eval(underline, (element) => element.getAttribute("aria-pressed"))).toBe(
          "true",
        );
        expect(
          await page.$$eval(".resume-page u", (elements) =>
            elements.map((element) => element.textContent),
          ),
        ).toEqual(["Important work", "Second line"]);
        const bounds = await page.$eval('[role="toolbar"]', (element) => {
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, viewport: window.innerWidth };
        });
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
        await page.keyboard.down("Control");
        await page.keyboard.press("u");
        await page.keyboard.up("Control");
        await page.waitForFunction(
          (selector) => {
            const field = document.querySelector(selector) as HTMLTextAreaElement;
            return (
              field.value === "Important work\nSecond line" &&
              field.selectionStart === 0 &&
              field.selectionEnd === field.value.length
            );
          },
          {},
          selector,
        );
        expect((await savedResume()).profile.summary).toBe("Important work\nSecond line");
        await page.keyboard.down("Meta");
        await page.keyboard.press("u");
        await page.keyboard.up("Meta");
        expect((await savedResume()).profile.summary).toBe(
          "<u>Important work</u>\n<u>Second line</u>",
        );
        await resumeEditing();
        expect((await savedResume()).profile.summary).toBe(
          "<u>Important work</u>\n<u>Second line</u>",
        );
      },
    );

    it.each(["profile", "experience", "projects", "custom"])(
      "keeps formatting and bullet actions inside the %s editor at 320px",
      async (activeSection) => {
        await openDraft(resume, { activeSection }, 320);
        const rows = await page.$$eval(".cr-editor-panel .cr-field-row", (elements) =>
          elements
            .filter((element) => element.querySelector('[role="toolbar"]'))
            .map((element) => {
              const row = element.getBoundingClientRect();
              return {
                left: row.left,
                right: row.right,
                actions: [...element.querySelectorAll("button")].map((button) => {
                  const box = button.getBoundingClientRect();
                  return { left: box.left, right: box.right, width: box.width };
                }),
              };
            }),
        );
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          expect(row.actions.length).toBeGreaterThanOrEqual(4);
          for (const action of row.actions) {
            expect(action.left).toBeGreaterThanOrEqual(row.left - 1);
            expect(action.right).toBeLessThanOrEqual(row.right + 1);
            expect(action.width).toBeGreaterThanOrEqual(44);
          }
        }
      },
    );

    it("keeps extra title lines editable and blocks a truncated PDF", async () => {
      await openDraft(
        {
          ...blankResume,
          profile: { name: "Amara Schmidt", title: "Engineer", summary: "Summary." },
        },
        { templateId: "classic-impact" },
      );
      const title = "One\nTwo\nThree\nFour\nFive";
      await fillTitle(title);
      await page.waitForSelector('textarea[name="profile-headline"][aria-invalid="true"]');
      expect(await page.$eval(".cr-editor-panel", (element) => element.textContent)).toContain(
        "Use at most 4 lines",
      );
      expect((await savedResume()).profile.title).toBe(title);
      await page.click('button[aria-label="Export to PDF"]');
      await page.waitForFunction(() =>
        document
          .querySelector('[role="alertdialog"]')
          ?.textContent?.includes("Your title exceeds 4 lines"),
      );
      expect(
        await page.$eval(
          'button[aria-label="Export to PDF"]',
          (element) => (element as HTMLButtonElement).disabled,
        ),
      ).toBe(false);
    });

    it("preserves manual title breaks and Professional language proficiency after reloading on mobile", async () => {
      await openDraft(
        {
          ...blankResume,
          profile: { name: "Amara Schmidt", title: "Engineer", summary: "Summary." },
          languages: [{ id: "english", name: "English", level: "Native · Professional" }],
        },
        { templateId: "classic-impact" },
        390,
      );
      const title = "Staff Engineer\nPlatform & Tooling";
      await fillTitle(title);
      await page.setViewport({ width: 1440, height: 1000 });
      await page.locator('nav button[aria-label="Languages"]').click();
      const select = '.cr-editor-panel select[name="proficiency"]';
      await page.waitForSelector(select);
      expect(await page.$eval(select, (element) => (element as HTMLSelectElement).value)).toBe(
        "Native · Professional",
      );
      await page.select(select, "Professional");
      expect((await savedResume()).languages[0].level).toBe("Professional");
      await page.click('nav button[aria-label="Profile"]');
      await resumeEditing();
      expect(
        await page.$eval(
          'textarea[name="profile-headline"]',
          (element) => (element as HTMLTextAreaElement).value,
        ),
      ).toBe(title);
      expect((await savedResume()).languages[0].level).toBe("Professional");
      expect(await page.$eval(".resume-page", (element) => element.textContent)).toContain(
        "Professional",
      );
    });

    async function clickText(label: string, scope = "") {
      await page.waitForFunction(
        ({ label, scope }) =>
          [...document.querySelectorAll<HTMLButtonElement>(`${scope} button`)].some(
            (element) => element.textContent?.trim() === label,
          ),
        {},
        { label, scope },
      );
      await page.evaluate(
        ({ label, scope }) => {
          const button = [...document.querySelectorAll<HTMLButtonElement>(`${scope} button`)].find(
            (element) => element.textContent?.trim() === label,
          );
          if (!button) throw new Error(`Button not found: ${label}`);
          button.click();
        },
        { label, scope },
      );
    }

    async function savedResume() {
      return page.evaluate(() => {
        window.dispatchEvent(new Event("pagehide"));
        return JSON.parse(localStorage.getItem("cloakresume:v1")!).resume;
      });
    }

    it.each([
      [
        "Contact",
        "contact",
        "Add contact",
        "Add contact",
        "value",
        "example.com",
        "other.example.com",
        "",
      ],
      [
        "Experience",
        "experience",
        "Add a role",
        "Add role",
        "title",
        "Engineer",
        "Architect",
        "role",
      ],
      [
        "Skills",
        "skills",
        "Add a group",
        "Add group",
        "label",
        "Engineering",
        "Leadership",
        "group",
      ],
      [
        "Projects",
        "projects",
        "Add a project",
        "Add project",
        "name",
        "Atlas",
        "Beacon",
        "project",
      ],
      [
        "Education",
        "education",
        "Add an entry",
        "Add entry",
        "degree",
        "Bachelor",
        "Master",
        "entry",
      ],
      [
        "Certifications",
        "certifications",
        "Add a certification",
        "Add certification",
        "name",
        "Certification A",
        "Certification B",
        "certification",
      ],
      ["Awards", "awards", "Add an award", "Add award", "title", "Award A", "Award B", "award"],
      [
        "Languages",
        "languages",
        "Add a language",
        "Add language",
        "name",
        "English",
        "Hindi",
        "language",
      ],
      ["Quick stats", "quickStats", "Add a stat", "Add stat", "value", "12+", "50+", "stat"],
      [
        "Custom",
        "custom",
        "Add a section",
        "Add section",
        "header",
        "Volunteering",
        "Publications",
        "section",
      ],
    ])(
      "adds, edits, reorders, and confirms deletion in %s",
      async (label, key, initialAdd, nextAdd, field, first, second) => {
        await openDraft();
        await page.click(`nav[aria-label="Resume sections"] button[aria-label="${label}"]`);
        await clickText(initialAdd, ".cr-editor-panel");
        const inputs = '.cr-editor-panel input:not([type="checkbox"]):not([type="file"])';
        await page.type(inputs, first);
        await clickText(nextAdd, ".cr-editor-panel");
        const rowSelector = ".cr-editor-panel .cr-drag-item";
        await page.evaluate((rowSelector) => {
          const rows = [...document.querySelectorAll<HTMLElement>(rowSelector)].filter(
            (row) => !row.parentElement?.closest(".cr-drag-item"),
          );
          rows[1].querySelector<HTMLInputElement>('input:not([type="checkbox"])')!.focus();
        }, rowSelector);
        await page.keyboard.type(second);
        const before = await savedResume();
        expect(before[key].map((row: Record<string, string>) => row[field])).toEqual([
          first,
          second,
        ]);
        await page.click('.cr-editor-panel button[aria-label^="Move down "]');
        expect((await savedResume())[key].map((row: Record<string, string>) => row[field])).toEqual(
          [second, first],
        );
        const remove = await page.$eval('.cr-editor-panel button[aria-label^="Remove "]', (el) =>
          el.getAttribute("aria-label")!,
        );
        const confirm = remove.replace(/^Remove /, "Confirm removal of ");
        await page.click(`.cr-editor-panel button[aria-label="${remove}"]`);
        expect((await savedResume())[key]).toHaveLength(2);
        await page.click(`.cr-editor-panel button[aria-label="${confirm}"]`);
        expect((await savedResume())[key].map((row: Record<string, string>) => row[field])).toEqual(
          [first],
        );
      },
    );

    it("keeps outer entry focus at a move boundary and announces the new position", async () => {
      await openDraft(
        {
          ...blankResume,
          custom: [
            { id: "a", header: "First", bullets: ["One"] },
            { id: "b", header: "Second", bullets: ["Two"] },
          ],
        },
        { activeSection: "custom" },
      );
      await page.focus('button[aria-label="Move down section 1"]');
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("aria-label") === "Move down section 2",
      );
      expect(
        await page.$eval('button[aria-label="Move down section 2"]', (el) =>
          el.getAttribute("aria-disabled"),
        ),
      ).toBe("true");
      expect((await savedResume()).custom.map((item: { id: string }) => item.id)).toEqual([
        "b",
        "a",
      ]);
      expect(
        await page.$eval(
          '.resume-section-body > .resume-entry-list > [role="status"]',
          (el) => el.textContent,
        ),
      ).toBe("section 1 moved to position 2 of 2.");
      await page.keyboard.press("Enter");
      expect((await savedResume()).custom.map((item: { id: string }) => item.id)).toEqual([
        "b",
        "a",
      ]);
      await page.focus('button[aria-label="Move up section 2"]');
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("aria-label") === "Move up section 1",
      );
      expect((await savedResume()).custom.map((item: { id: string }) => item.id)).toEqual([
        "a",
        "b",
      ]);
    });

    it("focuses entry actions when pointer activation has no browser focus default", async () => {
      await openDraft(
        { ...blankResume, custom: [{ id: "a", header: "Writing", bullets: ["First", "Second"] }] },
        { activeSection: "custom" },
      );
      // Safari can dispatch a button click after blurring the field to BODY.
      await page.$eval('button[aria-label="Move down section 1, bullet 1"]', (el) => {
        (document.activeElement as HTMLElement)?.blur();
        (el as HTMLButtonElement).click();
      });
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Move down section 1, bullet 2",
      );
      await page.$eval('button[aria-label="Remove section 1, bullet 2"]', (el) => {
        (document.activeElement as HTMLElement)?.blur();
        (el as HTMLButtonElement).click();
      });
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") ===
          "Confirm removal of section 1, bullet 2",
      );
      await page.keyboard.press("Escape");
      expect((await savedResume()).custom[0].bullets).toEqual(["Second", "First"]);
      expect(await page.$(".resume-remove-confirm")).toBeNull();
    });

    it("keeps duplicate bullets and their selected field identity through a move", async () => {
      await openDraft(
        { ...blankResume, custom: [{ id: "a", header: "Writing", bullets: ["Repeat", "Repeat"] }] },
        { activeSection: "custom" },
      );
      const field = await page.$('[data-field-id="custom.0.bullets.0"]');
      await field!.evaluate((el) => {
        (el as HTMLTextAreaElement).focus();
        (el as HTMLTextAreaElement).setSelectionRange(1, 4);
      });
      await page.focus('button[aria-label="Move down section 1, bullet 1"]');
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Move down section 1, bullet 2",
      );
      expect(
        await field!.evaluate((el) => ({
          connected: el.isConnected,
          id: el.getAttribute("data-field-id"),
          start: (el as HTMLTextAreaElement).selectionStart,
          end: (el as HTMLTextAreaElement).selectionEnd,
        })),
      ).toEqual({ connected: true, id: "custom.0.bullets.1", start: 1, end: 4 });
      await page.locator('button[aria-label="Bold (⌘B)"]').click();
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("data-field-id") === "custom.0.bullets.1",
      );
      expect((await savedResume()).custom[0].bullets).toEqual(["Repeat", "R**epe**at"]);
      await resumeEditing();
      expect((await savedResume()).custom[0].bullets).toEqual(["Repeat", "R**epe**at"]);
    });

    it("keeps pending removal on the moved bullet and focuses the surviving field", async () => {
      await openDraft(
        { ...blankResume, custom: [{ id: "a", header: "Writing", bullets: ["First", "Second"] }] },
        { activeSection: "custom" },
      );
      await page.click('button[aria-label="Remove section 1, bullet 1"]');
      await page.click('button[aria-label="Move down section 1, bullet 1"]');
      await page.click('button[aria-label="Confirm removal of section 1, bullet 2"]');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("data-field-id") === "custom.0.bullets.0",
      );
      expect((await savedResume()).custom[0].bullets).toEqual(["Second"]);
    });

    it("cancels removal and recovers focus after the last bullet and entry", async () => {
      await openDraft(
        {
          ...blankResume,
          custom: [{ id: "a", header: "Writing", bullets: ["Keep until confirmed"] }],
        },
        { activeSection: "custom" },
      );
      const remove = 'button[aria-label="Remove section 1, bullet 1"]';
      await page.click(remove);
      await page.keyboard.press("Escape");
      await page.waitForSelector(remove);
      expect((await savedResume()).custom[0].bullets).toEqual(["Keep until confirmed"]);
      await page.click(remove);
      await page.click('button[aria-label="Confirm removal of section 1, bullet 1"]');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("aria-label") === "Add bullet to section 1",
      );
      expect((await savedResume()).custom[0].bullets).toEqual([]);
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("data-field-id") === "custom.0.bullets.0",
      );
      await page.keyboard.type("New bullet");
      expect((await savedResume()).custom[0].bullets).toEqual(["New bullet"]);
      await page.click('button[aria-label="Remove section 1"]');
      await page.click('button[aria-label="Confirm removal of section 1"]');
      await page.waitForFunction(
        () => document.activeElement?.textContent?.trim() === "Add a section",
      );
      expect((await savedResume()).custom).toEqual([]);
    });

    it("contains live announcements inside the scrolling writing pane", async () => {
      await page.evaluateOnNewDocument(() => {
        document.addEventListener("DOMContentLoaded", () => {
          document.documentElement.style.fontSize = "32px";
        });
      });
      await openDraft(
        {
          ...blankResume,
          custom: [
            {
              id: "a",
              header: "Writing",
              bullets: Array(8).fill("Long writing entry. ".repeat(10)),
            },
          ],
        },
        { activeSection: "custom" },
        320,
        true,
      );
      await page.setViewport({ width: 320, height: 568, hasTouch: true });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
          ),
      );
      await page.$eval(".resume-add-bullet", (el) => (el as HTMLButtonElement).click());
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("data-field-id") === "custom.0.bullets.8",
      );
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      expect(
        await page.evaluate(() => {
          const panel = document.querySelector<HTMLElement>(".cr-editor-panel")!;
          const field = document.activeElement!.getBoundingClientRect(),
            box = panel.getBoundingClientRect();
          return {
            parentScroll: panel.scrollTop,
            windowScroll: scrollY,
            fieldVisible: field.top >= box.top - 1 && field.bottom <= box.bottom + 1,
            parentContains: panel.scrollHeight === panel.clientHeight,
          };
        }),
      ).toEqual({ parentScroll: 0, windowScroll: 0, fieldVisible: true, parentContains: true });
    });

    it("leaves external text drops to the editable field", async () => {
      await openDraft(resume, { activeSection: "custom" });
      expect(
        await page.$eval('[data-field-id="custom.0.bullets.0"]', (el) => {
          const transfer = new DataTransfer();
          transfer.setData("text/plain", "Dropped text");
          const event = new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
          });
          el.dispatchEvent(event);
          return event.defaultPrevented;
        }),
      ).toBe(false);
      expect((await savedResume()).custom[0].bullets).toEqual(resume.custom[0].bullets);
    });

    it("drags a nested experience bullet without moving its parent role", async () => {
      await openDraft({
        ...blankResume,
        profile: { ...blankResume.profile, summary: "Drag audit" },
        experience: [
          {
            id: "first",
            title: "First role",
            company: "",
            location: "",
            start: "",
            end: "",
            bullets: ["First bullet", "Second bullet"],
          },
          {
            id: "second",
            title: "Second role",
            company: "",
            location: "",
            start: "",
            end: "",
            bullets: [],
          },
        ],
      });
      await page.click('nav button[aria-label="Experience"]');
      await page.evaluate(() => {
        const field = document.querySelector('[data-field-id="experience.0.bullets.0"]')!;
        const handle = field.closest(".cr-drag-item")!.querySelector('button[draggable="true"]')!;
        handle.dispatchEvent(
          new DragEvent("dragstart", { bubbles: true, dataTransfer: new DataTransfer() }),
        );
      });
      await page.waitForSelector('.cr-editor-panel [data-dragging="true"]');
      await page.evaluate(() => {
        const row = document
          .querySelector('[data-field-id="experience.0.bullets.1"]')!
          .closest(".cr-drag-item")!;
        row.dispatchEvent(
          new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer(),
          }),
        );
      });
      const draft = await savedResume();
      expect(draft.experience.map((role: { id: string }) => role.id)).toEqual(["first", "second"]);
      expect(draft.experience[0].bullets).toEqual(["Second bullet", "First bullet"]);
    });

    it("adds extras without requiring an unrelated quick stat", async () => {
      await openDraft();
      await page.click('nav button[aria-label="Quick stats"]');
      await clickText("Add extra", ".cr-editor-panel");
      await page.type('.cr-editor-panel input[name="label"]', "Availability");
      await page.type('.cr-editor-panel input[name="value"]', "Immediately");
      const draft = await savedResume();
      expect(draft.quickStats).toEqual([]);
      expect(draft.extras).toEqual([
        { id: expect.any(String), label: "Availability", value: "Immediately" },
      ]);
    });

    it.each(["awards", "certifications"])(
      "preserves imported year strings when editing and reloading %s",
      async (section) => {
        const award = {
          id: "award",
          title: "Recognition",
          year: "2020–2026 (ongoing)",
          detail: "Original detail",
        };
        const certification = {
          id: "cert",
          name: "Qualification",
          issuer: "Independent institute",
          year: "Renewed October 2026",
          url: "https://example.com/verify",
        };
        await openDraft(
          { ...blankResume, awards: [award], certifications: [certification] },
          { activeSection: section },
          768,
          true,
        );
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
        const selector = '.cr-editor-panel input[name="year"]';
        const original = section === "awards" ? award.year : certification.year;
        expect(await page.$eval(selector, (el) => (el as HTMLInputElement).value)).toBe(original);
        await page.$eval(selector, (el) => {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        });
        await page.keyboard.type("2026 / annual renewal");
        expect((await savedResume())[section][0].year).toBe("2026 / annual renewal");
        await resumeEditing();
        expect(await page.$eval(selector, (el) => (el as HTMLInputElement).value)).toBe(
          "2026 / annual renewal",
        );
        expect((await savedResume())[section][0]).toEqual({
          ...(section === "awards" ? award : certification),
          year: "2026 / annual renewal",
        });
      },
    );

    it("keeps stats and extras independent through edits, moves, cancellation and reload", async () => {
      const quickStats = [
        { id: "q1", value: "15+", label: "years of experience" },
        { id: "q2", value: "Over one hundred", label: "systems shipped" },
      ];
      const extras = [
        { id: "x1", label: "Work authorization", value: "No sponsorship required" },
        { id: "x2", label: "Availability", value: "After six weeks" },
      ];
      await openDraft({ ...blankResume, quickStats, extras }, { activeSection: "stats" });
      const groups = await page.$$(".resume-content-group");
      const value = await groups[1].$('input[name="value"]');
      await value!.focus();
      await page.keyboard.press("End");
      await page.keyboard.type(" · permanent");
      await groups[1].$('button[aria-label^="Move down "]').then((el) => el!.click());
      await groups[1].$('button[aria-label^="Remove "]').then((el) => el!.click());
      await page.keyboard.press("Escape");
      expect((await savedResume()).quickStats).toEqual(quickStats);
      expect((await savedResume()).extras).toEqual([
        extras[1],
        { ...extras[0], value: extras[0].value + " · permanent" },
      ]);
      await resumeEditing();
      expect((await savedResume()).quickStats).toEqual(quickStats);
      expect((await savedResume()).extras.map((item: { id: string }) => item.id)).toEqual([
        "x2",
        "x1",
      ]);
    });

    it.each([1440, 1024])(
      "analyzes the saved Target JD and returns to editing at %spx",
      async (width) => {
        const jd = "TypeScript Kubernetes leadership. Local requirements with **literal markers**.";
        await openDraft(
          undefined,
          { activeSection: "jd", jobDescription: jd },
          width,
          width === 1024,
        );
        const selector = 'textarea[name="target-job-description"]';
        await page.$eval(selector, (el) => {
          const field = el as HTMLTextAreaElement;
          field.focus();
          field.setSelectionRange(field.value.length, field.value.length);
        });
        await page.keyboard.type(" Additional requirement.");
        const analyze = ".cr-editor-panel .air-button--primary";
        await page.focus(analyze);
        await page.keyboard.press("Enter");
        await page.waitForSelector('[role="dialog"][aria-labelledby]');
        await page.waitForSelector('[role="tab"][id$="tab-keywords"]');
        await page.locator('[role="tab"][id$="tab-keywords"]').click();
        await page.waitForSelector('[role="tabpanel"][id$="panel-keywords"]');
        await page.click('button[aria-label="Close ATS review"]');
        await page.waitForSelector('[role="dialog"]', { hidden: true });
        expect(await page.$eval(analyze, (el) => el === document.activeElement)).toBe(true);
        expect(await page.$eval(selector, (el) => (el as HTMLTextAreaElement).value)).toBe(
          jd + " Additional requirement.",
        );
        await savedResume();
        expect(
          await page.evaluate(
            () => JSON.parse(localStorage.getItem("cloakresume:v1")!).jobDescription,
          ),
        ).toBe(jd + " Additional requirement.");
        await resumeEditing();
        expect(await page.$eval(selector, (el) => (el as HTMLTextAreaElement).value)).toBe(
          jd + " Additional requirement.",
        );
        expect(await page.$(".cr-editor-panel .resume-hint-trigger")).toBeNull();
      },
    );

    it("preserves comma entry, custom labels, and both interests and tools on reload", async () => {
      await openDraft();
      await page.click('nav button[aria-label="Interests & Tools"]');
      const fields = await page.$$(".cr-editor-panel input");
      await fields[0].type("Outside work");
      await fields[1].type("Writing, , Running, Reading,");
      await fields[2].type("Daily toolkit");
      await fields[3].type("Git, Figma, Linux");
      expect(await fields[1].evaluate((element) => (element as HTMLInputElement).value)).toBe(
        "Writing, , Running, Reading,",
      );
      expect(await savedResume()).toMatchObject({
        interestsLabel: "Outside work",
        interests: ["Writing", "Running", "Reading"],
        toolsLabel: "Daily toolkit",
        tools: ["Git", "Figma", "Linux"],
      });
      await page.click('nav button[aria-label="Profile"]');
      await resumeEditing();
      expect(await savedResume()).toMatchObject({
        interests: ["Writing", "Running", "Reading"],
        tools: ["Git", "Figma", "Linux"],
      });
    });

    it("keeps a newly focused editor field focused after dismissing a confirmation", async () => {
      await openDraft();
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
      const selector = 'input[name="profile-name"]';
      const original = await page.$eval(selector, (element) => (element as HTMLInputElement).value);
      await page.locator('button[aria-label="Start a new blank resume"]').click();
      await page.waitForSelector('[role="dialog"]', { visible: true });
      await clickText("Cancel", '[role="dialog"]');
      await page.waitForSelector(".resume-overlay", { hidden: true });
      await page.click(selector);
      await page.keyboard.press("End");
      const addition = " — typing after dismissal keeps every character";
      await page.keyboard.type(addition, { delay: 8 });
      await page.waitForSelector('[role="dialog"]', { hidden: true });
      expect(await page.$eval(selector, (element) => document.activeElement === element)).toBe(
        true,
      );
      expect(await page.$eval(selector, (element) => (element as HTMLInputElement).value)).toBe(
        original + addition,
      );
      expect((await savedResume()).profile.name).toBe(original + addition);
    });

    it("keeps the template picker open when dismissing a nested save-failure notice", async () => {
      await openDraft();
      await page.evaluate(() => {
        const original = Object.getOwnPropertyDescriptor(Storage.prototype, "setItem")!;
        window.addEventListener(
          "restore-storage",
          () => {
            Object.defineProperty(Storage.prototype, "setItem", original);
          },
          { once: true },
        );
        Storage.prototype.setItem = () => {
          throw new DOMException("Quota full", "QuotaExceededError");
        };
      });
      try {
        await page.type('input[name="profile-name"]', " edit");
        await page.click('button[aria-label^="Template:"]');
        await page.waitForSelector('[role="alertdialog"]', { visible: true });
        await page.keyboard.press("Escape");
        await page.waitForSelector('[role="alertdialog"]', { hidden: true });
        expect(await page.$('[aria-label="Search templates"]')).not.toBeNull();
        await page.keyboard.press("Tab");
        expect(
          await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')),
        ).toBe(true);
        await page.keyboard.press("Escape");
        await page.waitForSelector('[aria-label="Search templates"]', { hidden: true });
        expect(
          await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
        ).toMatch(/^Template:/);
      } finally {
        await page.evaluate(() => {
          window.dispatchEvent(new Event("restore-storage"));
          window.dispatchEvent(new Event("pagehide"));
        });
      }
    });

    it("preserves every contact kind, value, validation and browser field semantics", async () => {
      await openDraft({
        ...blankResume,
        contact: [{ id: "contact", kind: "website", value: "example.com" }],
      });
      await page.click('nav button[aria-label="Contact"]');
      const cases = [
        ["email", "person@example.com", "email", "email"],
        ["phone", "+1 (555) 123-4567", "tel", "tel"],
        ["location", "Bengaluru, India", "text", "address-level2"],
        ...["website", "linkedin", "github", "medium", "twitter", "other"].map((kind) => [
          kind,
          `https://${kind}.example.com/profile?q=one`,
          "text",
          "url",
        ]),
      ];
      for (const [kind, value, type, autoComplete] of cases) {
        await page.select('select[aria-label="Contact kind"]', kind);
        const selector = `input[aria-label="${kind} contact value"]`;
        await page.$eval(selector, (el) => (el as HTMLInputElement).select());
        await page.keyboard.type(value);
        expect(
          await page.$eval(selector, (el) => ({
            value: (el as HTMLInputElement).value,
            type: (el as HTMLInputElement).type,
            autoComplete: (el as HTMLInputElement).autocomplete,
            spellcheck: (el as HTMLInputElement).spellcheck,
            invalid: el.getAttribute("aria-invalid"),
            label: (el as HTMLInputElement).labels?.[0].textContent,
          })),
        ).toEqual({
          value,
          type,
          autoComplete,
          spellcheck: kind === "location",
          invalid: null,
          label: "Value",
        });
        await page.$eval(selector, (el) => (el as HTMLInputElement).select());
        await page.keyboard.type("malformed");
        expect(await page.$eval(selector, (el) => el.getAttribute("aria-invalid"))).toBe(
          kind === "location" ? null : "true",
        );
        await page.$eval(selector, (el) => (el as HTMLInputElement).select());
        await page.keyboard.press("Backspace");
        expect(await page.$eval(selector, (el) => el.getAttribute("aria-invalid"))).toBeNull();
        await page.keyboard.type(value);
      }
      expect((await savedResume()).contact).toEqual([
        { id: "contact", kind: "other", value: "https://other.example.com/profile?q=one" },
      ]);
    });

    it("keeps contact reorder and remove controls inside the entry at 320px", async () => {
      await openDraft({
        ...blankResume,
        profile: { ...blankResume.profile, summary: "Contact layout" },
        contact: [{ id: "a", kind: "linkedin", value: "linkedin.com/in/example" }],
      });
      await page.click('nav button[aria-label="Contact"]');
      await page.setViewport({ width: 320, height: 900 });
      await page.waitForSelector('.cr-editor-panel button[aria-label^="Remove "]', {
        visible: true,
      });
      const clipped = await page.evaluate(() => {
        const row = document
          .querySelector(".cr-editor-panel .cr-drag-item")!
          .getBoundingClientRect();
        return [
          ...document.querySelectorAll<HTMLElement>(
            ".cr-editor-panel .cr-drag-item button, .cr-editor-panel .cr-drag-item select",
          ),
        ]
          .filter((element) => element.getClientRects().length > 0)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < row.left || rect.right > row.right;
          })
          .map((element) => element.getAttribute("aria-label"));
      });
      expect(clipped).toEqual([]);
      await page.click('.cr-editor-panel button[aria-label^="Remove "]');
      await page.click('.cr-editor-panel button[aria-label^="Confirm removal of "]');
      expect((await savedResume()).contact).toEqual([]);
    });

    it.each([
      [1920, "light"],
      [320, "light"],
      [1920, "dark"],
      [320, "dark"],
    ] as const)(
      "keeps Air writing and contact focus contours unclipped at %ipx in %s mode",
      async (width, theme) => {
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await openDraft({
          ...blankResume,
          profile: { ...blankResume.profile, summary: "Focus audit" },
          contact: [{ id: "focus", kind: "email", value: "name@example.com" }],
        });
        await page.focus('input[name="profile-name"]');
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        const writingRing = await page.$eval('input[name="profile-name"]', (element) => {
          const style = getComputedStyle(element);
          return {
            focused: document.activeElement === element,
            width: style.outlineWidth,
            offset: style.outlineOffset,
            shadow: style.boxShadow,
            border: style.borderColor,
          };
        });
        expect(writingRing).toEqual({
          focused: true,
          width: "2px",
          offset: "0px",
          shadow: "none",
          border: "rgba(0, 0, 0, 0)",
        });
        const expectedRing = await page.evaluate(() => {
          const probe = document.createElement("span");
          probe.style.outline = "2px solid var(--air-accent)";
          document.body.append(probe);
          const outline = getComputedStyle(probe).outline;
          probe.remove();
          return { outline, offset: "0px", shadow: "none" };
        });
        await page.click('nav button[aria-label="Contact"]');
        await page.setViewport({ width, height: 1000 });
        // A responsive shell change remounts the panel. Wait for that committed
        // layout before taking element handles; detached nodes have empty styles.
        await page.waitForFunction(
          (compact) =>
            document.querySelector(".cr-editor-panel")?.classList.contains("relative") === compact,
          {},
          width < 1024,
        );
        for (const selector of [
          'select[aria-label="Contact kind"]',
          'input[aria-label="email contact value"]',
          '.cr-editor-panel button[aria-label^="Remove "]',
        ]) {
          await page.keyboard.press("Tab");
          await page.$eval(selector, (element) => {
            element.scrollIntoView({ block: "center" });
            (element as HTMLElement).focus({ preventScroll: true });
          });
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          );
          const result = await page.$eval(selector, (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
            const clipped: string[] = [];
            for (let parent = element.parentElement; parent; parent = parent.parentElement) {
              const bounds = parent.getBoundingClientRect();
              const parentStyle = getComputedStyle(parent);
              if (
                parentStyle.overflowX !== "visible" &&
                (rect.left - extent < bounds.left - 0.5 || rect.right + extent > bounds.right + 0.5)
              )
                clipped.push("horizontal");
              if (
                parentStyle.overflowY !== "visible" &&
                (rect.top - extent < bounds.top - 0.5 || rect.bottom + extent > bounds.bottom + 0.5)
              )
                clipped.push("vertical");
            }
            return {
              focused: document.activeElement === element,
              ring: {
                outline: style.outline,
                offset: style.outlineOffset,
                shadow: style.boxShadow,
              },
              clipped,
            };
          });
          const expected = selector.includes("button")
            ? await page.evaluate(() => {
                const probe = document.createElement("span");
                probe.style.outline = "2px solid var(--air-accent)";
                document.body.append(probe);
                const outline = getComputedStyle(probe).outline;
                probe.remove();
                return { outline, offset: "2px", shadow: "none" };
              })
            : expectedRing;
          expect(result.focused).toBe(true);
          expect(result.ring).toEqual(expected);
          expect(result.clipped).toEqual([]);
        }
        const input = 'input[aria-label="email contact value"]';
        await page.$eval(input, (element) => (element as HTMLInputElement).select());
        await page.type(input, "invalid");
        expect(await page.$eval(input, (element) => element.getAttribute("aria-invalid"))).toBe(
          "true",
        );
        expect(
          await page.$eval(input, (element) => {
            const description = element.getAttribute("aria-describedby");
            return description && document.getElementById(description)?.textContent;
          }),
        ).toBe("Enter a valid email address.");
        await page.focus('.cr-editor-panel button[aria-label^="Remove "]');
        await page.waitForFunction(
          (selector) => {
            const element = document.querySelector(selector)!;
            const token = document.createElement("span");
            token.style.color = "var(--air-danger)";
            document.body.append(token);
            const matches = getComputedStyle(element).borderColor === getComputedStyle(token).color;
            token.remove();
            return matches;
          },
          {},
          input,
        );
        await page.$eval(input, (element) => (element as HTMLInputElement).select());
        await page.type(input, "correct@example.com");
        expect(
          await page.$eval(input, (element) => element.getAttribute("aria-invalid")),
        ).toBeNull();
        expect((await savedResume()).contact[0].value).toBe("correct@example.com");
      },
    );

    it.each([1920, 320])(
      "keeps focus rings inside scrolling icon and year grids at %ipx",
      async (width) => {
        await openDraft({
          ...blankResume,
          profile: { ...blankResume.profile, summary: "Picker focus audit" },
          education: [
            {
              id: "focus",
              degree: "Degree",
              school: "School",
              location: "",
              detail: "",
              start: "2020",
              end: "2024",
            },
          ],
        });
        await page.setViewport({ width, height: 1000 });
        await page.locator('button[aria-label="Logo icon: none"]').click();
        await page.waitForSelector('[aria-label="Choose a logo icon"] .cr-scroll button');
        async function checkEdges(selector: string, expectedExtent = 4) {
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          );
          const buttons = await page.$$(selector);
          for (const index of [0, buttons.length - 1]) {
            await page.keyboard.press("Tab");
            await buttons[index].evaluate((element) => {
              element.scrollIntoView({ block: "center" });
              (element as HTMLElement).focus({ preventScroll: true });
            });
            const space = await buttons[index].evaluate((element) => {
              const style = getComputedStyle(element);
              const extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
              const rect = element.getBoundingClientRect();
              const grid = element.closest(".cr-scroll")!.getBoundingClientRect();
              return {
                extent,
                gaps: [
                  rect.left - grid.left,
                  grid.right - rect.right,
                  rect.top - grid.top,
                  grid.bottom - rect.bottom,
                ],
              };
            });
            expect(space.extent).toBe(expectedExtent);
            for (const gap of space.gaps)
              expect(gap, JSON.stringify({ selector, index, space })).toBeGreaterThanOrEqual(
                space.extent - 0.5,
              );
          }
        }
        await checkEdges('[aria-label="Choose a logo icon"] .cr-scroll button', 5);
        await page.keyboard.press("Escape");
        await page.setViewport({ width: 1920, height: 1000 });
        // Resizing updates the responsive React layout on the next render.
        await page.locator('nav button[aria-label="Education"]').click();
        await page.setViewport({ width, height: 1000 });
        await page.locator('.cr-editor-panel button[aria-haspopup="dialog"]').click();
        await page.locator('button[aria-label="Select year"]').click();
        await checkEdges('[role="dialog"] .cr-scroll button', 5);
      },
    );

    it("selects and clears a logo and an education month/year", async () => {
      await openDraft();
      await page.click('button[aria-label="Logo icon: none"]');
      await page.type('input[aria-label="Search logo icons"]', "Code");
      const icon = await page.$('[role="dialog"][aria-label="Choose a logo icon"] button');
      const name = await icon!.evaluate((element) => element.getAttribute("aria-label"));
      await icon!.click();
      expect((await savedResume()).profile.logoIconName).toBe(name);
      await page.click('button[aria-label="Clear logo"]');
      expect((await savedResume()).profile.logoIconName).toBeUndefined();
      await page.click('nav button[aria-label="Education"]');
      await clickText("Add an entry", ".cr-editor-panel");
      await page.click('.cr-editor-panel button[aria-haspopup="dialog"]');
      await page.click('button[aria-label="Select year"]');
      await clickText("2020", '[role="dialog"]');
      await clickText("Mar", '[role="dialog"]');
      expect((await savedResume()).education[0].start).toBe("Mar 2020");
      await page.click('button[aria-label="Clear start"]');
      expect((await savedResume()).education[0].start).toBe("");
    });

    it("preserves unknown logo values and restores focus across empty search, Escape and clear", async () => {
      const imported = "Imported custom icon";
      await openDraft({
        ...blankResume,
        profile: { ...blankResume.profile, summary: "Logo audit", logoIconName: imported },
      });
      await page.focus(".resume-logo-trigger");
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("name") === "logo-icon-search",
      );
      await page.type('[name="logo-icon-search"]', "NoSuchIcon".repeat(20));
      expect(await page.$eval(".resume-logo-empty", (e) => e.textContent)).toContain(
        "No icons match",
      );
      expect((await savedResume()).profile.logoIconName).toBe(imported);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-logo-trigger"),
      );
      expect(await page.$(".resume-logo-picker")).toBeNull();
      await page.click('[aria-label="Clear logo"]');
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-logo-trigger"),
      );
      expect((await savedResume()).profile.logoIconName).toBeUndefined();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("name") === "logo-icon-search",
      );
      await page.keyboard.press("Tab");
      expect(await page.$(".resume-logo-picker")).toBeNull();
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
    });

    it("opens the logo surface on touch without focusing search, and saves skill icons", async () => {
      await openDraft(
        {
          ...blankResume,
          profile: { ...blankResume.profile, summary: "Touch logo" },
          skills: [{ id: "skill", label: "Tools", items: "TypeScript" }],
        },
        { activeSection: "skills" },
        390,
        true,
      );
      const trigger = await page.$(".resume-logo-trigger");
      await trigger!.tap();
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-logo-picker"),
      );
      expect(
        await page.$eval('[name="logo-icon-search"]', (e) => document.activeElement === e),
      ).toBe(false);
      await page.type('[name="logo-icon-search"]', "Code");
      const icon = await page.$(".resume-logo-grid button");
      const name = await icon!.evaluate((e) => e.getAttribute("aria-label"));
      await icon!.tap();
      await page.waitForFunction(
        (value) =>
          document.querySelector(".resume-logo-trigger")?.getAttribute("aria-label") ===
          `Logo icon: ${value}`,
        {},
        name,
      );
      expect((await savedResume()).skills[0].iconName).toBe(name);
      await page.click('[aria-label="Clear logo"]');
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-logo-trigger"),
      );
      expect((await savedResume()).skills[0].iconName).toBeUndefined();
    });

    it("preserves photo bytes on cancel and invalid replacement, and returns focus after removal", async () => {
      await openDraft();
      const photo = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 8;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#285ad7";
        ctx.fillRect(0, 0, 8, 8);
        const url = canvas.toDataURL("image/png");
        const transfer = new DataTransfer();
        transfer.items.add(
          new File(
            [Uint8Array.from(atob(url.split(",")[1]), (c) => c.charCodeAt(0))],
            "portrait.png",
            { type: "image/png" },
          ),
        );
        const input = document.querySelector<HTMLInputElement>('[name="profile-photo"]')!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return url;
      });
      await page.waitForSelector(".resume-photo img");
      expect((await savedResume()).profile.photoUrl).toBe(photo);
      await page.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>('[name="profile-photo"]')!;
        input.dispatchEvent(new Event("cancel", { bubbles: true }));
        const transfer = new DataTransfer();
        transfer.items.add(new File(["wrong type"], "portrait.gif", { type: "image/gif" }));
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForSelector('.resume-photo [role="alert"]');
      expect((await savedResume()).profile.photoUrl).toBe(photo);
      await clickText("Remove photo", ".resume-photo");
      expect((await savedResume()).profile.photoUrl).toBeUndefined();
      expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(
        "Add photo",
      );
      expect(await page.$('.resume-photo [role="alert"]')).toBeNull();
    });

    it("preserves imported partial dates until selection and returns focus through year, clear and Present", async () => {
      await openDraft({
        ...blankResume,
        profile: { ...blankResume.profile, summary: "Partial dates" },
        education: [
          {
            id: "dates",
            degree: "Degree",
            school: "School",
            location: "",
            detail: "",
            start: "Spring 1930",
            end: "March, 2024",
          },
        ],
      });
      await page.click('nav button[aria-label="Education"]');
      const trigger = ".resume-date-trigger";
      await page.focus(trigger);
      await page.keyboard.press("Enter");
      await page.waitForSelector(".resume-date-picker");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-picker"),
      );
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
        "Previous year",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-trigger"),
      );
      expect((await savedResume()).education[0].start).toBe("Spring 1930");
      await page.keyboard.press("Enter");
      await page.locator('button[aria-label="Select year"]').click();
      await clickText("2020", ".resume-year-grid");
      expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
        "Select year",
      );
      expect((await savedResume()).education[0].start).toBe("Spring 1930");
      await clickText("Year only", ".resume-date-picker");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-trigger"),
      );
      expect((await savedResume()).education[0].start).toBe("2020");
      await page.click('button[aria-label="Clear start"]');
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-trigger"),
      );
      expect((await savedResume()).education[0].start).toBe("");
      await page.$$eval(trigger, (els) => (els[1] as HTMLButtonElement).click());
      await page.waitForSelector(".resume-date-picker");
      expect(
        await page.$eval('.resume-date-grid button[aria-pressed="true"]', (e) => e.textContent),
      ).toBe("Mar");
      await clickText("Done", ".resume-date-picker");
      expect((await savedResume()).education[0].end).toBe("March, 2024");
      await page.$$eval(trigger, (els) => (els[1] as HTMLButtonElement).click());
      await clickText("Present", ".resume-date-picker");
      expect((await savedResume()).education[0].end).toBe("Present");
      await page.waitForFunction(
        () => document.activeElement === document.querySelectorAll(".resume-date-trigger")[1],
      );
    });

    it("dismisses the year grid before its date popup, leaves by Tab and keeps closing controls inert", async () => {
      await page.setViewport({ width: 1440, height: 1000 });
      await openSection("experience");
      const trigger = ".resume-date-trigger";
      await page.click(trigger);
      await page.locator('button[aria-label="Select year"]').click();
      await page.waitForFunction(() => document.activeElement?.closest(".resume-year-grid"));
      await page.keyboard.press("Escape");
      expect(await page.$(".resume-year-grid")).toBeNull();
      expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
        "Select year",
      );
      await page.keyboard.press("Escape");
      expect(await page.$eval(".resume-date-picker", (e) => (e as HTMLElement).inert)).toBe(true);
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-trigger"),
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-picker"),
      );
      await page.keyboard.down("Shift");
      await page.keyboard.press("Tab");
      await page.keyboard.up("Shift");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-trigger"),
      );
      await page.keyboard.press("Enter");
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("resume-date-picker"),
      );
      await page.$eval(".resume-date-actions button:last-child", (e) =>
        (e as HTMLButtonElement).focus(),
      );
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
        "Clear start",
      );
      expect((await savedResume()).experience[0].start).toBe("2020");
    });

    async function openColour(width = 1440) {
      if (width < 1024) {
        await page.click('button[aria-label="More options"]');
        await clickText("Primary colour", '[role="dialog"]');
      } else await page.click('button[aria-label="Primary colour"]');
      await page.waitForSelector(".resume-colour-picker", { visible: true });
      await page.waitForFunction(() =>
        document.querySelector(".resume-colour-picker")?.contains(document.activeElement),
      );
    }

    const colourHex = () =>
      page.$eval('[name="resume-primary-hex"]', (el) => (el as HTMLInputElement).value);
    async function enterColour(value: string) {
      await page.$eval('[name="resume-primary-hex"]', (el) => (el as HTMLInputElement).select());
      await page.keyboard.sendCharacter(value);
    }

    it.each([1440, 390])(
      "preserves the exact primary colour when opening, dismissing and restoring at %ipx",
      async (width) => {
        await openDraft(undefined, { primary: "#123456" }, width, width < 1024);
        const before = await page.$eval(".resume-root", (el) => el.innerHTML);
        await openColour(width);
        expect(await colourHex()).toBe("#123456");
        expect(await page.$eval(".resume-root", (el) => el.innerHTML)).toBe(before);
        if (width < 1024) {
          expect(await page.$eval("#app", (el) => (el as HTMLElement).inert)).toBe(true);
          expect(
            await page.evaluate(() =>
              document.activeElement?.classList.contains("resume-colour-picker"),
            ),
          ).toBe(true);
          await page.focus(".resume-colour-fine summary");
          await page.keyboard.press("Tab");
          expect(
            await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
          ).toBe("Close primary colour");
          await page.keyboard.down("Shift");
          await page.keyboard.press("Tab");
          await page.keyboard.up("Shift");
          expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("SUMMARY");
        } else
          expect(await page.evaluate(() => document.activeElement?.getAttribute("name"))).toBe(
            "resume-primary-brightness",
          );
        await page.keyboard.press("Escape");
        await page.waitForSelector(".resume-colour-picker", { hidden: true });
        expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
          width < 1024 ? "More options" : "Primary colour",
        );
        expect(await page.$eval("#app", (el) => (el as HTMLElement).inert)).toBe(false);
        await resumeEditing();
        await openColour(width);
        expect(await colourHex()).toBe("#123456");
        if (width < 1024) {
          await page.mouse.click(2, 2);
          await page.waitForSelector(".resume-colour-picker", { hidden: true });
          expect(
            await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
          ).toBe("More options");
        }
      },
    );

    it("keeps hue and saturation through black, and hue through grey, with native precision keys", async () => {
      await openDraft(undefined, { primary: "#2563EB" });
      await openColour();
      await page.click(".resume-colour-fine summary");
      const range = (name: string) =>
        page.$eval(`[name="resume-primary-${name}"]`, (el) => (el as HTMLInputElement).value);
      const hue = await range("hue"),
        saturation = await range("saturation");
      await page.focus('[name="resume-primary-brightness"]');
      await page.keyboard.press("Home");
      expect(await colourHex()).toBe("#000000");
      expect(await range("hue")).toBe(hue);
      expect(await range("saturation")).toBe(saturation);
      await page.keyboard.press("End");
      expect(await colourHex()).not.toBe("#ffffff");
      await page.focus('[name="resume-primary-saturation"]');
      await page.keyboard.press("Home");
      expect(await colourHex()).toBe("#ffffff");
      expect(await range("hue")).toBe(hue);
      await page.keyboard.press("End");
      expect(await colourHex()).not.toBe("#ffffff");
      await enterColour("#000000");
      expect(await range("hue")).toBe(hue);
      expect(await range("saturation")).toBe("100");
      await page.focus('[name="resume-primary-brightness"]');
      await page.keyboard.press("End");
      expect(await colourHex()).not.toBe("#ffffff");
    });

    it("retains invalid hex drafts and the last output, and preserves all ten preset shortcuts", async () => {
      await openDraft(undefined, { primary: "#123456" });
      await openColour();
      await enterColour("#not-a-colour");
      expect(
        await page.$eval('[name="resume-primary-hex"]', (el) => el.getAttribute("aria-invalid")),
      ).toBeNull();
      await page.keyboard.press("Tab");
      expect(await colourHex()).toBe("#not-a-colour");
      expect(
        await page.$eval('[name="resume-primary-hex"]', (el) => el.getAttribute("aria-invalid")),
      ).toBe("true");
      const saved = await page.evaluate(() => {
        window.dispatchEvent(new Event("pagehide"));
        return JSON.parse(localStorage.getItem("cloakresume:v1")!).primary;
      });
      expect(saved).toBe("#123456");
      await enterColour("#aBc");
      expect(await colourHex()).toBe("#aBc");
      await enterColour("#Ab12Cd");
      expect(await colourHex()).toBe("#Ab12Cd");
      expect(
        await page.$eval('[name="resume-primary-hex"]', (el) => el.getAttribute("aria-invalid")),
      ).toBeNull();
      for (const [name, value] of [
        ["Emerald", "#047857"],
        ["Ocean", "#2563EB"],
        ["Violet", "#7C3AED"],
        ["Rose", "#E11D48"],
        ["Amber", "#D97706"],
        ["Slate", "#334155"],
        ["Teal", "#0D9488"],
        ["Indigo", "#4F46E5"],
        ["Crimson", "#B91C1C"],
        ["Graphite", "#111827"],
      ]) {
        await page.click(`button[aria-label="Set primary colour to ${name}"]`);
        expect(await colourHex()).toBe(value);
      }
    });

    it("owns one wheel pointer, restores cancelled drags exactly, and keeps brightness on selection", async () => {
      await openDraft(undefined, { primary: "#123456" });
      await openColour();
      const box = await (await page.$(".air-colour-wheel"))!.boundingBox();
      const x = box!.x + box!.width / 2,
        y = box!.y + 1;
      await page.mouse.move(x, y);
      await page.mouse.down();
      const selected = await colourHex();
      expect(selected).not.toBe("#123456");
      expect(
        await page.$eval(
          '[name="resume-primary-brightness"]',
          (el) => (el as HTMLInputElement).value,
        ),
      ).toBe("34");
      await page.$eval(".air-colour-wheel", (el) =>
        el.dispatchEvent(
          new PointerEvent("pointermove", { bubbles: true, pointerId: 9, clientX: 0, clientY: 0 }),
        ),
      );
      expect(await colourHex()).toBe(selected);
      await page.$eval(".air-colour-wheel", (el) =>
        el.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 1 })),
      );
      expect(await colourHex()).toBe("#123456");
      await page.mouse.up();
      await page.mouse.down();
      await page.mouse.move(x + 1, y + 1);
      await page.$eval(".air-colour-wheel", (el) => el.releasePointerCapture(1));
      await page.mouse.move(x + 3, y + 3);
      expect(await colourHex()).toBe("#123456");
      await page.mouse.up();
      await page.$eval(".air-colour-wheel", (el) =>
        el.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            pointerId: 9,
            isPrimary: false,
            button: 0,
          }),
        ),
      );
      expect(await colourHex()).toBe("#123456");
      await enterColour("#000000");
      await page.mouse.click(x, y);
      expect(
        await page.$eval(
          '[name="resume-primary-brightness"]',
          (el) => (el as HTMLInputElement).value,
        ),
      ).toBe("100");
      await page.click(".resume-colour-fine summary");
      expect(
        await page.$eval('[name="resume-primary-hue"]', (el) => (el as HTMLInputElement).value),
      ).toBe("0");
      await page.focus(".air-colour-wheel");
      await page.keyboard.down("Shift");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.up("Shift");
      expect(
        await page.$eval('[name="resume-primary-hue"]', (el) => (el as HTMLInputElement).value),
      ).toBe("10");
      await page.keyboard.press("End");
      expect(
        await page.$eval('[name="resume-primary-hue"]', (el) => (el as HTMLInputElement).value),
      ).toBe("359");
      expect(await page.$eval(".air-colour-wheel", (el) => el.getAttribute("role"))).toBe("group");
    });

    it("preserves mobile colour swipe dismissal and cancellation without changing the colour", async () => {
      await openDraft(undefined, { primary: "#123456" }, 390, true);
      await openColour(390);
      const session = await page.createCDPSession();
      const rect = await (await page.$(".resume-colour-drag"))!.boundingBox();
      const x = rect!.x + rect!.width / 2,
        y = rect!.y + rect!.height / 2;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + 80 }],
      });
      await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector(".resume-colour-picker")!).transform === "none",
      );
      expect(await colourHex()).toBe("#123456");
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + 140 }],
      });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForSelector(".resume-colour-picker", { hidden: true });
      expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(
        "More options",
      );
      await openColour(390);
      expect(await colourHex()).toBe("#123456");
    });

    it("leaves the desktop colour popup by Tab and dismisses it on a compact breakpoint", async () => {
      await openDraft();
      await openColour();
      await page.focus(".resume-colour-fine summary");
      await page.keyboard.press("Tab");
      await page.waitForSelector(".resume-colour-picker", { hidden: true });
      expect(await page.evaluate(() => document.activeElement?.textContent)).toBe("A4");
      await openColour();
      await page.setViewport({ width: 390, height: 844 });
      await page.waitForSelector(".resume-colour-picker", { hidden: true });
      await openColour(390);
      await page.keyboard.press("Escape");
      expect(await page.$eval("#app", (el) => (el as HTMLElement).inert)).toBe(false);
    });

    it("cancels New without clearing work and imports a saved document with all settings", async () => {
      await openDraft();
      await page.click('button[aria-label="Start a new blank resume"]');
      await clickText("Cancel", '[role="dialog"]');
      expect((await savedResume()).profile.summary).toBe("Draft for audit");
      await page.evaluate(() => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File(
            [
              JSON.stringify({
                kind: "cloakresume.v1",
                templateId: "classic-sidebar",
                paperSize: "letter",
                primary: "#112233",
                jobDescription: "Imported requirements",
                resume: {
                  profile: { name: "Imported Person", summary: "Imported summary" },
                  quickStats: [{ id: "stat", value: "42", label: "Projects" }],
                },
              }),
            ],
            "import.json",
            { type: "application/json" },
          ),
        );
        const input = document.querySelector<HTMLInputElement>('input[name="resume-file"]')!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForSelector('[role="dialog"]', { visible: true });
      expect((await savedResume()).profile.summary).toBe("Draft for audit");
      await clickText("Replace draft", '[role="dialog"]');
      await page.waitForFunction(
        () =>
          document.querySelector<HTMLInputElement>('input[name="profile-name"]')?.value ===
          "Imported Person",
      );
      const saved = await page.evaluate(() => {
        window.dispatchEvent(new Event("pagehide"));
        return JSON.parse(localStorage.getItem("cloakresume:v1")!);
      });
      expect(saved).toMatchObject({
        templateId: "classic-sidebar",
        paperSize: "letter",
        primary: "#112233",
        jobDescription: "Imported requirements",
        activeSection: "profile",
        resume: { quickStats: [{ id: "stat", value: "42", label: "Projects" }] },
      });
      await page.evaluate(() => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["invalid"], "broken.json", { type: "application/json" }));
        const input = document.querySelector<HTMLInputElement>('input[name="resume-file"]')!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForSelector('[role="alertdialog"]', { visible: true });
      expect((await savedResume()).profile.name).toBe("Imported Person");
    });

    it("downloads a JSON save with the document and selected settings", async () => {
      await openDraft(undefined, {
        templateId: "classic-sidebar",
        paperSize: "letter",
        primary: "#123456",
        jobDescription: "Saved job requirements",
      });
      const downloadPath = mkdtempSync(join(tmpdir(), "cloakresume-save-test-"));
      const client = await browser.target().createCDPSession();
      await client.send("Browser.setDownloadBehavior", {
        behavior: "allowAndName",
        browserContextId: context.id,
        downloadPath,
        eventsEnabled: true,
      });
      try {
        const completed = new Promise<string>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Save download did not complete")),
            10_000,
          );
          client.on("Browser.downloadProgress", (event) => {
            if (event.state === "completed") {
              clearTimeout(timer);
              resolve(event.guid);
            } else if (event.state === "canceled") {
              clearTimeout(timer);
              reject(new Error("Save download canceled"));
            }
          });
        });
        await page.click('button[aria-label="Save resume data as JSON file"]');
        const guid = await completed;
        const saved = JSON.parse(readFileSync(join(downloadPath, guid), "utf8"));
        expect(saved).toMatchObject({
          kind: "cloakresume.v1",
          templateId: "classic-sidebar",
          paperSize: "letter",
          primary: "#123456",
          jobDescription: "Saved job requirements",
          resume: { profile: { summary: "Draft for audit" } },
        });
        expect(Number.isFinite(Date.parse(saved.savedAt))).toBe(true);
      } finally {
        await client.send("Browser.setDownloadBehavior", {
          behavior: "default",
          browserContextId: context.id,
        });
        await client.detach();
        rmSync(downloadPath, { recursive: true, force: true });
      }
    }, 15_000);

    it("returns from mobile preview to the job description editor through ATS keywords", async () => {
      await openDraft();
      await page.setViewport({ width: 390, height: 900 });
      await page.locator('button[aria-label="Show preview"]').click();
      await page.locator('button[aria-label="More options"]').click();
      await clickText("Scan résumé", '[role="dialog"]');
      await page.waitForSelector('[role="tab"][id$="tab-keywords"]', { visible: true });
      await page.setViewport({ width: 320, height: 900 });
      await page.locator('[role="tab"][id$="tab-parse"]').click();
      await page.waitForSelector('[role="tabpanel"][id$="panel-parse"] h3', { visible: true });
      const captionClipped = await page.$eval('[role="tabpanel"][id$="panel-parse"]', (panel) => {
        const bounds = panel.getBoundingClientRect();
        const heading = panel.querySelector("section > div")!;
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const clipped: string[] = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if (
            [...range.getClientRects()].some(
              (rect) => rect.left < bounds.left - 1 || rect.right > bounds.right + 1,
            )
          )
            clipped.push(node.textContent);
        }
        return clipped;
      });
      expect(captionClipped).toEqual([]);
      await page.locator('[role="tab"][id$="tab-keywords"]').click();
      await clickText("Open JD editor →", '[role="dialog"]');
      await page.waitForSelector('textarea[name="target-job-description"]', { visible: true });
      expect(
        await page.$eval('button[aria-label="Show editor"]', (element) =>
          element.getAttribute("aria-pressed"),
        ),
      ).toBe("true");
      await page.type(
        'textarea[name="target-job-description"]',
        "Kubernetes TypeScript leadership",
      );
      expect(
        await page.$eval('textarea[name="target-job-description"]', (element) => ({
          value: (element as HTMLTextAreaElement).value,
          focused: document.activeElement === element,
        })),
      ).toEqual({ value: "Kubernetes TypeScript leadership", focused: true });
      await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
      expect(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("cloakresume:v1")!).jobDescription,
        ),
      ).toBe("Kubernetes TypeScript leadership");
    }, 20_000);

    it("recovers malformed stored settings and nested resume rows", async () => {
      await openDraft(
        {
          profile: { summary: "Recovered", name: null },
          experience: [null, { bullets: 42 }],
          projects: [null, {}],
        },
        { templateId: "constructor", activeSection: "removed-section", primary: "invalid" },
      );
      expect(
        await page.$eval(
          'textarea[aria-label="Professional summary"]',
          (element) => (element as HTMLTextAreaElement).value,
        ),
      ).toBe("Recovered");
      await page.waitForSelector('.resume-root[data-template-ready="true"] .resume-page');
      expect(await page.$eval(".resume-page", (element) => element.textContent)).toContain(
        "Recovered",
      );
    });

    it("flushes the last keystroke when reloading before the autosave delay", async () => {
      await openDraft();
      await page.type('input[name="profile-name"]', " immediate edit");
      const expected = await page.$eval(
        'input[name="profile-name"]',
        (element) => (element as HTMLInputElement).value,
      );
      await resumeEditing();
      expect(
        await page.$eval(
          'input[name="profile-name"]',
          (element) => (element as HTMLInputElement).value,
        ),
      ).toBe(expected);
    });

    it("keeps every character during rapid typing without a render update loop", async () => {
      await openDraft();
      const text =
        "I designed systems that process data and help teams improve their work. ".repeat(5);
      const selector = 'textarea[aria-label="Professional summary"]';
      await page.$eval(selector, (element) => {
        const field = element as HTMLTextAreaElement;
        field.focus();
        field.select();
      });
      await page.keyboard.type(text);
      expect(await page.$eval(selector, (element) => (element as HTMLTextAreaElement).value)).toBe(
        text,
      );
    });

    it("shows a useful error when local storage cannot save the draft", async () => {
      await openDraft();
      await page.evaluate(() => {
        const original = Object.getOwnPropertyDescriptor(Storage.prototype, "setItem")!;
        window.addEventListener(
          "restore-storage",
          () => {
            Object.defineProperty(Storage.prototype, "setItem", original);
          },
          { once: true },
        );
        Storage.prototype.setItem = () => {
          throw new DOMException("Quota full", "QuotaExceededError");
        };
      });
      try {
        await page.type('input[name="profile-name"]', " still editable");
        await page.waitForFunction(() =>
          document.querySelector('[role="alertdialog"]')?.textContent?.includes("Draft not saved"),
        );
        expect(
          await page.$eval('[role="alertdialog"]', (element) => element.textContent),
        ).toContain("download a JSON copy");
      } finally {
        await page.evaluate(() => {
          window.dispatchEvent(new Event("restore-storage"));
          window.dispatchEvent(new Event("pagehide"));
        });
      }
    });

    it("rejects oversized and invalid photo files without changing the existing draft", async () => {
      await openDraft();
      await page.evaluate(() => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File([new Uint8Array(2 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" }),
        );
        const input = document.querySelector<HTMLInputElement>('input[name="profile-photo"]')!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForFunction(() =>
        document.querySelector('[role="alert"]')?.textContent?.includes("exceeds 2 MB"),
      );
      await page.evaluate(() => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["Not an image"], "broken.png", { type: "image/png" }));
        const input = document.querySelector<HTMLInputElement>('input[name="profile-photo"]')!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForFunction(() =>
        document.querySelector('[role="alert"]')?.textContent?.includes("could not be opened"),
      );
      expect(await page.$('.cr-editor-panel img[alt$="portrait"]')).toBeNull();
    });

    it("keeps newer profile edits when a photo finishes loading", async () => {
      await openDraft();
      await page.evaluate(() => {
        const Reader = window.FileReader;
        window.FileReader = class extends Reader {
          override readAsDataURL(file: Blob) {
            window.addEventListener("finish-photo-read", () => super.readAsDataURL(file), {
              once: true,
            });
          }
        };
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const bytes = Uint8Array.from(atob(canvas.toDataURL("image/png").split(",")[1]), (char) =>
          char.charCodeAt(0),
        );
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], "photo.png", { type: "image/png" }));
        const input = document.querySelector<HTMLInputElement>('input[name="profile-photo"]')!;
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.type('input[name="profile-name"]', " Edited during upload");
      const expected = await page.$eval(
        'input[name="profile-name"]',
        (element) => (element as HTMLInputElement).value,
      );
      await page.evaluate(() => window.dispatchEvent(new Event("finish-photo-read")));
      await page.waitForSelector('.cr-editor-panel img[alt$="portrait"]');
      expect(
        await page.$eval(
          'input[name="profile-name"]',
          (element) => (element as HTMLInputElement).value,
        ),
      ).toBe(expected);
      await resumeEditing();
      expect(
        await page.$eval(
          'input[name="profile-name"]',
          (element) => (element as HTMLInputElement).value,
        ),
      ).toBe(expected);
      expect(await page.$('.cr-editor-panel img[alt$="portrait"]')).not.toBeNull();
    });

    it("offers to resume a draft containing only a job description", async () => {
      await openDraft(blankResume, {
        jobDescription: "We need an engineer to build reliable systems.",
      });
      expect(await page.$(".cr-editor-panel")).not.toBeNull();
    });

    async function scanWritingHints() {
      await page.click('button[aria-label="Scan résumé for ATS and writing issues"]');
      await page.waitForSelector(".cr-editor-panel .resume-hint-trigger");
      await page.click('button[aria-label="Close ATS review"]');
      await page.waitForSelector('button[aria-label="Close ATS review"]', { hidden: true });
    }

    const hintText =
      "I designed **teh** reliable system and helped teh team build useful tools. We work on quality software and support our customers every day.";
    for (const [section, fieldId] of [
      ["profile", "profile.summary"],
      ["experience", "experience.0.bullets.0"],
      ["projects", "projects.0.description"],
      ["projects", "projects.0.roles.0"],
      ["awards", "awards.0.detail"],
      ["custom", "custom.0.bullets.0"],
    ]) {
      it(`applies writing hints in ${fieldId} without changing rich text or later occurrences`, async () => {
        await openDraft(
          {
            ...blankResume,
            profile: { ...blankResume.profile, summary: hintText },
            experience: [
              {
                id: "role",
                title: "Engineer",
                company: "Team",
                location: "",
                start: "2020",
                end: "Present",
                bullets: [hintText],
              },
            ],
            projects: [
              {
                id: "project",
                name: "Project",
                description: hintText,
                roles: [hintText],
                stack: [],
              },
            ],
            awards: [{ id: "award", title: "Award", year: "2020", detail: hintText }],
            custom: [{ id: "custom", header: "Volunteering", bullets: [hintText] }],
          },
          { activeSection: section },
        );
        await scanWritingHints();
        const field = `[data-field-id="${fieldId}"]`;
        const trigger = `${field} + .resume-hint-trigger`;
        const before = await savedResume();
        await page.locator(trigger).click();
        await page.waitForSelector(".resume-hint-popover:focus");
        expect(await savedResume()).toEqual(before);
        await page.click('.resume-hint-actions button[aria-label="Replace “teh” with “the”"]');
        await page.waitForSelector(".resume-hint-popover", { hidden: true });
        expect(
          await page.$eval(field, (element) => ({
            value: (element as HTMLInputElement).value,
            focused: element === document.activeElement,
          })),
        ).toEqual({ value: hintText.replace("teh", "the"), focused: true });
        await page.waitForSelector(trigger);
        expect(await page.$(".resume-hint-popover")).toBeNull();
        await resumeEditing();
        expect(await page.$eval(field, (element) => (element as HTMLInputElement).value)).toBe(
          hintText.replace("teh", "the"),
        );
      });
    }

    it("keeps hint keyboard traversal, touch dismissal and disappearing-trigger focus predictable", async () => {
      await openDraft(
        {
          ...blankResume,
          profile: {
            ...blankResume.profile,
            summary: hintText.replace("helped teh", "helped the"),
          },
        },
        {},
        1440,
        true,
      );
      await scanWritingHints();
      const trigger = '[data-field-id="profile.summary"] + .resume-hint-trigger';
      await page.locator(trigger).click();
      await page.waitForSelector(".resume-hint-popover:focus");
      await page.keyboard.press("Tab");
      expect(
        await page.$eval(
          'button[aria-label="Close writing hints"]',
          (element) => element === document.activeElement,
        ),
      ).toBe(true);
      await page.keyboard.down("Shift");
      await page.keyboard.press("Tab");
      await page.keyboard.up("Shift");
      expect(await page.$(".resume-hint-popover")).toBeNull();
      expect(await page.$eval(trigger, (element) => element === document.activeElement)).toBe(true);
      await page.keyboard.press("Enter");
      await page.waitForSelector(".resume-hint-popover:focus");
      await page.keyboard.press("Escape");
      expect(await page.$(".resume-hint-popover")).toBeNull();
      expect(await page.$eval(trigger, (element) => element === document.activeElement)).toBe(true);
      await page.locator(trigger).click();
      await page.waitForSelector(".resume-hint-popover:focus");
      await page.$eval(".resume-hint-popover", (element) =>
        element
          .querySelectorAll<HTMLButtonElement>("button")
          .item(element.querySelectorAll("button").length - 1)
          .focus(),
      );
      await page.keyboard.press("Tab");
      expect(await page.$(".resume-hint-popover")).toBeNull();
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
      await page.locator(trigger).click();
      await page.waitForSelector(".resume-hint-popover:focus");
      await page.$eval('[data-field-id="profile.summary"]', (element) => {
        element.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
        );
        (element as HTMLTextAreaElement).focus();
      });
      expect(await page.$(".resume-hint-popover")).toBeNull();
      await page.locator(trigger).click();
      await page.waitForSelector(".resume-hint-popover:focus");
      expect(
        await page.$$eval(".resume-hint-popover button", (elements) =>
          elements.every((element) => element.getBoundingClientRect().height >= 44),
        ),
      ).toBe(true);
      await page.click('.resume-hint-actions button[aria-label="Replace “teh” with “the”"]');
      await page.waitForSelector(trigger, { hidden: true });
      expect(
        await page.$eval(
          '[data-field-id="profile.summary"]',
          (element) => element === document.activeElement,
        ),
      ).toBe(true);
      expect(await page.$(".resume-hint-popover")).toBeNull();
    });

    it("jumps from a writing review to the named field and leaves Target JD outside the hint scan", async () => {
      await openDraft(
        { ...blankResume, custom: [{ id: "custom", header: "Volunteering", bullets: [hintText] }] },
        { jobDescription: hintText },
      );
      await page.click('button[aria-label="Scan résumé for ATS and writing issues"]');
      await page.waitForSelector('[role="tab"][id$="tab-insights"]');
      await page.click('[role="tab"][id$="tab-insights"]');
      await page.waitForSelector('button[aria-label="Jump to Volunteering · bullet 1"]');
      await page.click('button[aria-label="Jump to Volunteering · bullet 1"]');
      await page.waitForSelector('[data-field-id="custom.0.bullets.0"]:focus');
      await page.locator('[data-field-id="custom.0.bullets.0"] + .resume-hint-trigger').click();
      await page.waitForSelector(".resume-hint-popover:focus");
      await page.click('button[aria-label="Close writing hints"]');
      expect(
        await page.$eval(
          '[data-field-id="custom.0.bullets.0"] + .resume-hint-trigger',
          (element) => element === document.activeElement,
        ),
      ).toBe(true);
      await page.click('.resume-section-link[aria-label="Target JD"]');
      await page.waitForSelector('textarea[name="target-job-description"]');
      expect(await page.$(".cr-editor-panel .resume-hint-trigger")).toBeNull();
      expect(
        await page.$eval(
          'textarea[name="target-job-description"]',
          (element) => (element as HTMLTextAreaElement).value,
        ),
      ).toBe(hintText);
    });

    it("scans edits made while the writing engine is still downloading", async () => {
      await openDraft();
      await page.setRequestInterception(true);
      let held: import("puppeteer-core").HTTPRequest | undefined;
      const intercept = (request: import("puppeteer-core").HTTPRequest) => {
        if (request.url().includes(".wasm")) held = request;
        else void request.continue();
      };
      page.on("request", intercept);
      try {
        await page.click('button[aria-label="Scan résumé for ATS and writing issues"]');
        await page.waitForSelector('button[aria-label="Close ATS review"]');
        await page.click('button[aria-label="Close ATS review"]');
        await page.waitForSelector('button[aria-label="Close ATS review"]', { hidden: true });
        const selector = 'textarea[aria-label="Professional summary"]';
        await page.$eval(selector, (element) => {
          (element as HTMLTextAreaElement).focus();
          (element as HTMLTextAreaElement).select();
        });
        await page.keyboard.type(
          "I designed teh reliable system and helped teh team build useful tools. We work on quality software and support our customers every day.",
        );
        // The handler receives the engine request asynchronously after the review opens.
        for (let attempts = 0; !held && attempts < 500; attempts++)
          await new Promise((resolve) => setTimeout(resolve, 20));
        expect(held).toBeDefined();
        expect(await page.$(".resume-hint-trigger")).toBeNull();
        await held!.continue();
        held = undefined;
        await page.waitForSelector('.cr-editor-panel button[aria-label*="writing hint"]', {
          timeout: 30_000,
        });
        expect(await page.$('[role="dialog"]')).toBeNull();
      } finally {
        if (held) await held.continue();
        page.off("request", intercept);
        await page.setRequestInterception(false);
      }
    }, 40_000);

    it("retries a failed writing-engine download instead of caching the failure", async () => {
      await openDraft({
        ...blankResume,
        profile: {
          ...blankResume.profile,
          summary:
            "I designed systems that process data and help teams improve their work. I also built reliable tools that make complex projects easier to deliver.",
        },
      });
      let failDownload = true;
      await page.setRequestInterception(true);
      const intercept = (request: import("puppeteer-core").HTTPRequest) => {
        void (failDownload && request.url().includes(".wasm")
          ? request.abort()
          : request.continue());
      };
      page.on("request", intercept);
      try {
        await page.click('button[aria-label="Scan résumé for ATS and writing issues"]');
        await page.waitForFunction(() =>
          document
            .querySelector('[role="alert"]')
            ?.textContent?.includes("Writing review could not finish"),
        );
        expect(
          await page.$eval('[role="dialog"] h3', (element) => element.textContent),
        ).not.toContain("on writing");
        expect(await page.$(".resume-hint-trigger")).toBeNull();
        failDownload = false;
        await page.click('button[aria-label="Re-scan"]');
        await page.waitForFunction(
          () => document.querySelector('[role="dialog"] h3')?.textContent?.includes("on writing"),
          { timeout: 30_000 },
        );
      } finally {
        page.off("request", intercept);
        await page.setRequestInterception(false);
      }
    }, 40_000);

    it.each(["classic-sidebar", "monograph", "compact-timeline"])(
      "keeps long education details and project lists inside %s pages",
      async (templateId) => {
        await openDraft(
          {
            ...blankResume,
            profile: {
              ...blankResume.profile,
              summary: "Printable project and education fixture.",
            },
            education: [
              {
                id: "education",
                degree: "Computer Science",
                school: "University",
                location: "",
                start: "2010",
                end: "2014",
                detail:
                  "Teaching assistant for operating systems, networks, and distributed computing. ".repeat(
                    8,
                  ),
              },
            ],
            projects: Array.from({ length: 8 }, (_, index) => ({
              id: `project-${index}`,
              name: `Project ${index}`,
              description:
                "Built tools that help teams deliver reliable systems and improve the quality of their daily work. ".repeat(
                  4,
                ),
              roles: ["Led the design and testing of the project with a team of four engineers."],
              stack: ["TypeScript"],
            })),
          },
          { templateId },
        );
        await page.waitForSelector('.resume-root[data-template-ready="true"] .resume-page');
        const clipped = await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const clipped: string[] = [];
          for (const sheet of document.querySelectorAll(".resume-root .resume-page")) {
            const bounds = sheet.getBoundingClientRect();
            const bottom = bounds.top + (bounds.width * 297) / 210;
            const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (!node.textContent?.trim() || node.parentElement?.closest("style,svg")) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              if (
                [...range.getClientRects()].some(
                  (rect) =>
                    rect.width > 0 &&
                    (rect.bottom > bottom + 2 ||
                      rect.right > bounds.right + 2 ||
                      rect.left < bounds.left - 2),
                )
              )
                clipped.push(node.textContent);
            }
          }
          return clipped;
        });
        expect(clipped).toEqual([]);
        expect(
          await page.$$eval(".resume-root .resume-page", (pages) => pages.length),
        ).toBeGreaterThan(1);
      },
    );
  },
);
