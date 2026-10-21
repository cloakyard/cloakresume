/** Contact and proficiency fields, including the native customizable select popup. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-selects";
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
const custom = "Native proficiency · community interpretation and technical translation";
const fixture = {
  ...blankResume,
  profile: { ...blankResume.profile, name: "Air contact test" },
  contact: [
    "email",
    "phone",
    "location",
    "website",
    "linkedin",
    "github",
    "medium",
    "twitter",
    "other",
  ].map((kind, i) => ({
    id: `c${i}`,
    kind,
    value:
      kind === "email"
        ? "person@example.com"
        : kind === "phone"
          ? "+1 (555) 123-4567"
          : kind === "location"
            ? "Bengaluru, India"
            : "https://example.com/profile?reference=long-value",
  })),
  languages: [
    { id: "l1", name: "English", level: custom },
    { id: "l2", name: "Spanish", level: "" },
  ],
};
const layouts = [],
  errors = [];
const frame = (p) =>
  p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
try {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        const ctx = await browser.createBrowserContext(),
          p = await ctx.newPage();
        await p.setViewport({ width: w, height: h, hasTouch: w <= 1100 });
        await p.setBypassServiceWorker(true);
        await p.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        p.on("pageerror", (e) => errors.push(String(e)));
        await p.evaluateOnNewDocument((f) => {
          Object.defineProperty(navigator, "serviceWorker", { value: undefined });
          localStorage.setItem(
            "cloakresume:v1",
            JSON.stringify({
              resume: f,
              templateId: "ats-plain",
              primary: "#047857",
              paperSize: "a4",
              activeSection: "contact",
            }),
          );
        }, fixture);
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
        for (const section of ["Contact", "Languages"]) {
          if (section === "Languages") {
            if (w < 1024) await p.$eval(".resume-section-close", (e) => e.click());
            await p.evaluate(
              (name) =>
                [...document.querySelectorAll(".resume-section-link")]
                  .find((e) => (e.ariaLabel || e.textContent).trim().startsWith(name))
                  .click(),
              section,
            );
            await frame(p);
          }
          const measurements = await p.evaluate(() => {
            const panel = document.querySelector(".resume-section-body").getBoundingClientRect(),
              coarse = matchMedia("(pointer:coarse)").matches,
              failures = [];
            const fields = [
              ...document.querySelectorAll(".cr-editor-panel input,.cr-editor-panel select"),
            ];
            for (const e of fields) {
              const b = e.getBoundingClientRect(),
                css = getComputedStyle(e);
              if (b.width < 44 || b.height < (coarse ? 44 : 40)) failures.push("target " + e.name);
              if (
                b.left < panel.left - 1 ||
                b.right > panel.right + 1 ||
                (e.tagName === "SELECT" && e.scrollWidth > e.clientWidth + 1)
              )
                failures.push("overflow " + e.name);
              if (
                parseFloat(css.fontSize) < (coarse ? 16 : 14) ||
                !css.fontFamily.includes("-apple-system") ||
                css.textTransform !== "none"
              )
                failures.push("type " + e.name);
              if (!e.labels?.length) failures.push("missing label " + e.name);
            }
            return { failures, fields: fields.length, coarse };
          });
          assert.deepEqual(
            measurements.failures,
            [],
            JSON.stringify({ w, h, theme, text, section, ...measurements }),
          );
          assert.equal(measurements.fields, section === "Contact" ? 18 : 4);
          const sel = await p.$(".cr-editor-panel select");
          await sel.evaluate((e) => e.scrollIntoView({ block: "nearest" }));
          await frame(p);
          await sel.click();
          await p.waitForFunction(() => !!document.querySelector("select:open"));
          await frame(p);
          const popup = await p.evaluate(() => {
            const e = document.querySelector("select:open"),
              opts = [...e.options].filter((o) => !o.disabled),
              rects = opts.map((o) => o.getBoundingClientRect()),
              coarse = matchMedia("(pointer:coarse)").matches;
            return {
              open: !!e,
              appearance: getComputedStyle(e).appearance,
              display: getComputedStyle(e).display,
              options: opts.length,
              targets: rects.every((b) => b.height >= (coarse ? 44 : 40)),
              horizontal: rects.every((b) => b.left >= 0 && b.right <= innerWidth),
              scrollable: getComputedStyle(e, "::picker(select)").overflow,
              wrap: opts.every((o) => o.scrollWidth <= o.clientWidth + 1),
              value: e.value,
            };
          });
          assert.equal(popup.appearance, "base-select");
          assert.ok(
            popup.targets && popup.horizontal && popup.wrap,
            JSON.stringify({ w, h, theme, text, section, popup }),
          );
          if (
            (text === 16 &&
              ((w === 1440 && theme === "light") ||
                (w === 1280 && theme === "dark") ||
                (w === 768 && theme === "light") ||
                (w === 390 && theme === "dark"))) ||
            (w === 320 && theme === "light" && text === 32)
          )
            await p.screenshot({
              path: `${out}/select-${section.toLowerCase()}-${w}-${theme}-${text}.png`,
            });
          await p.keyboard.press("Escape");
          await frame(p);
          assert.equal(
            await sel.evaluate((e) => e.value),
            section === "Contact" ? "email" : custom,
          );
          assert.ok(await sel.evaluate((e) => document.activeElement === e));
          const ring = await sel.evaluate((e) => {
            const c = getComputedStyle(e);
            return { width: c.outlineWidth, offset: c.outlineOffset, border: c.borderColor };
          });
          assert.deepEqual(ring, { width: "2px", offset: "0px", border: "rgba(0, 0, 0, 0)" });
          layouts.push({ w, h, theme, text, section, ...measurements, popup });
        }
        assert.deepEqual(
          await p.evaluate(() => JSON.parse(localStorage.getItem("cloakresume:v1")).resume),
          fixture,
        );
        await ctx.close();
        console.log(`PASS ${w}×${h} ${theme} ${text}px: contact/language fields and popups`);
      }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/layouts.json`, JSON.stringify({ layouts, errors }, null, 2));
  console.log(`PASS ${layouts.length} field and popup layouts, selection preserved`);
} finally {
  await browser.close();
}
