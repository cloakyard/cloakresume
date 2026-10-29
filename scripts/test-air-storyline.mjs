/** Built landing artwork: geometry, finite arrival, lifecycle and static profiles. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
const url = process.env.SITE_URL || "http://127.0.0.1:8184/";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/resume-storyline-2026-10-26";
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const evidence = { layouts: [], arrivals: [], lifecycle: [], errors: [] };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function state(page, expected) {
  await page.waitForFunction(
    (value) => document.querySelector(".resume-story")?.dataset.artState === value,
    {},
    expected,
  );
}
try {
  const p = await browser.newPage();
  p.on("pageerror", (e) => evidence.errors.push(String(e)));
  await p.evaluateOnNewDocument(() =>
    Object.defineProperty(navigator, "serviceWorker", { value: undefined }),
  );
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await p.goto(url, { waitUntil: "networkidle0" });
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [390, 844],
    [430, 932],
    [639, 800],
    [640, 800],
    [641, 800],
    [768, 1024],
    [959, 768],
    [960, 768],
    [961, 768],
    [1024, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [844, 390],
  ]) {
    await p.setViewport({ width, height, hasTouch: width <= 1024 });
    for (const theme of ["light", "dark"]) {
      await p.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      for (const text of [16, 32]) {
        const result = await p.evaluate(async (size) => {
          document.documentElement.style.fontSize = `${size}px`;
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const root = document.querySelector(".resume-story"),
            stage = root.querySelector(".resume-story-stage"),
            paper = root.querySelector(".resume-story-paper").getBoundingClientRect();
          const content = [
            ...root.querySelectorAll(".resume-story-name,.resume-story-chapter"),
          ].map((n) => n.getBoundingClientRect());
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            contained: content.every(
              (r) =>
                r.left >= paper.left &&
                r.right <= paper.right + 1 &&
                r.top >= paper.top &&
                r.bottom <= paper.bottom + 1,
            ),
            overlap: content.some((a, i) =>
              content.some((b, j) => i !== j && a.top < b.bottom && a.bottom > b.top),
            ),
            state: root.dataset.artState,
            running: root.getAnimations({ subtree: true }).length,
            decorative: stage.getAttribute("aria-hidden"),
            ink: getComputedStyle(root.querySelector(".resume-story-name")).color,
            replayHidden: root.querySelector(".air-artwork-replay").hidden,
            input: !document.querySelector("input[name=resume-file]").disabled,
          };
        }, text);
        assert.deepEqual(
          result,
          {
            overflow: false,
            contained: true,
            overlap: false,
            state: "reduced",
            running: 0,
            decorative: "true",
            ink: "rgb(32, 35, 41)",
            replayHidden: true,
            input: true,
          },
          JSON.stringify({ width, height, theme, text, result }),
        );
        evidence.layouts.push({ width, height, theme, text, ...result });
        if (text === 16 && [390, 1280, 1440].includes(width))
          await p.screenshot({ path: `${out}/home-${width}-${theme}.png`, fullPage: true });
      }
    }
  }
  await p.close();
  for (const mode of ["normal", "unsupported", "constrained", "save-data", "forced"]) {
    const ctx = await browser.createBrowserContext(),
      page = await ctx.newPage();
    page.on("pageerror", (e) => evidence.errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument((mode) => {
      Object.defineProperty(navigator, "serviceWorker", { value: undefined });
      Object.defineProperty(navigator, "hardwareConcurrency", { value: 8 });
      Object.defineProperty(navigator, "deviceMemory", { value: mode === "constrained" ? 4 : 8 });
      if (mode === "save-data")
        Object.defineProperty(navigator, "connection", { value: { saveData: true } });
      if (mode === "unsupported") Element.prototype.animate = undefined;
    }, mode);
    if (mode === "forced")
      await page.emulateMediaFeatures([{ name: "forced-colors", value: "active" }]);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".resume-story");
    if (mode === "normal") {
      await state(page, "playing");
      await page.screenshot({ path: `${out}/story-arrival.png` });
      assert.equal(
        await page.$$eval(
          ".resume-story button",
          (buttons) => buttons.length === 1 && buttons[0].className === "air-artwork-replay",
        ),
        true,
      );
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide")));
      await state(page, "hidden");
      await page.$eval(".resume-story", (e) =>
        Promise.all(e.getAnimations({ subtree: true }).map((a) => a.ready)),
      );
      const times = () =>
        page.$eval(".resume-story", (e) =>
          e.getAnimations({ subtree: true }).map((a) => a.currentTime),
        );
      const before = await times();
      await pause(180);
      assert.deepEqual(await times(), before);
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow")));
      await state(page, "playing");
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await state(page, "offscreen");
      await page.evaluate(() => scrollTo(0, 0));
      await state(page, "complete");
      assert.equal(
        await page.$eval(".resume-story", (e) => e.getAnimations({ subtree: true }).length),
        0,
      );
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide")));
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow")));
      await state(page, "complete");
      await page.reload({ waitUntil: "domcontentloaded" });
      await state(page, "playing");
      await page.setViewport({ width: 390, height: 844 });
      await state(page, "complete");
      await page.reload({ waitUntil: "domcontentloaded" });
      await state(page, "playing");
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await state(page, "reduced");
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
      await state(page, "complete");
      await page.reload({ waitUntil: "domcontentloaded" });
      await state(page, "playing");
      await page.evaluate(() => {
        window.storyEffects = document
          .querySelector(".resume-story")
          .getAnimations({ subtree: true });
        [...document.querySelectorAll("button")]
          .find((n) => n.textContent.trim() === "Start blank")
          .click();
      });
      await page.waitForFunction(() => !document.querySelector(".resume-story"));
      assert.equal(
        await page.evaluate(() => window.storyEffects.every((a) => a.playState === "idle")),
        true,
      );
      evidence.lifecycle.push(
        "artwork replay target; hidden time frozen; offscreen; finite completion without restart; resize settle; live reduced motion; editor cleanup",
      );
    } else {
      await state(page, mode);
      assert.equal(
        await page.$eval(
          ".resume-story",
          (e) =>
            e.getAnimations({ subtree: true }).length === 0 &&
            e.querySelector(".air-artwork-replay").hidden,
        ),
        true,
      );
      evidence.lifecycle.push(`${mode}: static`);
    }
    await ctx.close();
  }
  // Inspect the actual animated arrival too, including enlarged text. Captions
  // must stay clear of each other and of the moving path at its initial pose.
  for (const width of [320, 390, 768, 1440])
    for (const text of [16, 32]) {
      const ctx = await browser.createBrowserContext(),
        page = await ctx.newPage();
      await page.setViewport({ width, height: 1000 });
      await page.evaluateOnNewDocument((size) => {
        Object.defineProperty(navigator, "serviceWorker", { value: undefined });
        Object.defineProperty(navigator, "hardwareConcurrency", { value: 8 });
        Object.defineProperty(navigator, "deviceMemory", { value: 8 });
        addEventListener(
          "DOMContentLoaded",
          () => (document.documentElement.style.fontSize = `${size}px`),
        );
      }, text);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".resume-story");
      await page.$eval(".resume-story", (e) => e.scrollIntoView({ block: "center" }));
      const result = await page.evaluate(async () => {
        const root = document.querySelector(".resume-story");
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        root.getAnimations({ subtree: true }).forEach((a) => {
          a.pause();
          a.currentTime = 0;
        });
        await new Promise(requestAnimationFrame);
        const labels = [...root.querySelectorAll(".resume-story-label")].map((n) =>
          n.getBoundingClientRect(),
        );
        const lines = [...root.querySelectorAll(".resume-story-line")].map((n) =>
          n.getBoundingClientRect(),
        );
        const intersects = (a, b) =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return {
          effects: root.getAnimations({ subtree: true }).length,
          inBounds: labels.every((r) => r.left >= 0 && r.right <= innerWidth),
          overlaps: labels.some((r, i) => labels.some((s, j) => i !== j && intersects(r, s))),
          crosses: labels.some((r) => lines.some((s) => intersects(r, s))),
        };
      });
      assert.ok(result.effects > 0, "Inspect moving artwork, not its fallback");
      assert.ok(
        result.inBounds && !result.overlaps && !result.crosses,
        JSON.stringify({ width, text, result }),
      );
      evidence.arrivals.push({ width, text, ...result });
      if (text === 16) await page.screenshot({ path: `${out}/arrival-${width}.png` });
      await ctx.close();
    }
  assert.deepEqual(evidence.errors, []);
} finally {
  await browser.close();
  await writeFile(`${out}/checks.json`, JSON.stringify(evidence, null, 2) + "\n");
}
console.log(
  `PASS ${evidence.layouts.length} layouts; storyline lifecycle and four static profiles. Evidence: ${out}`,
);
