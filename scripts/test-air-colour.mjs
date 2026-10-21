/** Production primary-colour layouts; feature and output coverage is in the browser suite. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const parent = process.env.AIR_EVIDENCE_DIR || tmpdir();
await mkdir(parent, { recursive: true });
const out = await mkdtemp(resolve(parent, "cloakresume-colour-"));
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
  [1280, 800],
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
const evidence = { layouts: [], contrast: [], errors: [], screenshots: [] };
const frame = (p) =>
  p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
try {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        const context = await browser.createBrowserContext(),
          p = await context.newPage();
        await p.setViewport({ width: w, height: h, hasTouch: w <= 1100 });
        await p.setBypassServiceWorker(true);
        await p.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        p.on("pageerror", (e) => evidence.errors.push(String(e)));
        await p.evaluateOnNewDocument(
          (fixture) => {
            Object.defineProperty(navigator, "serviceWorker", { value: undefined });
            localStorage.setItem(
              "cloakresume:v1",
              JSON.stringify({
                resume: fixture,
                templateId: "classic-sidebar",
                activeSection: "profile",
                primary: "#123456",
                paperSize: "a4",
              }),
            );
          },
          {
            ...blankResume,
            profile: {
              ...blankResume.profile,
              name: "Air Colour Review",
              summary: "Synthetic primary-colour fixture.",
            },
          },
        );
        await p.goto(process.env.SITE_URL || "http://127.0.0.1:8188/", {
          waitUntil: "networkidle0",
        });
        await p.evaluate((t) => (document.documentElement.style.fontSize = `${t}px`), text);
        await p.evaluate(() =>
          [...document.querySelectorAll("button")]
            .find((e) => e.textContent.trim().startsWith("Resume editing"))
            .click(),
        );
        await p.waitForSelector('.resume-root[data-template-ready="true"]');
        await p.evaluate(() => document.fonts.ready);
        await frame(p);
        const open = async () => {
          if (w < 1024) {
            await p.click('button[aria-label="More options"]');
            await p.waitForFunction(() =>
              [...document.querySelectorAll('[role="dialog"] button')].some(
                (e) => e.textContent.trim() === "Primary colour",
              ),
            );
            await p.evaluate(() =>
              [...document.querySelectorAll('[role="dialog"] button')]
                .find((e) => e.textContent.trim() === "Primary colour")
                .click(),
            );
          } else await p.click('button[aria-label="Primary colour"]');
          await p.waitForSelector(".resume-colour-picker", { visible: true });
          await p.waitForFunction(() =>
            document.querySelector(".resume-colour-picker")?.contains(document.activeElement),
          );
          await frame(p);
        };
        await open();
        for (const state of ["default", "fine", "invalid"]) {
          if (state === "fine") await p.click(".resume-colour-fine summary");
          if (state === "invalid") {
            await p.$eval('[name="resume-primary-hex"]', (e) => e.select());
            await p.keyboard.sendCharacter("#invalid");
            await p.keyboard.press("Tab");
          }
          await frame(p);
          const metrics = await p.$eval(".resume-colour-picker", (e) => {
            const b = e.getBoundingClientRect(),
              style = getComputedStyle(e),
              wheel = e.querySelector(".air-colour-wheel").getBoundingClientRect();
            return {
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
              overflow: e.scrollWidth > e.clientWidth + 1,
              radius: style.borderRadius,
              padding: style.padding,
              wheel: wheel.width,
              coarse: matchMedia("(pointer:coarse)").matches,
              small: [...e.querySelectorAll("button,input,summary")].filter((x) => {
                const r = x.getBoundingClientRect();
                return r.width && (r.height < 40 || r.width < 40);
              }).length,
              primary: e.querySelector('[name="resume-primary-hex"]').value,
              focused: e.contains(document.activeElement),
            };
          });
          assert.ok(
            metrics.left >= 15 &&
              metrics.right <= w - 15 &&
              metrics.top >= 15 &&
              metrics.bottom <= h - 15 &&
              !metrics.overflow,
            JSON.stringify({ w, h, theme, text, state, metrics }),
          );
          assert.equal(metrics.small, 0, JSON.stringify({ w, h, theme, text, state, metrics }));
          assert.equal(metrics.radius, "12px");
          assert.equal(metrics.padding, "20px");
          assert.ok(metrics.focused);
          assert.equal(metrics.wheel, 208);
          evidence.layouts.push({ w, h, theme, text, state, metrics });
          if (
            ([1440, 1280, 768, 390].includes(w) && text === 16) ||
            ([320, 844].includes(w) && text === 32)
          ) {
            const name = `colour-${w}-${theme}-${text}-${state}.png`;
            await p.screenshot({ path: resolve(out, name) });
            evidence.screenshots.push(name);
          }
        }
        if (w === 1440 && text === 16) {
          const pairs = await p.evaluate(() => {
            const rgb = (s) => s.match(/[\d.]+/g)?.map(Number),
              lum = (c) =>
                c
                  .slice(0, 3)
                  .map((x) => x / 255)
                  .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
                  .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
            return [
              ...document.querySelectorAll(
                ".resume-colour-picker .air-label,.resume-colour-picker summary,.resume-colour-picker .air-help--error",
              ),
            ].map((e) => {
              const fg = rgb(getComputedStyle(e).color),
                bg = rgb(getComputedStyle(e.closest(".air-popover")).backgroundColor);
              return {
                text: e.textContent,
                ratio: (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05),
              };
            });
          });
          for (const pair of pairs) assert.ok(pair.ratio >= 4.5, JSON.stringify(pair));
          evidence.contrast.push({ theme, pairs });
        }
        await p.keyboard.press("Escape");
        await p.waitForSelector(".resume-colour-picker", { hidden: true });
        await context.close();
      }
  // Wide coarse input, forced colours, and an offset visual viewport are independent of width.
  for (const feature of ["coarse", "forced", "viewport"]) {
    const c = await browser.createBrowserContext(),
      p = await c.newPage();
    await p.setViewport({ width: 1440, height: 900, hasTouch: feature === "coarse" });
    await p.evaluateOnNewDocument(
      (fixture) => {
        Object.defineProperty(navigator, "serviceWorker", { value: undefined });
        localStorage.setItem(
          "cloakresume:v1",
          JSON.stringify({ resume: fixture, primary: "#000000", templateId: "classic-sidebar" }),
        );
      },
      { ...blankResume, profile: { ...blankResume.profile, summary: "Edge fixture" } },
    );
    if (feature === "forced") {
      const session = await p.createCDPSession();
      await session.send("Emulation.setEmulatedMedia", {
        features: [
          { name: "forced-colors", value: "active" },
          { name: "prefers-reduced-motion", value: "reduce" },
        ],
      });
    }
    await p.goto(process.env.SITE_URL || "http://127.0.0.1:8188/", { waitUntil: "networkidle0" });
    await p.evaluate(() =>
      [...document.querySelectorAll("button")]
        .find((e) => e.textContent.trim().startsWith("Resume editing"))
        .click(),
    );
    await p.waitForSelector('.resume-root[data-template-ready="true"]');
    await p.click('button[aria-label="Primary colour"]');
    await p.waitForSelector(".resume-colour-picker");
    await frame(p);
    if (feature === "viewport")
      await p.evaluate(() => {
        for (const [key, value] of Object.entries({
          width: 500,
          height: 310,
          offsetTop: 90,
          offsetLeft: 120,
        }))
          Object.defineProperty(visualViewport, key, { configurable: true, value });
        visualViewport.dispatchEvent(new Event("resize"));
      });
    await frame(p);
    const metrics = await p.$eval(".resume-colour-picker", (e) => {
      const r = e.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        overflow: e.scrollWidth > e.clientWidth + 1,
        wheel: getComputedStyle(e.querySelector(".air-colour-wheel")).forcedColorAdjust,
      };
    });
    if (feature === "viewport")
      assert.ok(
        metrics.left >= 136 && metrics.right <= 604 && metrics.top >= 106 && metrics.bottom <= 384,
        JSON.stringify(metrics),
      );
    assert.equal(metrics.overflow, false);
    assert.equal(metrics.wheel, "none");
    const name = `colour-${feature}.png`;
    await p.screenshot({ path: resolve(out, name) });
    evidence.screenshots.push(name);
    evidence.layouts.push({ feature, metrics });
    await c.close();
  }
  assert.deepEqual(evidence.errors, []);
  await writeFile(resolve(out, "results.json"), JSON.stringify(evidence, null, 2));
  console.log(
    `PASS: ${evidence.layouts.length} layouts, ${evidence.contrast.length} contrast groups, ${evidence.screenshots.length} captures`,
  );
} finally {
  await browser.close();
}
