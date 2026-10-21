/** Real local-engine hints in all six field consumers, plus explicit text-layout stress. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const parent = process.env.AIR_EVIDENCE_DIR || tmpdir();
await mkdir(parent, { recursive: true });
const out = await mkdtemp(resolve(parent, "cloakresume-hints-"));
console.log(`Evidence: ${out}`);
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
const writing =
  "I designed teh reliable system and helped the the team build useful tools. We work on quality software and support our customers every day. " +
  "unrecognizedword".repeat(10);
const fixture = {
  ...blankResume,
  profile: { ...blankResume.profile, name: "Writing review", summary: writing },
  experience: [
    {
      id: "role",
      title: "Engineer",
      company: "Team",
      location: "",
      start: "2020",
      end: "Present",
      bullets: [writing],
    },
  ],
  projects: [{ id: "project", name: "Project", description: writing, roles: [writing], stack: [] }],
  awards: [{ id: "award", title: "Award", year: "2020", detail: writing }],
  custom: [{ id: "custom", header: "Volunteering", bullets: [writing] }],
};
const consumers = [
  ["Profile", "profile.summary"],
  ["Experience", "experience.0.bullets.0"],
  ["Projects", "projects.0.description"],
  ["Projects", "projects.0.roles.0"],
  ["Awards", "awards.0.detail"],
  ["Custom", "custom.0.bullets.0"],
];
const evidence = {
  layouts: [],
  contrast: [],
  errors: [],
  screenshots: [],
  note: "Real Harper reports and six production consumers. Long replacement copy is an explicitly injected DOM text stress case; it does not claim an engine-generated suggestion.",
};
const frame = (page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
async function metrics(page) {
  return page.$eval(".resume-hint-popover", (el) => {
    const box = el.getBoundingClientRect(),
      style = getComputedStyle(el),
      coarse = matchMedia("(pointer: coarse)").matches;
    const texts = [],
      walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      if ([...range.getClientRects()].some((r) => r.left < box.left || r.right > box.right))
        texts.push(walker.currentNode.textContent);
    }
    return {
      left: box.left,
      right: box.right,
      top: box.top,
      bottom: box.bottom,
      overflow: el.scrollWidth > el.clientWidth + 1,
      radius: style.borderRadius,
      padding: style.padding,
      focused: el.contains(document.activeElement),
      small: [...el.querySelectorAll("button")].filter(
        (b) => b.getBoundingClientRect().height < (coarse ? 44 : 40),
      ).length,
      clippedText: texts,
      count: el.querySelectorAll("li").length,
      kinds: [...el.querySelectorAll(".resume-hint-kind")].map((k) => k.textContent),
      noReplacement: [...el.querySelectorAll("li")].some((li) => !li.querySelector("button")),
      motion: el.getAnimations().length,
    };
  });
}
function check(m, bounds, label) {
  assert.ok(
    m.left >= bounds.left - 1 &&
      m.right <= bounds.right + 1 &&
      m.top >= bounds.top - 1 &&
      m.bottom <= bounds.bottom + 1,
    JSON.stringify({ label, m, bounds }),
  );
  assert.equal(m.overflow, false, label);
  assert.equal(m.small, 0, label);
  assert.deepEqual(m.clippedText, [], label);
  assert.equal(m.radius, "12px");
  assert.equal(m.padding, "20px");
  assert.ok(m.focused, label);
  assert.equal(m.motion, 0, label);
}
async function openPage(w, h, theme, text, feature) {
  const context = await browser.createBrowserContext(),
    page = await context.newPage();
  await page.setViewport({ width: w, height: h, hasTouch: w <= 1100 || feature === "coarse" });
  await page.setBypassServiceWorker(true);
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: theme },
    { name: "prefers-reduced-motion", value: feature === "motion" ? "no-preference" : "reduce" },
  ]);
  if (feature === "forced")
    await (
      await page.createCDPSession()
    ).send("Emulation.setEmulatedMedia", {
      features: [
        { name: "forced-colors", value: "active" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
  page.on("pageerror", (error) => evidence.errors.push(String(error)));
  await page.evaluateOnNewDocument((f) => {
    Object.defineProperty(navigator, "serviceWorker", { value: undefined });
    localStorage.setItem(
      "cloakresume:v1",
      JSON.stringify({
        resume: f,
        templateId: "ats-plain",
        activeSection: "profile",
        paperSize: "a4",
      }),
    );
  }, fixture);
  await page.goto(process.env.SITE_URL || "http://127.0.0.1:8190/", { waitUntil: "networkidle0" });
  await page.evaluate((t) => (document.documentElement.style.fontSize = `${t}px`), text);
  await page.evaluate(() =>
    [...document.querySelectorAll("button")]
      .find((b) => b.textContent.trim().startsWith("Resume editing"))
      .click(),
  );
  await page.waitForSelector('.resume-root[data-template-ready="true"]');
  await page.evaluate(() => document.fonts.ready);
  await frame(page);
  if (w < 1024) {
    await page.click('button[aria-label="More options"]');
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[role="dialog"] button')].some(
        (b) => b.textContent.trim() === "Scan résumé",
      ),
    );
    await page.evaluate(() =>
      [...document.querySelectorAll('[role="dialog"] button')]
        .find((b) => b.textContent.trim() === "Scan résumé")
        .click(),
    );
  } else await page.click('button[aria-label="Scan résumé for ATS and writing issues"]');
  await page.waitForSelector(".cr-editor-panel .resume-hint-trigger");
  await page.click('button[aria-label="Close ATS review"]');
  await page.waitForSelector('button[aria-label="Close ATS review"]', { hidden: true });
  return { context, page };
}
async function openHint(page, id) {
  const trigger = await page.waitForSelector(`[data-field-id="${id}"] + .resume-hint-trigger`, {
    visible: true,
  });
  await trigger.scrollIntoView();
  await frame(page);
  await trigger.click();
  await page.waitForSelector(".resume-hint-popover:focus");
  await frame(page);
}
try {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        const { context, page } = await openPage(w, h, theme, text);
        let active = "Profile";
        for (const [section, id] of consumers) {
          if (active !== section) {
            if (w < 1024) await page.click(".resume-section-close");
            const nav = await page.waitForFunction(
              (name) =>
                [...document.querySelectorAll(".resume-section-link")].find(
                  (el) =>
                    el.ariaLabel === name ||
                    el.querySelector(".resume-section-copy > span")?.textContent === name,
                ),
              {},
              section,
            );
            await nav.asElement().scrollIntoView();
            await nav.asElement().click();
            await nav.dispose();
            await frame(page);
            active = section;
          }
          await openHint(page, id);
          const label = `${w}-${h}-${theme}-${text}-${id}`,
            bounds = { left: 16, right: w - 16, top: 16, bottom: h - 16 };
          const m = await metrics(page);
          check(m, bounds, label);
          evidence.layouts.push({ w, h, theme, text, state: id, metrics: m });
          if (id === "profile.summary") {
            assert.ok(m.noReplacement, "Real unknown-word finding has no replacement");
            if (w === 1440 && text === 16) {
              const pairs = await page.$eval(".resume-hint-popover", (el) => {
                const rgb = (s) => s.match(/[\d.]+/g).map(Number),
                  lum = (c) =>
                    c
                      .slice(0, 3)
                      .map((x) => x / 255)
                      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
                      .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0),
                  bg = lum(rgb(getComputedStyle(el).backgroundColor));
                return [...el.querySelectorAll("h2,h3,p,.resume-hint-actions button")].map((e) => {
                  const fg = lum(rgb(getComputedStyle(e).color));
                  return {
                    text: e.textContent,
                    ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
                  };
                });
              });
              for (const pair of pairs) assert.ok(pair.ratio >= 4.5, JSON.stringify(pair));
              evidence.contrast.push({ theme, pairs });
            }
            if (
              ([1440, 1280, 768, 390].includes(w) && text === 16) ||
              ([320, 844].includes(w) && text === 32)
            ) {
              const name = `hints-${w}-${theme}-${text}.png`;
              await page.screenshot({ path: resolve(out, name) });
              evidence.screenshots.push(name);
            }
            // Stress the production element styles with a long replacement and explanation.
            await page.$eval(
              ".resume-hint-actions button",
              (el) =>
                (el.textContent =
                  "A replacement with a long explanation and " + "unbroken".repeat(24)),
            );
            await page.$eval(
              ".resume-hint-reason",
              (el) => (el.textContent = "A long optional suggestion. ".repeat(14)),
            );
            await page.evaluate(() => window.dispatchEvent(new Event("resize")));
            await frame(page);
            const stress = await metrics(page);
            check(stress, bounds, label + "-long-copy");
            evidence.layouts.push({
              w,
              h,
              theme,
              text,
              state: "injected-long-replacement",
              metrics: stress,
            });
          }
          const last = await page.$(".resume-hint-popover li:last-child");
          await last.scrollIntoView();
          await frame(page);
          assert.ok(
            await page.$eval(
              ".resume-hint-popover li:last-child",
              (el) =>
                el.getBoundingClientRect().top <
                el.closest(".resume-hint-popover").getBoundingClientRect().bottom,
            ),
          );
          await page.keyboard.press("Escape");
          await page.waitForSelector(".resume-hint-popover", { hidden: true });
        }
        await context.close();
      }
  for (const feature of ["coarse", "forced", "viewport", "motion"]) {
    const { context, page } = await openPage(1440, 900, "light", 16, feature);
    await openHint(page, "profile.summary");
    let bounds = { left: 16, right: 1424, top: 16, bottom: 884 };
    if (feature === "viewport") {
      await page.evaluate(() => {
        for (const [key, value] of Object.entries({
          width: 500,
          height: 310,
          offsetTop: 90,
          offsetLeft: 120,
        }))
          Object.defineProperty(visualViewport, key, { configurable: true, value });
        visualViewport.dispatchEvent(new Event("resize"));
      });
      bounds = { left: 136, right: 604, top: 106, bottom: 384 };
    }
    await frame(page);
    const m = await metrics(page);
    check(m, bounds, feature);
    evidence.layouts.push({ state: feature, metrics: m });
    const name = `hints-${feature}.png`;
    await page.screenshot({ path: resolve(out, name) });
    evidence.screenshots.push(name);
    await context.close();
  }
  assert.deepEqual(evidence.errors, []);
  await writeFile(resolve(out, "results.json"), JSON.stringify(evidence, null, 2));
  console.log(
    `Passed ${evidence.layouts.length} layouts and ${evidence.contrast.flatMap((e) => e.pairs).length} contrast pairs.`,
  );
} finally {
  await browser.close();
}
