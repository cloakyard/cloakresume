/** Render actual production PWA states driven by real local service workers. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { startPwaServer } from "../tests/helpers/pwa-server.ts";
import { blankResume } from "../src/data/blankResume.ts";
const sizes = [
  [320, 568],
  [375, 812],
  [390, 844],
  [430, 932],
  [639, 800],
  [640, 800],
  [767, 1024],
  [768, 1024],
  [844, 390],
  [1023, 768],
  [1024, 768],
  [1279, 720],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-pwa/matrix";
await mkdir(out, { recursive: true });
const server = await startPwaServer(),
  browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
const records = [],
  forcedColours = [],
  errors = [],
  contrast = [];
const frame = (p) =>
  p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
try {
  for (const state of ["offline", "update", "updating", "error", "blocked", "404"])
    for (const coarse of [true, false]) {
      const context = await browser.createBrowserContext(),
        p = await context.newPage();
      p.on("pageerror", (e) => errors.push(String(e)));
      await p.setViewport({ width: 1280, height: 720, hasTouch: coarse });
      if (state !== "404") {
        server.state.hold = false;
        await p.evaluateOnNewDocument(
          (resume) => {
            localStorage.setItem(
              "cloakresume:v1",
              JSON.stringify({
                resume,
                templateId: "ats-plain",
                primary: "#123456",
                paperSize: "letter",
              }),
            );
            const interval = window.setTimeout.bind(window);
            window.setTimeout = (fn, delay, ...args) =>
              delay === 4000 ? interval(() => {}, 4000) : interval(fn, delay, ...args);
          },
          {
            ...blankResume,
            profile: { ...blankResume.profile, name: "Offline draft", title: "Design engineer" },
          },
        );
        await p.goto(server.url, { waitUntil: "networkidle0" });
        await p.evaluate(() =>
          [...document.querySelectorAll("button")]
            .find((b) => b.textContent.trim().startsWith("Resume editing"))
            .click(),
        );
        await p.waitForSelector('.resume-root[data-template-ready="true"]');
        await p.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
        if (state !== "offline") {
          server.state.version++;
          server.state.hold = state === "updating";
          await p.evaluate(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            await r.update();
          });
          await p.waitForSelector('[aria-label="Update and reload"]');
          if (state === "error")
            await p.evaluate(() => {
              ServiceWorker.prototype.postMessage = () => {
                throw new Error("Fixture delivery failure");
              };
            });
          if (state === "blocked") {
            await p.evaluate(() => {
              Storage.prototype.setItem = () => {
                throw new Error("Fixture storage failure");
              };
            });
            await p.type('[name="profile-name"]', " — unsaved");
          }
          if (["updating", "error", "blocked"].includes(state))
            await p.evaluate(() =>
              document.querySelector('[aria-label="Update and reload"]').click(),
            );
          if (state === "updating") await p.waitForSelector('.resume-update [aria-busy="true"]');
          if (["error", "blocked"].includes(state))
            await p.waitForSelector('.resume-update [aria-label="Try again"]');
          if (state === "blocked") {
            await p.waitForSelector('[role="alertdialog"]');
            await p.click('[role="alertdialog"] button');
          }
        } else await p.waitForSelector(".resume-update");
      } else {
        const r = await p.goto(server.url + "/missing/long-address?value=" + "a".repeat(120));
        assert.equal(r.status(), 404);
        await p.waitForSelector("#requested-path:not([hidden])");
      }
      for (const theme of ["light", "dark"])
        for (const rootPx of [16, 32])
          for (const [width, height] of sizes.filter(([w]) => w <= 1024 === coarse)) {
            await p.emulateMediaFeatures([
              { name: "prefers-color-scheme", value: theme },
              { name: "prefers-reduced-motion", value: "reduce" },
            ]);
            await p.setViewport({ width, height, hasTouch: coarse });
            await p.evaluate((px) => (document.documentElement.style.fontSize = px + "px"), rootPx);
            await frame(p);
            if (state !== "404") {
              await p.keyboard.press("Tab");
              for (const button of await p.$$(".resume-update button")) {
                await button.focus();
                assert(
                  await button.evaluate((e) => {
                    const r = e.getBoundingClientRect(),
                      box = e.closest(".resume-update").getBoundingClientRect();
                    return r.top >= box.top + 4 && r.bottom <= box.bottom - 4;
                  }),
                  `focused command clipped: ${state}/${width}/${height}/${rootPx}`,
                );
              }
            }
            const result = await p.evaluate(
              ({ state, coarse }) => {
                const root = document.querySelector(state === "404" ? "main" : ".resume-update");
                const rect = root.getBoundingClientRect();
                const problems = [];
                if (document.documentElement.scrollWidth > innerWidth + 1)
                  problems.push("page horizontal overflow");
                if (root.scrollWidth > root.clientWidth + 1)
                  problems.push("notice horizontal overflow");
                if (state !== "404") {
                  const card = root.querySelector(".resume-update-content");
                  const skin = getComputedStyle(card);
                  if (skin.borderRadius !== "18px" || skin.borderTopWidth !== "1px")
                    problems.push("notice does not use the Air panel shell");
                  if (/Archivo|JetBrains/.test(getComputedStyle(root).fontFamily))
                    problems.push("legacy notice typography");
                  const editor = document.querySelector(".resume-editor").getBoundingClientRect();
                  if (rect.bottom > editor.top + 1) problems.push("notice covers editor");
                  if (editor.height < 1) problems.push("editor not reachable");
                  if (rect.height > innerHeight * 0.45 + 1)
                    problems.push("notice exceeds available height");
                }
                const targets = [
                  ...document.querySelectorAll(state === "404" ? "a" : ".resume-update button"),
                ]
                  .filter((e) => e.getClientRects().length)
                  .map((e) => {
                    const r = e.getBoundingClientRect();
                    if (coarse && (r.height < 43.9 || r.width < 43.9))
                      problems.push("small target " + e.textContent.trim());
                    return {
                      label: e.getAttribute("aria-label") || e.textContent.trim(),
                      width: r.width,
                      height: r.height,
                    };
                  });
                return { problems, targets, height: rect.height, text: root.textContent };
              },
              { state, coarse },
            );
            records.push({ state, theme, rootPx, width, height, coarse, ...result });
            if (
              [
                [390, 16],
                [1280, 16],
                [320, 32],
                [844, 32],
              ].some(([w, p]) => w === width && p === rootPx)
            )
              await p.screenshot({
                path: `${out}/${state}-${width}x${height}-${theme}-${rootPx}.png`,
                fullPage: state === "404",
              });
          }
      // Focus every notice command, including those below the short-screen scroll edge.
      if (state !== "404") {
        for (const button of await p.$$(".resume-update button")) {
          await button.focus();
          assert(
            await button.evaluate((e) => {
              const r = e.getBoundingClientRect(),
                box = e.closest(".resume-update").getBoundingClientRect();
              return r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
            }),
            "focused command hidden",
          );
        }
      }
      const cdp = await p.createCDPSession();
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [
          { name: "forced-colors", value: "active" },
          { name: "prefers-reduced-motion", value: "reduce" },
        ],
      });
      await p.setViewport({ width: coarse ? 390 : 1280, height: 844, hasTouch: coarse });
      await p.evaluate(() => (document.documentElement.style.fontSize = "16px"));
      await p.keyboard.press("Tab");
      await p.focus(state === "404" ? "main a" : ".resume-update button");
      const forced = await p.evaluate(() => ({
        active: matchMedia("(forced-colors: active)").matches,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        outline: getComputedStyle(document.activeElement).outlineStyle,
        colour: getComputedStyle(document.activeElement).color,
        background: getComputedStyle(document.activeElement).backgroundColor,
      }));
      assert(
        forced.active && !forced.overflow && forced.outline !== "none",
        JSON.stringify({ state, coarse, ...forced }),
      );
      forcedColours.push({ state, coarse, ...forced });
      await p.screenshot({ path: `${out}/${state}-forced-${coarse ? "phone" : "desktop"}.png` });
      await context.close();
    }
  const probe = await browser.newPage();
  await probe.goto(server.url + "/404.html");
  for (const theme of ["light", "dark"]) {
    await probe.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    await frame(probe);
    const colours = await probe.evaluate(() => {
      const p = document.createElement("span");
      p.style.transition = "none";
      document.body.append(p);
      const values = {};
      for (const name of ["ink", "ink-secondary", "surface", "page", "action", "on-action"]) {
        p.style.color = `var(--air-${name})`;
        values[name] = getComputedStyle(p)
          .color.match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
      }
      p.remove();
      return values;
    });
    const lum = (c) =>
      c
        .map((x) => {
          const s = x / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        })
        .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    for (const [fg, bg] of [
      ["ink", "surface"],
      ["ink-secondary", "surface"],
      ["ink", "page"],
      ["ink-secondary", "page"],
      ["on-action", "action"],
    ]) {
      const a = lum(colours[fg]),
        b = lum(colours[bg]);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      contrast.push({ theme, fg, bg, ratio });
      assert(ratio >= 4.5);
    }
  }
  await writeFile(
    `${out}/matrix.json`,
    JSON.stringify({ records, forcedColours, errors, contrast }, null, 2),
  );
  console.log(
    JSON.stringify({
      cases: records.length,
      failures: records.filter((r) => r.problems.length),
      errors,
      contrast,
    }),
  );
  assert.equal(records.filter((r) => r.problems.length).length, 0);
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await server.close();
}
