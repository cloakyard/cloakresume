/** Shared writing fields and formatting only; widgets/repeated rows have separate gates. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { generateSampleResume } from "../src/data/sampleResume.ts";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-fields";
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
const sections = ["Profile", "Experience", "Projects", "Skills", "Custom", "Target JD"];
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
  await el.scrollIntoView();
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
  await nav.asElement().scrollIntoView();
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
          if (name !== "Profile") await section(page, name, w);
          const data = await page.evaluate(() => {
            const failures = [],
              fields = [...document.querySelectorAll(".cr-editor-panel .resume-writing-field")],
              coarse = matchMedia("(pointer:coarse)").matches;
            const panel = document.querySelector(".resume-section-body").getBoundingClientRect();
            const controls = [
              ...fields,
              ...document.querySelectorAll(".resume-format-toolbar button"),
            ];
            for (const el of controls) {
              const rect = el.getBoundingClientRect(),
                css = getComputedStyle(el),
                label = el.getAttribute("aria-label") || el.getAttribute("name") || el.textContent;
              if (rect.left < panel.left - 1 || rect.right > panel.right + 1 || rect.width < 1)
                failures.push(`containment: ${label}`);
              if (rect.height < (coarse ? 44 : 40) - 0.5) failures.push(`target height: ${label}`);
              if (el.tagName === "BUTTON" && rect.width < 44)
                failures.push(`format target: ${label}`);
              if (el.matches(".resume-writing-field")) {
                if (parseFloat(css.fontSize) < (coarse || innerWidth <= 640 ? 16 : 14))
                  failures.push(`editable type: ${label}`);
                if (!css.fontFamily.includes("-apple-system") || css.textTransform !== "none")
                  failures.push(`font: ${label}`);
                if (
                  css.borderRadius !== "10px" ||
                  css.borderWidth !== "1px" ||
                  css.boxShadow !== "none"
                )
                  failures.push(`field contour: ${label}`);
                if (
                  el.matches('textarea[data-auto-grow="true"]') &&
                  el.scrollHeight > el.clientHeight + 2
                )
                  failures.push(`autogrow: ${label} ${el.scrollHeight}/${el.clientHeight}`);
              }
            }
            const visibleLabels = [...document.querySelectorAll(".cr-editor-panel .air-label")];
            for (const label of visibleLabels) {
              const css = getComputedStyle(label);
              if (css.textTransform !== "none" || parseFloat(css.fontSize) < 13)
                failures.push(`label: ${label.textContent}`);
            }
            if (document.documentElement.scrollWidth > innerWidth) failures.push("page overflow");
            return {
              failures,
              fields: fields.length,
              formatting: controls.length - fields.length,
              coarse,
            };
          });
          assert.deepEqual(data.failures, [], JSON.stringify({ w, h, theme, text, name, ...data }));
          assert.ok(data.fields > 0, `${name} has shared writing fields`);
          layouts.push({ w, h, theme, text, section: name, ...data });
          if (
            name === "Profile" &&
            text === 16 &&
            ((w === 1440 && theme === "light") ||
              (w === 1280 && theme === "dark") ||
              (w === 768 && theme === "light") ||
              (w === 390 && theme === "dark") ||
              (w === 844 && theme === "dark"))
          )
            await page.screenshot({ path: `${out}/writing-${w}-${theme}.png` });
          if (w === 320 && theme === "light" && text === 32 && name === "Profile")
            await page.screenshot({ path: `${out}/writing-320-light-32.png` });
        }
        await context.close();
        console.log(`PASS ${w}×${h} ${theme} ${text}px: ${sections.length} writing sections`);
      }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/layouts.json`, JSON.stringify({ layouts, errors }, null, 2));
  console.log(`PASS ${layouts.length} writing layouts; no page errors`);
} finally {
  await browser.close();
}
