/** Production logo/photo layout and state coverage; real feature/output tests live in Vitest. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const parent = process.env.AIR_EVIDENCE_DIR || tmpdir();
await mkdir(parent, { recursive: true });
const out = await mkdtemp(resolve(parent, "cloakresume-logo-photo-"));
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
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 80;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#285ad7";
            ctx.fillRect(0, 0, 80, 80);
            ctx.fillStyle = "white";
            ctx.font = "28px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("AR", 40, 50);
            fixture.profile.photoUrl = canvas.toDataURL("image/png");
            localStorage.setItem(
              "cloakresume:v1",
              JSON.stringify({
                resume: fixture,
                templateId: "classic-sidebar",
                activeSection: "profile",
                primary: "#047857",
                paperSize: "a4",
              }),
            );
          },
          {
            ...blankResume,
            profile: {
              ...blankResume.profile,
              name: "Air Review",
              summary: "Synthetic logo and portrait fixture.",
              logoIconName: "Code",
            },
          },
        );
        await p.goto(process.env.SITE_URL || "http://127.0.0.1:8145/", {
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
        const capture = async (state) => {
          if (
            ([1440, 1280, 768, 390].includes(w) && text === 16) ||
            (w === 320 && text === 32) ||
            (w === 844 && text === 32)
          ) {
            const name = `${state}-${w}-${theme}-${text}.png`;
            await p.screenshot({ path: resolve(out, name) });
            evidence.screenshots.push(name);
          }
        };
        for (const state of ["photo-present", "photo-empty"]) {
          if (state === "photo-empty") {
            await p.evaluate(() =>
              [...document.querySelectorAll(".resume-photo button")]
                .find((e) => e.textContent.trim() === "Remove photo")
                .click(),
            );
            await frame(p);
          }
          const metrics = await p.$eval(".resume-photo", (e) => {
            const b = e.getBoundingClientRect();
            return {
              left: b.left,
              right: b.right,
              overflow: e.scrollWidth > e.clientWidth + 1,
              small: [...e.querySelectorAll("button")].filter((x) => {
                const r = x.getBoundingClientRect();
                return r.width < 44 || r.height < 40;
              }).length,
              portrait: !!e.querySelector("img"),
            };
          });
          assert.ok(
            metrics.left >= 0 && metrics.right <= w && !metrics.overflow && !metrics.small,
            JSON.stringify({ w, h, theme, text, state, metrics }),
          );
          assert.equal(metrics.portrait, state === "photo-present");
          evidence.layouts.push({ w, h, theme, text, state, metrics });
          await capture(state);
        }
        await p.$eval(".resume-logo-trigger", (e) => {
          const s = e.closest(".resume-section");
          s.scrollTop += e.getBoundingClientRect().top - s.getBoundingClientRect().top - 30;
          e.focus({ preventScroll: true });
        });
        await p.keyboard.press("Enter");
        await p.waitForFunction(
          () => document.activeElement?.getAttribute("name") === "logo-icon-search",
        );
        for (const [state, query] of [
          ["logo-selected", ""],
          ["logo-search", "Code"],
          ["logo-empty", "NoMatchingIcon".repeat(16)],
        ]) {
          await p.$eval('[name="logo-icon-search"]', (e) => e.select());
          await p.keyboard.press("Backspace");
          if (query) await p.keyboard.sendCharacter(query);
          await frame(p);
          const metrics = await p.$eval(".resume-logo-picker", (e) => {
            const b = e.getBoundingClientRect(),
              style = getComputedStyle(e);
            return {
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
              overflow: e.scrollWidth > e.clientWidth + 1,
              radius: style.borderRadius,
              padding: style.padding,
              small: [...e.querySelectorAll("button")].filter((x) => {
                const r = x.getBoundingClientRect();
                return r.width < 44 || r.height < 44;
              }).length,
              results: e.querySelectorAll(".resume-logo-grid button").length,
              selected: e.querySelectorAll('[aria-pressed="true"]').length,
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
          assert.equal(metrics.small, 0);
          assert.equal(metrics.radius, "12px");
          assert.equal(metrics.padding, "20px");
          assert.ok(metrics.focused);
          if (state === "logo-selected") {
            assert.equal(metrics.results, 80);
            assert.equal(metrics.selected, 1);
          }
          if (state === "logo-empty") assert.equal(metrics.results, 0);
          evidence.layouts.push({ w, h, theme, text, state, metrics });
          await capture(state);
          if (w === 390 && text === 16 && state !== "logo-empty") {
            const pairs = await p.evaluate(() => {
              const rgb = (s) => s.match(/[\d.]+/g)?.map(Number),
                lum = (c) =>
                  c
                    .slice(0, 3)
                    .map((x) => x / 255)
                    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
                    .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0),
                ratio = (a, b) =>
                  (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
              return [
                ...document.querySelectorAll(
                  '.resume-logo-trigger,.resume-logo-count,.resume-logo-grid button[aria-pressed="true"],.resume-photo .air-help,.resume-photo button',
                ),
              ].map((e) => {
                let at = e,
                  bg;
                while (at) {
                  const c = rgb(getComputedStyle(at).backgroundColor);
                  if (c && (c.length === 3 || c[3] === 1)) {
                    bg = c;
                    break;
                  }
                  at = at.parentElement;
                }
                return {
                  name: e.ariaLabel || e.textContent.trim(),
                  ratio: ratio(rgb(getComputedStyle(e).color), bg),
                  min: e.matches(".resume-logo-grid button") ? 3 : 4.5,
                };
              });
            });
            for (const pair of pairs)
              assert.ok(pair.ratio >= pair.min, JSON.stringify({ theme, pair }));
            evidence.contrast.push({ theme, state, pairs });
          }
        }
        await p.keyboard.press("Escape");
        await p.waitForFunction(() =>
          document.activeElement?.classList.contains("resume-logo-trigger"),
        );
        assert.equal(await p.$(".resume-logo-picker"), null);
        await context.close();
      }
  assert.deepEqual(evidence.errors, []);
  console.log(
    `PASS ${evidence.layouts.length} photo/picker layouts; ${evidence.contrast.reduce((n, x) => n + x.pairs.length, 0)} contrast pairs; keyboard focus and long empty searches.`,
  );
} finally {
  await writeFile(resolve(out, "layouts.json"), JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
