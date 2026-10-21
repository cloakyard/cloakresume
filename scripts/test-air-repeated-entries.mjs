/** Repeated-entry control geometry and confirmation; field widgets are separate gates. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { generateSampleResume } from "../src/data/sampleResume.ts";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-entries";
const url = process.env.SITE_URL || "http://127.0.0.1:8145/";
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1279, 720],
  [1024, 768],
  [1023, 768],
  [768, 1024],
  [767, 1024],
  [640, 800],
  [639, 800],
  [430, 932],
  [390, 844],
  [375, 812],
  [320, 568],
  [844, 390],
];
const sections = [
  "Contact",
  "Experience",
  "Skills",
  "Projects",
  "Education",
  "Certifications",
  "Awards",
  "Languages",
  "Quick stats",
  "Custom",
];
const fixture = {
  resume: generateSampleResume(),
  templateId: "classic-sidebar",
  primary: "#047857",
  paperSize: "a4",
  activeSection: "profile",
  jobDescription: "Engineering role. Build and maintain reliable systems.",
};
const layouts = [],
  errors = [];
const frame = (page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
async function press(page, selector) {
  const el = await page.waitForSelector(selector, { visible: true });
  await el.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
  await frame(page);
  await el.click();
  await el.dispose();
  await frame(page);
}
async function section(page, name, w) {
  if (w < 1024) await press(page, ".resume-section-close");
  const nav = await page.waitForFunction(
    (name) =>
      [...document.querySelectorAll(".resume-section-link")].find(
        (e) =>
          e.ariaLabel === name ||
          e.querySelector(".resume-section-copy > span")?.textContent === name ||
          e.textContent.trim().startsWith(name),
      ),
    {},
    name,
  );
  await nav.asElement().evaluate((el) => el.scrollIntoView({ block: "nearest" }));
  await nav.asElement().click();
  await nav.dispose();
  await frame(page);
}
try {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        const context = await browser.createBrowserContext(),
          page = await context.newPage();
        await page.setViewport({ width: w, height: h, hasTouch: w <= 1100 });
        await page.setBypassServiceWorker(true);
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        page.on("pageerror", (e) => errors.push(String(e)));
        await page.evaluateOnNewDocument((f) => {
          Object.defineProperty(navigator, "serviceWorker", { value: undefined });
          localStorage.setItem("cloakresume:v1", JSON.stringify(f));
        }, fixture);
        await page.goto(url, { waitUntil: "networkidle0" });
        await page.evaluate((t) => (document.documentElement.style.fontSize = `${t}px`), text);
        await page.evaluate(() =>
          [...document.querySelectorAll("button")]
            .find((e) => e.textContent.trim().startsWith("Resume editing"))
            .click(),
        );
        await page.waitForSelector('.resume-root[data-template-ready="true"]');
        await page.evaluate(() => document.fonts.ready);
        await frame(page);
        for (const name of sections) {
          await section(page, name, w);
          const data = await page.evaluate(() => {
            const failures = [],
              controls = [
                ...document.querySelectorAll(
                  ".cr-drag-item .air-icon-button, .resume-add-action, .resume-add-bullet",
                ),
              ].filter((el) => el.getClientRects().length),
              coarse = matchMedia("(pointer:coarse)").matches;
            const panel = document.querySelector(".resume-section-body").getBoundingClientRect();
            for (const el of controls) {
              const box = el.getBoundingClientRect(),
                css = getComputedStyle(el),
                name = el.ariaLabel || el.textContent.trim();
              if (box.width < (coarse ? 44 : 40) || box.height < (coarse ? 44 : 40))
                failures.push(`target ${name}: ${box.width}×${box.height}`);
              if (
                box.left < panel.left - 1 ||
                box.right > panel.right + 1 ||
                el.scrollWidth > el.clientWidth + 1
              )
                failures.push(`containment ${name}`);
              if (
                !css.fontFamily.includes("-apple-system") ||
                parseFloat(css.fontSize) < 14 ||
                css.textTransform !== "none"
              )
                failures.push(`type ${name}`);
            }
            for (const field of document.querySelectorAll(".resume-bullet-entry textarea")) {
              const row = field.closest(".resume-bullet-entry").getBoundingClientRect(),
                box = field.getBoundingClientRect();
              if (Math.abs(row.width - box.width) > 1) failures.push("bullet width squeezed");
              if (field.scrollHeight > field.clientHeight + 2)
                failures.push("bullet auto-grow clips");
            }
            for (const h of document.querySelectorAll(".resume-entry-heading"))
              if (h.scrollWidth > h.clientWidth + 1) failures.push("heading overflow");
            if (document.documentElement.scrollWidth > innerWidth) failures.push("page overflow");
            const parent = document.querySelector(".cr-editor-panel");
            if (parent.scrollHeight > parent.clientHeight || parent.scrollTop !== 0)
              failures.push("announcement escapes the writing scroll container");
            return {
              failures,
              controls: controls.length,
              bullets: document.querySelectorAll(".resume-bullet-entry").length,
              coarse,
            };
          });
          assert.deepEqual(data.failures, [], JSON.stringify({ w, h, theme, text, name, ...data }));
          assert.ok(data.controls > 0);
          layouts.push({ w, h, theme, text, section: name, ...data });
          if (
            name === "Experience" &&
            text === 16 &&
            ((w === 1440 && theme === "light") ||
              (w === 1280 && theme === "dark") ||
              (w === 768 && theme === "light") ||
              (w === 390 && theme === "dark") ||
              (w === 844 && theme === "dark"))
          ) {
            await page.$eval(".resume-bullet-entry", (el) => {
              const panel = el.closest(".resume-section");
              panel.scrollTop +=
                el.getBoundingClientRect().top - panel.getBoundingClientRect().top - 24;
            });
            await frame(page);
            assert.equal(
              await page.evaluate(
                () => document.querySelector(".resume-editor-header").getBoundingClientRect().top,
              ),
              0,
            );
            await page.screenshot({ path: `${out}/entries-${w}-${theme}.png` });
          }
          if (w === 320 && theme === "light" && text === 32 && name === "Custom") {
            await page.$eval(".resume-bullet-entry", (el) => {
              const panel = el.closest(".resume-section");
              panel.scrollTop +=
                el.getBoundingClientRect().top - panel.getBoundingClientRect().top - 24;
            });
            await frame(page);
            await page.screenshot({ path: `${out}/entries-320-light-32.png` });
          }
          const remove = await page.$('.cr-editor-panel button[aria-label^="Remove "]');
          await remove.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
          await remove.click();
          await frame(page);
          const confirm = await page.$eval(".resume-remove-confirm", (el) => {
            const b = el.getBoundingClientRect(),
              p = el.closest(".resume-section-body").getBoundingClientRect();
            const action = document.querySelector('button[aria-label^="Confirm removal of "]');
            const a = action.getBoundingClientRect();
            return {
              action:
                a.left >= p.left - 1 &&
                a.right <= p.right + 1 &&
                action.scrollWidth <= action.clientWidth + 1,
              left: b.left >= p.left - 1,
              right: b.right <= p.right + 1,
              wrap: el.scrollWidth <= el.clientWidth + 1,
            };
          });
          assert.ok(
            confirm.action && confirm.left && confirm.right && confirm.wrap,
            JSON.stringify({ w, h, theme, text, name, confirm }),
          );
          await page.keyboard.press("Escape");
          await frame(page);
          assert.equal(await page.$(".resume-remove-confirm"), null);
        }
        assert.deepEqual(
          await page.evaluate(() => JSON.parse(localStorage.getItem("cloakresume:v1")).resume),
          fixture.resume,
        );
        await context.close();
        console.log(
          `PASS ${w}×${h} ${theme} ${text}px: ${sections.length} entry/confirmation states`,
        );
      }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/layouts.json`, JSON.stringify({ layouts, errors }, null, 2));
  console.log(`PASS ${layouts.length} entry layouts and removal cancellations; no page errors`);
} finally {
  await browser.close();
}
