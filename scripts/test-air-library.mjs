/** Actual template library: responsive chrome, live previews and reachable selection. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-library/layouts";
const url = process.env.SITE_URL || "http://127.0.0.1:8195/";
await mkdir(out, { recursive: true });
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
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const layouts = [],
  errors = [],
  contrasts = [];
const frame = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
async function press(page, selector) {
  const el = await page.waitForSelector(selector, { visible: true });
  await el.scrollIntoView();
  await el.click();
  await el.dispose();
  await frame(page);
}
async function open(page, width) {
  if (width < 1024) {
    await press(page, '[aria-label="More options"]');
    await page.evaluate(() =>
      [...document.querySelectorAll('[role="dialog"] button')]
        .find((el) => el.textContent.trim() === "Template")
        .click(),
    );
  } else await press(page, '[aria-label^="Template:"]');
  await page.waitForSelector(".resume-library");
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "Close template library",
  );
  await frame(page);
}
function luminance(rgb) {
  const c = rgb
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number)
    .map((n) => {
      const x = n / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
try {
  for (const [w, h] of process.env.AIR_FORCE_ONLY ? [] : sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32])
        for (const draft of ["empty", "populated"]) {
          const context = await browser.createBrowserContext(),
            page = await context.newPage();
          await page.setViewport({ width: w, height: h, hasTouch: w <= 1100 });
          await page.emulateMediaFeatures([
            { name: "prefers-color-scheme", value: theme },
            { name: "prefers-reduced-motion", value: "reduce" },
          ]);
          page.on("pageerror", (e) => errors.push(String(e)));
          await page.evaluateOnNewDocument(
            (resume) => {
              Object.defineProperty(navigator, "serviceWorker", { value: undefined });
              localStorage.setItem(
                "cloakresume:v1",
                JSON.stringify({
                  resume,
                  templateId: "ats-plain",
                  primary: "#123456",
                  paperSize: "a4",
                  activeSection: "profile",
                }),
              );
            },
            draft === "empty"
              ? blankResume
              : {
                  ...blankResume,
                  profile: {
                    ...blankResume.profile,
                    name: "Amara Schmidt",
                    title: "Design Engineer",
                    summary:
                      "Built accessible systems with careful testing and dependable local workflows.",
                  },
                },
          );
          await page.goto(url, { waitUntil: "networkidle0" });
          await page.evaluate((t) => {
            document.documentElement.style.fontSize = `${t}px`;
            const buttons = [...document.querySelectorAll("button")];
            (
              buttons.find((el) => el.textContent.trim().startsWith("Resume editing")) ||
              buttons.find((el) => el.textContent.trim() === "Start blank")
            ).click();
          }, text);
          await page.waitForSelector('.resume-root[data-template-ready="true"]');
          await open(page, w);
          for (const state of ["gallery", "filtered", "no-results"]) {
            const query =
              state === "gallery"
                ? ""
                : state === "filtered"
                  ? "Prism"
                  : "No_matching_template_".repeat(8);
            await page.$eval(
              '[name="template-search"]',
              (el, q) => {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
                  el,
                  q,
                );
                el.dispatchEvent(new Event("input", { bubbles: true }));
              },
              query,
            );
            await frame(page);
            if (state !== "no-results") {
              await page.waitForFunction(() =>
                [...document.querySelectorAll(".resume-template-preview")].every(
                  (el) => (el.textContent?.length ?? 0) > 0,
                ),
              );
              await frame(page);
            }
            const data = await page.evaluate(() => {
              const failures = [],
                dialog = document.querySelector(".resume-library"),
                body = document.querySelector(".resume-library-body"),
                d = dialog.getBoundingClientRect(),
                b = body.getBoundingClientRect(),
                coarse = matchMedia("(pointer: coarse)").matches;
              if (
                d.left < -0.5 ||
                d.right > innerWidth + 0.5 ||
                d.top < 15 ||
                d.bottom > innerHeight + 0.5
              )
                failures.push("dialog outside safe viewport");
              if (body.scrollWidth > body.clientWidth + 1)
                failures.push("horizontal body overflow");
              if (document.documentElement.scrollWidth > innerWidth)
                failures.push("horizontal page overflow");
              const close = dialog.querySelector('[aria-label="Close template library"]'),
                c = close.getBoundingClientRect();
              if (
                c.top < d.top ||
                c.bottom > d.bottom ||
                c.width < (coarse ? 44 : 40) ||
                c.height < (coarse ? 44 : 40)
              )
                failures.push("close unreachable or undersized");
              const input = dialog.querySelector("input"),
                field = input.closest(".air-field-group"),
                css = getComputedStyle(input),
                f = field.getBoundingClientRect();
              if (!input.labels.length || !input.getAttribute("aria-describedby"))
                failures.push("search missing label/help");
              if (
                f.width <= 50 ||
                f.height < 44 ||
                getComputedStyle(field).borderRadius !== "10px" ||
                parseFloat(css.fontSize) < (coarse || innerWidth <= 640 ? 16 : 14)
              )
                failures.push("search shell");
              for (const el of dialog.querySelectorAll(".resume-template-card")) {
                const r = el.getBoundingClientRect();
                if (r.left < b.left - 1 || r.right > b.right + 1)
                  failures.push("card outside body");
              }
              const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
              while (walker.nextNode()) {
                const node = walker.currentNode,
                  p = node.parentElement;
                if (
                  !node.textContent.trim() ||
                  p.closest(".resume-template-preview,svg,input,.sr-only") ||
                  !p.getClientRects().length
                )
                  continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                if (
                  [...range.getClientRects()].some(
                    (r) => r.left < d.left - 1 || r.right > d.right + 1,
                  )
                )
                  failures.push(`text overflow: ${node.textContent.trim()}`);
                const css = getComputedStyle(p);
                if (
                  css.textTransform !== "none" ||
                  !css.fontFamily.includes("-apple-system") ||
                  parseFloat(css.fontSize) < 12
                )
                  failures.push(`legacy text: ${node.textContent}`);
              }
              for (const el of dialog.querySelectorAll(".resume-template-preview")) {
                if (!el.inert || el.getAttribute("aria-hidden") !== "true")
                  failures.push("interactive preview");
                const wrapper = el.firstElementChild,
                  scale = new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).a;
                if (Math.abs(wrapper.offsetWidth * scale - el.clientWidth) > 1)
                  failures.push("preview scale mismatch");
              }
              return {
                failures,
                coarse,
                cards: dialog.querySelectorAll(".resume-template-card").length,
                bodyHeight: b.height,
                dialog: { x: d.x, y: d.y, width: d.width, height: d.height },
              };
            });
            assert.deepEqual(
              data.failures,
              [],
              JSON.stringify({ w, h, theme, text, draft, state, ...data }),
            );
            assert.equal(data.cards, state === "gallery" ? 17 : state === "filtered" ? 1 : 0);
            if (state === "gallery") {
              await page.$eval(".resume-template-card:last-child .resume-template-choice", () => {
                const buttons = document.querySelectorAll(".resume-template-choice");
                buttons[buttons.length - 1].focus();
              });
              assert(
                await page.evaluate(() => {
                  const r = document.activeElement.getBoundingClientRect(),
                    b = document.querySelector(".resume-library-body").getBoundingClientRect();
                  return r.top < b.bottom && r.bottom > b.top;
                }),
                "Last choice unreachable",
              );
            }
            await page.$eval(".resume-library-body", (el) => (el.scrollTop = 0));
            await frame(page);
            layouts.push({ w, h, theme, text, draft, state, ...data });
            if (
              draft === "populated" &&
              ((text === 16 && [1440, 1280, 390].includes(w)) ||
                (text === 32 && [768, 320, 844].includes(w)))
            )
              await page.screenshot({ path: `${out}/${w}-${h}-${theme}-${text}-${state}.png` });
            if (w === 1440 && text === 16 && draft === "populated" && state === "gallery") {
              const pairs = await page.evaluate(() =>
                [
                  ".resume-library-description",
                  ".resume-library-count",
                  ".resume-template-details p",
                  ".resume-template-selected svg",
                ].map((selector) => {
                  const el = document.querySelector(selector);
                  let p = el;
                  while (p && getComputedStyle(p).backgroundColor === "rgba(0, 0, 0, 0)")
                    p = p.parentElement;
                  return {
                    selector,
                    foreground: getComputedStyle(el).color,
                    background: getComputedStyle(p).backgroundColor,
                  };
                }),
              );
              for (const pair of pairs) {
                const l = [luminance(pair.foreground), luminance(pair.background)].sort(
                    (a, b) => b - a,
                  ),
                  ratio = (l[0] + 0.05) / (l[1] + 0.05);
                assert(ratio >= (pair.selector.endsWith("svg") ? 3 : 4.5), JSON.stringify(pair));
                contrasts.push({ theme, ...pair, ratio });
              }
            }
          }
          await press(page, '[aria-label="Clear search"]');
          assert(
            await page.$eval('[name="template-search"]', (el) => document.activeElement === el),
          );
          await page.keyboard.press("Escape");
          await page.waitForSelector(".resume-library", { hidden: true });
          assert.equal(
            await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
            w < 1024
              ? "More options"
              : draft === "empty"
                ? "Template: Classic Sidebar"
                : "Template: ATS Plain",
          );
          await context.close();
        }
  for (const theme of ["light", "dark"]) {
    const context = await browser.createBrowserContext(),
      page = await context.newPage();
    await page.setViewport({ width: 1024, height: 768, hasTouch: true });
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: theme },
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    const cdp = await page.createCDPSession();
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "forced-colors", value: "active" },
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .find((el) => el.textContent.trim() === "Start blank")
        .click(),
    );
    await page.waitForSelector('[aria-label^="Template:"]');
    await open(page, 1024);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".resume-template-preview")].every(
        (el) => (el.textContent?.length ?? 0) > 0,
      ),
    );
    await frame(page);
    await page.keyboard.press("Tab");
    await frame(page);
    assert.equal(
      await page.$eval('[name="template-search"]', (el) => document.activeElement === el),
      true,
    );
    assert.equal(
      await page.$eval(
        ".resume-library .air-field-group",
        (el) => getComputedStyle(el).outlineWidth,
      ),
      "2px",
    );
    await page.screenshot({ path: `${out}/forced-${theme}.png` });
    layouts.push({ w: 1024, h: 768, theme, state: "forced-colours-keyboard" });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/results.json`, JSON.stringify({ layouts, contrasts, errors }, null, 2));
  console.log(`${layouts.length} layouts, ${contrasts.length} contrast pairs passed`);
} finally {
  await browser.close();
}
