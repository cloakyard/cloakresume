/** Partial-date controls: responsive popup, native focus and unchanged saved values. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-dates";
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const sizes = process.env.AIR_QUICK
  ? [
      [1440, 900],
      [320, 568],
      [844, 390],
    ]
  : [
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
const fixture = {
  ...blankResume,
  profile: { ...blankResume.profile, name: "Air date test" },
  experience: [
    {
      id: "e1",
      title: "Engineer",
      company: "Company",
      location: "Remote",
      start: "Mar 2020",
      end: "Present",
      bullets: [],
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "Degree",
      school: "School",
      location: "",
      detail: "",
      start: "1930",
      end: "Present",
    },
    {
      id: "ed2",
      degree: "Long imported date",
      school: "School",
      location: "",
      detail: "",
      start: "Spring term of a year preserved exactly from an imported document",
      end: "",
    },
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
              activeSection: "education",
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
        const triggers = await p.$$(".resume-date-trigger");
        assert.equal(triggers.length, 4);
        const fields = await p.evaluate(() =>
          [...document.querySelectorAll(".resume-date-trigger")].map((e) => {
            const b = e.getBoundingClientRect(),
              c = getComputedStyle(e);
            return {
              width: b.width,
              height: b.height,
              left: b.left,
              right: b.right,
              scroll: e.scrollWidth <= e.clientWidth + 1,
              font: parseFloat(c.fontSize),
            };
          }),
        );
        for (const f of fields)
          assert.ok(
            f.width >= 44 && f.height >= 40 && f.left >= 0 && f.right <= w && f.scroll,
            JSON.stringify({ w, h, theme, text, fields }),
          );
        for (const [state, index] of [
          ["months", 0],
          ["years", 0],
          ["present", 1],
          ["empty", 3],
        ]) {
          await triggers[index].evaluate((e) => {
            const s = e.closest(".resume-section");
            s.scrollTop += e.getBoundingClientRect().top - s.getBoundingClientRect().top - 30;
          });
          await frame(p);
          await triggers[index].click();
          await p.waitForSelector(".resume-date-picker");
          await frame(p);
          if (state === "years") {
            await p.click('button[aria-label="Select year"]');
            await frame(p);
          }
          const metrics = await p.evaluate(() => {
            const e = document.querySelector(".resume-date-picker"),
              b = e.getBoundingClientRect(),
              c = getComputedStyle(e),
              coarse = matchMedia("(pointer:coarse)").matches;
            const buttons = [...e.querySelectorAll("button")];
            return {
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
              overflow: e.scrollWidth > e.clientWidth + 1,
              coarse,
              radius: c.borderRadius,
              padding: c.padding,
              buttons: buttons.length,
              small: buttons
                .filter((x) => {
                  const r = x.getBoundingClientRect();
                  return r.width < (coarse ? 44 : 40) || r.height < (coarse ? 44 : 40);
                })
                .map((x) => x.textContent || x.ariaLabel),
              focused: e.contains(document.activeElement),
              current: e.querySelectorAll("[aria-current]").length,
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
          assert.deepEqual(
            metrics.small,
            [],
            JSON.stringify({ w, h, theme, text, state, metrics }),
          );
          assert.ok(metrics.focused);
          assert.equal(metrics.radius, "12px");
          assert.equal(metrics.padding, "20px");
          if (state === "years") {
            assert.equal(
              await p.$eval('.resume-year-grid button[aria-pressed="true"]', (e) =>
                e.textContent.trim(),
              ),
              "1930",
            );
            for (const edge of ["first-child", "last-child"]) {
              await p.$eval(`.resume-year-grid button:${edge}`, (e) => {
                e.scrollIntoView({ block: "nearest" });
                e.focus({ preventScroll: true });
              });
              await frame(p);
              const visible = await p.$eval(`.resume-year-grid button:${edge}`, (e) => {
                const b = e.getBoundingClientRect(),
                  g = e.closest(".resume-year-grid").getBoundingClientRect(),
                  d = e.closest(".resume-date-picker").getBoundingClientRect();
                return (
                  b.top >= Math.max(g.top, d.top) - 1 &&
                  b.bottom <= Math.min(g.bottom, d.bottom) + 1
                );
              });
              assert.ok(visible, JSON.stringify({ w, h, theme, text, edge }));
            }
            await p.$eval('.resume-year-grid button[aria-pressed="true"]', (e) => {
              e.scrollIntoView({ block: "nearest" });
              e.focus({ preventScroll: true });
            });
            await frame(p);
          }
          if (
            (text === 16 &&
              ((w === 1440 && theme === "light") ||
                (w === 1280 && theme === "dark") ||
                (w === 768 && theme === "light") ||
                (w === 390 && theme === "dark"))) ||
            (w === 320 && theme === "light" && text === 32) ||
            (w === 844 && theme === "dark" && text === 32)
          )
            await p.screenshot({ path: `${out}/date-${state}-${w}-${theme}-${text}.png` });
          await p.keyboard.press("Escape");
          if (state === "years") await p.keyboard.press("Escape");
          await frame(p);
          assert.ok(await triggers[index].evaluate((e) => document.activeElement === e));
          layouts.push({ w, h, theme, text, state, fields, metrics });
        }
        if (w < 1024) await p.$eval(".resume-section-close", (e) => e.click());
        await p.evaluate(() =>
          [...document.querySelectorAll(".resume-section-link")]
            .find((e) => (e.ariaLabel || e.textContent).trim().startsWith("Experience"))
            .click(),
        );
        await frame(p);
        const current = await p.evaluate(() => {
          const e = document.querySelector('input[type="checkbox"]'),
            label = e.closest("label").getBoundingClientRect(),
            end = document.querySelectorAll(".resume-date-trigger")[1];
          return {
            checked: e.checked,
            height: label.height,
            disabled: end.disabled,
            clear: !!document.querySelector('[aria-label="Clear end"]'),
          };
        });
        assert.deepEqual(current, {
          checked: true,
          height: Math.max(44, current.height),
          disabled: true,
          clear: false,
        });
        assert.deepEqual(
          await p.evaluate(() => JSON.parse(localStorage.getItem("cloakresume:v1")).resume),
          fixture,
        );
        await ctx.close();
        console.log(`PASS ${w}×${h} ${theme} ${text}px: four date states and current job`);
      }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/layouts.json`, JSON.stringify({ layouts, errors }, null, 2));
  console.log(`PASS ${layouts.length} date layouts`);
} finally {
  await browser.close();
}
