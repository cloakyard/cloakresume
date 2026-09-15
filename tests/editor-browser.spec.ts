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
      await page.waitForSelector(".cr-editor-panel textarea", { visible: true });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
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
    ) {
      await page.setViewport({ width, height: 1000 });
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
      async (label, key, initialAdd, nextAdd, field, first, second, prefix) => {
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
        await page.click('.cr-editor-panel button[aria-label="Move down"]');
        expect((await savedResume())[key].map((row: Record<string, string>) => row[field])).toEqual(
          [second, first],
        );
        const remove = prefix ? `Delete ${prefix} 1` : "Remove";
        const confirm = prefix ? `Confirm deletion of ${prefix} 1` : "Confirm removal";
        await page.click(`.cr-editor-panel button[aria-label="${remove}"]`);
        expect((await savedResume())[key]).toHaveLength(2);
        await page.click(`.cr-editor-panel button[aria-label="${confirm}"]`);
        expect((await savedResume())[key].map((row: Record<string, string>) => row[field])).toEqual(
          [first],
        );
      },
    );

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

    it("keeps a newly focused editor field focused when a dialog finishes closing", async () => {
      await openDraft();
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
      const selector = 'input[name="profile-name"]';
      const original = await page.$eval(selector, (element) => (element as HTMLInputElement).value);
      await page.locator('button[aria-label="Start a new blank resume"]').click();
      await page.waitForSelector('[role="dialog"]', { visible: true });
      await clickText("Cancel", '[role="dialog"]');
      await page.waitForSelector('.cr-overlay[data-state="closing"]');
      await page.click(selector);
      await page.keyboard.press("End");
      const addition = " — typing during the closing animation keeps every character";
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

    it("keeps contact reorder and remove controls inside the card at 320px", async () => {
      await openDraft({
        ...blankResume,
        profile: { ...blankResume.profile, summary: "Contact layout" },
        contact: [{ id: "a", kind: "linkedin", value: "linkedin.com/in/example" }],
      });
      await page.click('nav button[aria-label="Contact"]');
      await page.setViewport({ width: 320, height: 900 });
      await page.waitForSelector('.cr-editor-panel button[aria-label="Remove"]', { visible: true });
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
      await page.click('.cr-editor-panel button[aria-label="Remove"]');
      await page.click('.cr-editor-panel button[aria-label="Confirm removal"]');
      expect((await savedResume()).contact).toEqual([]);
    });

    it.each([
      [1920, "light"],
      [320, "light"],
      [1920, "dark"],
      [320, "dark"],
    ] as const)(
      "keeps a complete, consistent contact focus ring at %ipx in %s mode",
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
        const expectedRing = await page.$eval('input[name="profile-name"]', (element) => {
          const style = getComputedStyle(element);
          return { outline: style.outline, offset: style.outlineOffset, shadow: style.boxShadow };
        });
        await page.click('nav button[aria-label="Contact"]');
        await page.setViewport({ width, height: 1000 });
        for (const selector of [
          'select[aria-label="Contact kind"]',
          'input[aria-label="email contact value"]',
          '.cr-editor-panel button[aria-label="Remove"]',
        ]) {
          await page.keyboard.press("Tab");
          await page.$eval(selector, (element) => {
            element.scrollIntoView({ block: "center" });
            (element as HTMLElement).focus({ preventScroll: true });
          });
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
              ring: {
                outline: style.outline,
                offset: style.outlineOffset,
                shadow: style.boxShadow,
              },
              clipped,
            };
          });
          expect(result.ring).toEqual(expectedRing);
          expect(result.clipped).toEqual([]);
        }
        const input = 'input[aria-label="email contact value"]';
        await page.$eval(input, (element) => (element as HTMLInputElement).select());
        await page.type(input, "invalid");
        expect(await page.$eval(input, (element) => element.getAttribute("aria-invalid"))).toBe(
          "true",
        );
        await page.waitForFunction(
          (selector) => {
            const element = document.querySelector(selector)!;
            const token = document.createElement("span");
            token.style.color = "var(--danger)";
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
        async function checkEdges(selector: string) {
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
            expect(space.extent).toBe(4);
            for (const gap of space.gaps)
              expect(gap, JSON.stringify({ selector, index, space })).toBeGreaterThanOrEqual(
                space.extent - 0.5,
              );
          }
        }
        await checkEdges('[aria-label="Choose a logo icon"] .cr-scroll button');
        await page.keyboard.press("Escape");
        await page.setViewport({ width: 1920, height: 1000 });
        await page.click('nav button[aria-label="Education"]');
        await page.setViewport({ width, height: 1000 });
        await page.locator('.cr-editor-panel button[aria-haspopup="dialog"]').click();
        await page.locator('button[aria-label="Select year"]').click();
        await checkEdges('[role="dialog"] .cr-scroll button');
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
