/** Production editor shell/section/preview acceptance; document-output suites remain separate. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { generateSampleResume } from "../src/data/sampleResume.ts";
const url = process.env.SITE_URL || "http://127.0.0.1:8145/";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-shell";
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const layouts = [],
  journeys = [],
  errors = [];
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [1023, 768],
  [864, 900],
  [863, 900],
  [820, 1180],
  [768, 1024],
  [640, 800],
  [639, 800],
  [430, 932],
  [390, 844],
  [375, 667],
  [360, 800],
  [320, 568],
  [844, 390],
  [667, 375],
];
const sections = [
  "Profile",
  "Contact",
  "Experience",
  "Skills",
  "Projects",
  "Education",
  "Certifications",
  "Awards",
  "Languages",
  "Interests & Tools",
  "Quick stats",
  "Custom",
  "Target JD",
];
const fixture = {
  resume: generateSampleResume(),
  templateId: "classic-sidebar",
  primary: "#047857",
  paperSize: "a4",
  jobDescription: "Local engineering role",
  activeSection: "profile",
};
let page, context;
async function frame() {
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}
async function open(w, h, theme, text = 16) {
  await context?.close();
  context = await browser.createBrowserContext();
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
  await page.evaluate((t) => (document.documentElement.style.fontSize = t + "px"), text);
  await clickText("Resume editing");
  await page.waitForSelector('.resume-root[data-template-ready="true"]');
  await page.evaluate(() => document.fonts.ready);
  await frame();
}
async function clickText(text, scope = "") {
  const h = await page.waitForFunction(
    (text, scope) =>
      [...document.querySelectorAll(`${scope} button`)].find((e) => e.textContent.trim() === text),
    {},
    text,
    scope,
  );
  await h.asElement().scrollIntoView();
  await frame();
  await h.asElement().click();
  await h.dispose();
  await frame();
}
async function press(selector) {
  const h = await page.waitForSelector(selector, { visible: true });
  await h.scrollIntoView();
  await frame();
  await h.click();
  await h.dispose();
  await frame();
}
async function measure(state, w, h, theme, text) {
  const data = await page.evaluate(() => {
    const rect = (e) => e.getBoundingClientRect(),
      visible = (e) => rect(e).width && rect(e).height;
    const selectors =
      ".resume-editor-header button, .resume-editor-brand, .resume-preview-tools button, .resume-section-close, .resume-section-link";
    const controls = [...document.querySelectorAll(selectors)].filter(visible);
    const compact = matchMedia("(max-width:1023px)").matches,
      coarse = matchMedia("(pointer:coarse)").matches;
    const failures = [];
    for (const e of controls) {
      const r = rect(e),
        name = e.ariaLabel || e.textContent.trim();
      const inRail = e.closest(".resume-section-nav--rail"),
        inPanel = e.closest(".resume-editor-panel");
      if (r.width < (coarse ? 44 : 32) - 0.5 || r.height < (coarse ? 44 : 32) - 0.5)
        failures.push(`target ${name} ${r.width}×${r.height}`);
      if (
        !inRail &&
        !inPanel &&
        (r.left < -0.5 ||
          r.right > innerWidth + 0.5 ||
          r.top < -0.5 ||
          r.bottom > innerHeight + 0.5)
      )
        failures.push(`outside ${name}`);
      if (e.scrollWidth > e.clientWidth + 1) failures.push(`text overflow ${name}`);
    }
    for (const selector of [
      ".resume-editor-header",
      ".resume-editor-panel",
      ".resume-editor-preview",
      ".resume-preview-tools",
    ]) {
      const e = document.querySelector(selector);
      if (!e) continue;
      const r = rect(e);
      if (
        r.width < 1 ||
        r.height < 1 ||
        r.left < -0.5 ||
        r.right > innerWidth + 0.5 ||
        r.top < -0.5 ||
        r.bottom > innerHeight + 0.5
      )
        failures.push(`region ${selector}: ${JSON.stringify(r.toJSON())}`);
    }
    if (document.documentElement.scrollWidth > innerWidth) failures.push("page overflow");
    if (document.querySelector('[aria-label="Rotate your device"]'))
      failures.push("rotation blocker");
    const paper = document.querySelector(".resume-page");
    return {
      failures,
      compact,
      coarse,
      controls: controls.length,
      paper: {
        width: paper.offsetWidth,
        height: paper.offsetHeight,
        color: getComputedStyle(paper).backgroundColor,
      },
    };
  });
  assert.deepEqual(data.failures, [], `${state} ${w}×${h} ${theme} text ${text}`);
  layouts.push({ state, width: w, height: h, theme, text, ...data });
}
try {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        await open(w, h, theme, text);
        await measure("editor", w, h, theme, text);
        if (text === 16 && [1440, 1280, 768, 390, 844].includes(w))
          await page.screenshot({ path: `${out}/shell-${w}-${theme}.png` });
        if (w < 1024) {
          await press(".resume-section-close");
          await measure("section-picker", w, h, theme, text);
          assert.equal(
            await page.evaluate(() => document.activeElement?.getAttribute("aria-current")),
            "page",
          );
          await clickText(
            "ContactEmail, phone, location, social links",
            ".resume-section-nav--picker",
          );
          assert.equal(await page.evaluate(() => document.activeElement?.id), "editor-content");
          await press('[aria-label="Show preview"]');
          await measure("expanded-preview", w, h, theme, text);
          await page.focus(".resume-editor-skip");
          await page.keyboard.press("Enter");
          await frame();
          assert.equal(await page.evaluate(() => document.activeElement?.id), "editor-content");
        }
      }
  for (const w of [1440, 1024, 820, 390, 844])
    for (const theme of ["light", "dark"]) {
      const h = w === 844 ? 390 : 900;
      await open(w, h, theme);
      const before = await page.evaluate(
        () => JSON.parse(localStorage.getItem("cloakresume:v1")).resume,
      );
      for (const label of sections) {
        if (w < 1024) {
          await press(".resume-section-close");
          const handle = await page.waitForFunction(
            (label) =>
              [...document.querySelectorAll(".resume-section-link")].find(
                (e) => e.querySelector(".resume-section-copy > span")?.textContent === label,
              ),
            {},
            label,
          );
          await handle.asElement().scrollIntoView();
          await frame();
          await handle.asElement().click();
          await handle.dispose();
        } else await press(`.resume-section-link[aria-label="${label}"]`);
        await page.waitForFunction(
          (label) => document.querySelector(".resume-section-title")?.textContent.startsWith(label),
          {},
          label,
        );
        await measure("section:" + label, w, h, theme, 16);
      }
      assert.deepEqual(
        await page.evaluate(() => JSON.parse(localStorage.getItem("cloakresume:v1")).resume),
        before,
      );
      const zoom = () => page.$eval(".resume-zoom-value", (e) => parseInt(e.textContent));
      await press('[aria-label="Fit preview"]');
      const fit = await zoom();
      await press('[aria-label="Zoom in"]');
      assert.equal(await zoom(), Math.min(150, fit + 10));
      await press('[aria-label="Zoom out"]');
      assert.equal(await zoom(), fit);
      await press(".resume-zoom-value");
      assert.equal(await zoom(), 100);
      await press('[aria-label="Fit preview"]');
      assert.equal(await zoom(), fit);
      await page.$eval(".cr-preview-scroll", (e) => (e.scrollTop = e.scrollHeight));
      await measure("scrolled-preview", w, h, theme, 16);
      if (w >= 1024) {
        await clickText("Letter", "[data-paper-size-control]");
        await page.waitForFunction(
          () => document.querySelector(".resume-root")?.style.width === "215.9mm",
        );
        await clickText("A4", "[data-paper-size-control]");
      } else {
        await press('[aria-label="More options"]');
        await page.waitForSelector('[role="dialog"]', { visible: true });
        await clickText("Letter", "[data-paper-size-control]");
        await page.keyboard.press("Escape");
        await frame();
        await page.waitForFunction(
          () => document.querySelector(".resume-root")?.style.width === "215.9mm",
        );
      }
      journeys.push({
        width: w,
        theme,
        sections: 13,
        contentPreserved: true,
        zoom: true,
        paperSize: true,
        previewDockReachable: true,
      });
    }
  assert.deepEqual(errors, []);
  console.log(`PASS ${layouts.length} layouts, ${journeys.length} section/zoom/paper journeys`);
} finally {
  await writeFile(
    `${out}/shell.json`,
    JSON.stringify({ browser: await browser.version(), layouts, journeys, errors }, null, 2),
  );
  await browser.close();
}
