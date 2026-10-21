/** Render the real Options/export adapter against a production preview. */
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
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
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-options/matrix";
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const records = [],
  captures = [],
  errors = [],
  contrast = [];
const frame = (p) =>
  p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
try {
  for (const state of ["ready", "busy", "failure"])
    for (const coarse of [true, false]) {
      const ctx = await browser.createBrowserContext(),
        p = await ctx.newPage();
      p.on("pageerror", (e) => errors.push(String(e)));
      await p.setViewport({ width: 390, height: 844, hasTouch: coarse });
      await p.setBypassServiceWorker(true);
      await p.evaluateOnNewDocument(
        (resume) => {
          Object.defineProperty(navigator, "serviceWorker", { value: undefined });
          localStorage.setItem(
            "cloakresume:v1",
            JSON.stringify({
              resume,
              templateId: "ats-plain",
              primary: "#123456",
              paperSize: "letter",
            }),
          );
        },
        {
          ...blankResume,
          profile: {
            ...blankResume.profile,
            name: "Options review",
            title: "Engineer",
            summary: "A preserved draft.",
          },
        },
      );
      await p.goto(process.env.SITE_URL || "http://127.0.0.1:8203/", { waitUntil: "networkidle0" });
      await p.evaluate(() =>
        [...document.querySelectorAll("button")]
          .find((e) => e.textContent.trim().startsWith("Resume editing"))
          .click(),
      );
      await p.waitForSelector('.resume-root[data-template-ready="true"]');
      await p.evaluate(() => document.fonts.ready);
      await p.click('[aria-label="More options"]');
      await p.waitForSelector(".resume-options");
      if (state === "busy") {
        await p.setRequestInterception(true);
        p.on("request", (r) => {
          if (!/\/pdfExport-[^/]+\.js/.test(r.url())) void r.continue();
        });
        await p.click(".resume-options [data-export-pdf]");
        await p.waitForSelector('.resume-options [aria-busy="true"]');
      } else if (state === "failure") {
        await p.evaluate(
          () => (document.querySelector(".resume-root").dataset.templateReady = "false"),
        );
        await p.click(".resume-options [data-export-pdf]");
        await p.waitForSelector('[role="alertdialog"]');
      }
      for (const [width, height] of sizes.filter(([w]) => w <= 1024 === coarse))
        for (const theme of ["light", "dark"])
          for (const text of [16, 32]) {
            await p.setViewport({ width, height, hasTouch: coarse });
            await p.emulateMediaFeatures([
              { name: "prefers-color-scheme", value: theme },
              { name: "prefers-reduced-motion", value: "reduce" },
            ]);
            await p.evaluate((n) => (document.documentElement.style.fontSize = `${n}px`), text);
            // Wait for the browser's dynamic viewport units to settle after CDP resizing.
            await p.waitForFunction(() => {
              const d = document.querySelector(".resume-options");
              return parseFloat(getComputedStyle(d).maxBlockSize) <= innerHeight - 16;
            });
            await frame(p);
            const info = await p.evaluate(
              ({ coarse, state }) => {
                const d = document.querySelector(
                    state === "failure" ? '[role="alertdialog"]' : ".resume-options",
                  ),
                  r = d.getBoundingClientRect(),
                  body = d.querySelector(".resume-options-body") || d,
                  problems = [];
                if (
                  r.left < -0.5 ||
                  r.right > innerWidth + 0.5 ||
                  r.top < -0.5 ||
                  r.bottom > innerHeight + 0.5
                )
                  problems.push("dialog outside viewport");
                if (body.scrollWidth > body.clientWidth + 1) problems.push("horizontal overflow");
                for (const e of d.querySelectorAll("button")) {
                  const b = e.getBoundingClientRect();
                  if (b.width < (coarse ? 44 : 32) - 0.5 || b.height < (coarse ? 44 : 32) - 0.5)
                    problems.push("small target");
                  if (b.left < r.left - 0.5 || b.right > r.right + 0.5)
                    problems.push("target outside width");
                }
                const close = d.querySelector('button[aria-label^="Close"]'),
                  cr = close.getBoundingClientRect();
                if (cr.top < r.top || cr.bottom > r.bottom) problems.push("close clipped");
                const status = document.querySelector(
                  '.resume-options [role="status"]',
                )?.textContent;
                return {
                  problems,
                  status,
                  dialog: { width: r.width, height: r.height },
                  body: { height: body.clientHeight, scroll: body.scrollHeight },
                  backgroundInert: document.querySelector("#app").inert,
                };
              },
              { coarse, state },
            );
            const id = `${state}-${width}x${height}-${theme}-${text}`;
            records.push({ id, width, height, theme, text, coarse, ...info });
            if (info.problems.length) console.log(id, info.problems);
            if (
              (state === "ready" || width === 390 || width === 1280) &&
              [
                [320, 32],
                [390, 16],
                [844, 32],
                [1280, 16],
                [1440, 16],
              ].some(([w, t]) => w === width && t === text)
            ) {
              await p.screenshot({ path: `${out}/${id}.png` });
              captures.push(id);
            }
          }
      if (state === "ready") {
        for (const theme of ["light", "dark"]) {
          await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
          await frame(p);
          const ratios = await p.evaluate(() => {
            const c = document.createElement("span");
            document.body.append(c);
            const lum = (v) => {
              c.style.color = `var(${v})`;
              const rgb = getComputedStyle(c)
                .color.match(/[\d.]+/g)
                .slice(0, 3)
                .map(Number)
                .map((n) => {
                  n /= 255;
                  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
                });
              return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
            };
            const pairs = [
              ["--air-ink", "--air-surface"],
              ["--air-ink-secondary", "--air-surface"],
              ["--air-ink", "--air-surface-hover"],
              ["--air-on-action", "--air-action"],
            ];
            const result = pairs.map(([fg, bg]) => {
              const a = lum(fg),
                b = lum(bg);
              return { fg, bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
            });
            c.remove();
            return result;
          });
          contrast.push({ theme, coarse, ratios });
        }
        const cdp = await p.createCDPSession();
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [{ name: "forced-colors", value: "active" }],
        });
        await p.focus('[aria-label="Close options"]');
        await frame(p);
        await p.screenshot({ path: `${out}/forced-${coarse}.png` });
      }
      await ctx.close();
    }
  await writeFile(
    `${out}/matrix.json`,
    JSON.stringify({ records, captures, contrast, errors }, null, 2),
  );
  const bad = records.filter((r) => r.problems.length);
  console.log(JSON.stringify({ cases: records.length, failures: bad.length, errors, contrast }));
  const lowContrast = contrast.flatMap((c) => c.ratios).some((c) => c.ratio < 4.5);
  if (bad.length || errors.length || lowContrast || records.some((r) => !r.backgroundInert))
    process.exitCode = 1;
} finally {
  await browser.close();
}
