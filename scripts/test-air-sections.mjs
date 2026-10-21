/** Complete content-section composition; shared widgets retain their separate feature gates. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-sections/layouts";
const url = process.env.SITE_URL || "http://127.0.0.1:8191/";
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
].filter((name) => !process.env.AIR_SECTION || name === process.env.AIR_SECTION);
const prose =
  "Built **accessible** systems with careful testing, clear documentation and dependable local workflows. ";
const populated = {
  ...blankResume,
  profile: {
    name: "Amara Schmidt",
    title: "Design Engineer",
    summary: prose.repeat(4),
    logoIconName: "ImportedUnknownMark",
  },
  contact: [
    {
      id: "c",
      kind: "website",
      value: "https://example.com/a-long-path-for-an-imported-portfolio",
    },
  ],
  experience: [
    {
      id: "e",
      title: "Senior design engineer",
      company: "Independent product studio",
      location: "Remote",
      start: "Sep 2020",
      end: "Present",
      bullets: [prose, prose],
    },
  ],
  skills: [
    {
      id: "s",
      label: "Engineering and design",
      iconName: "ImportedSkillIcon",
      items: "TypeScript, React, Accessibility, Product strategy, Documentation",
    },
  ],
  projects: [
    {
      id: "p",
      name: "Accessible local workspace",
      description: prose.repeat(2),
      roles: [prose],
      stack: ["TypeScript", "React", "Local processing"],
    },
  ],
  education: [
    {
      id: "ed",
      degree: "Master of Design Engineering",
      school: "Independent University",
      location: "Berlin",
      start: "2014",
      end: "2018",
      detail: "With distinction",
    },
  ],
  certifications: [
    {
      id: "ct",
      name: "Professional qualification",
      issuer: "Independent institute",
      year: "Renewed October 2026",
      url: "https://example.com/credentials/verification",
    },
  ],
  awards: [
    {
      id: "a",
      title: "Recognition for accessible products",
      year: "2020–2026 (ongoing)",
      detail: prose,
    },
  ],
  languages: [{ id: "l", name: "English", level: "Native · Professional (imported)" }],
  interestsLabel: "Outside work",
  interests: ["Writing", "Running", "Reading"],
  toolsLabel: "Daily toolkit",
  tools: ["Git", "Figma", "Linux"],
  quickStats: [{ id: "q", value: "More than fifteen", label: "years of experience" }],
  extras: [{ id: "x", label: "Work authorization", value: "No sponsorship required" }],
  custom: [{ id: "cu", header: "Community and volunteering", bullets: [prose, prose] }],
};
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
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
  });
async function press(page, selector) {
  const el = await page.waitForSelector(selector, { visible: true });
  await el.scrollIntoView();
  await frame(page);
  await el.click();
  await el.dispose();
  await frame(page);
}
async function section(page, name, w) {
  if (w < 1024) await press(page, ".resume-section-close");
  const nav = await page.waitForFunction(
    (name) =>
      [...document.querySelectorAll(".resume-section-link")].find(
        (el) =>
          el.ariaLabel === name ||
          el.querySelector(".resume-section-copy > span")?.textContent === name,
      ),
    {},
    name,
  );
  await nav.asElement().scrollIntoView();
  await nav.asElement().click();
  await nav.dispose();
  await frame(page);
}
function luminance(rgb) {
  const channels = rgb
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map((v) => {
      const x = Number(v) / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
try {
  for (const [w, h] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32])
        for (const state of ["empty", "populated"]) {
          const context = await browser.createBrowserContext(),
            page = await context.newPage();
          await page.setViewport({ width: w, height: h, hasTouch: w <= 1100 });
          await page.setBypassServiceWorker(true);
          await page.emulateMediaFeatures([
            { name: "prefers-color-scheme", value: theme },
            { name: "prefers-reduced-motion", value: "reduce" },
          ]);
          page.on("pageerror", (e) => errors.push(String(e)));
          await page.evaluateOnNewDocument(
            (f) => {
              Object.defineProperty(navigator, "serviceWorker", { value: undefined });
              localStorage.setItem("cloakresume:v1", JSON.stringify(f));
            },
            {
              resume: state === "populated" ? populated : blankResume,
              activeSection: "profile",
              templateId: "ats-plain",
              primary: "#123456",
              paperSize: "a4",
              jobDescription: state === "populated" ? prose.repeat(4) : "",
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
          await frame(page);
          for (const name of sections) {
            if (name !== "Profile") await section(page, name, w);
            const data = await page.evaluate(() => {
              const failures = [],
                body = document.querySelector(".resume-section-body"),
                bounds = body.getBoundingClientRect(),
                coarse = matchMedia("(pointer:coarse)").matches;
              const controls = [
                ...body.querySelectorAll('button,input:not([type="file"]),textarea,select'),
              ].filter((el) => el.offsetWidth && !el.closest('[aria-hidden="true"]'));
              for (const el of controls) {
                const box = el.getBoundingClientRect(),
                  css = getComputedStyle(el),
                  label = el.ariaLabel || el.name || el.textContent.trim();
                if (box.left < bounds.left - 1 || box.right > bounds.right + 1)
                  failures.push(`control outside panel: ${label}`);
                if (el.type !== "checkbox" && box.height < (coarse ? 44 : 40) - 0.5)
                  failures.push(`target height: ${label} ${box.height}`);
                if (el.tagName === "BUTTON" && box.width < (coarse ? 44 : 40) - 0.5)
                  failures.push(`target width: ${label}`);
                if (el.matches("input:not([type=checkbox]),textarea,select")) {
                  if (!el.labels?.length && !el.ariaLabel && !el.getAttribute("aria-labelledby"))
                    failures.push(`missing name: ${label}`);
                  if (css.borderRadius !== "10px" || css.boxShadow !== "none")
                    failures.push(`field shell: ${label}`);
                  if (!css.fontFamily.includes("-apple-system") || css.textTransform !== "none")
                    failures.push(`field typography: ${label}`);
                  if (parseFloat(css.fontSize) < (coarse || innerWidth <= 640 ? 16 : 14))
                    failures.push(`field text: ${label}`);
                }
              }
              for (const el of body.querySelectorAll(
                ".air-label,.air-help,.resume-group-title,.resume-section-note",
              )) {
                const css = getComputedStyle(el);
                if (
                  css.textTransform !== "none" ||
                  !css.fontFamily.includes("-apple-system") ||
                  parseFloat(css.fontSize) < 12
                )
                  failures.push(`copy typography: ${el.textContent}`);
              }
              const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
              while (walker.nextNode()) {
                const node = walker.currentNode,
                  parent = node.parentElement;
                if (
                  !node.textContent.trim() ||
                  parent.closest('textarea,input,select,svg,[aria-hidden="true"],.sr-only') ||
                  !parent.getClientRects().length
                )
                  continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                if (
                  [...range.getClientRects()].some(
                    (r) => r.left < bounds.left - 1 || r.right > bounds.right + 1,
                  )
                )
                  failures.push(`text outside panel: ${node.textContent.trim()}`);
              }
              for (const el of body.querySelectorAll(".resume-field-pair")) {
                const children = [...el.children].map((child) => child.getBoundingClientRect());
                if (
                  children.some(
                    (r) =>
                      r.width <
                      Math.min(
                        el.clientWidth,
                        12 * parseFloat(getComputedStyle(document.documentElement).fontSize),
                      ) -
                        1,
                  )
                )
                  failures.push("paired field shrunk below writing measure");
              }
              if (document.documentElement.scrollWidth > innerWidth) failures.push("page overflow");
              if (body.scrollWidth > body.clientWidth + 1)
                failures.push("panel horizontal overflow");
              return { failures, controls: controls.length, coarse };
            });
            assert.deepEqual(
              data.failures,
              [],
              JSON.stringify({ w, h, theme, text, state, name, ...data }),
            );
            layouts.push({ w, h, theme, text, state, section: name, ...data });
            if (
              (text === 16 &&
                ((w === 1440 && theme === "light") || (w === 390 && theme === "dark"))) ||
              (state === "populated" &&
                name === "Target JD" &&
                ((w === 768 && text === 32) ||
                  (w === 1280 && text === 16) ||
                  (w === 844 && text === 32)))
            ) {
              await page.$eval(".resume-section-body", (el) => {
                el.scrollTop = 0;
              });
              await frame(page);
              await page.screenshot({
                path: `${out}/${w}-${h}-${theme}-${text}-${state}-${name.replaceAll(/[^a-z0-9]+/gi, "-")}.png`,
              });
            }
            if (
              state === "populated" &&
              w === 1440 &&
              text === 16 &&
              ["Quick stats", "Target JD", "Profile"].includes(name)
            ) {
              const pairs = await page.evaluate(() => {
                const bg = getComputedStyle(
                  document.querySelector(".cr-editor-panel"),
                ).backgroundColor;
                return [
                  ...document.querySelectorAll(
                    ".resume-section-body .air-help,.resume-section-note,.resume-section-note strong,.resume-group-title,.resume-section-body .air-button--primary",
                  ),
                ].map((el) => {
                  const css = getComputedStyle(el);
                  return {
                    name: el.textContent.trim(),
                    foreground: css.color,
                    background: el.matches("button") ? css.backgroundColor : bg,
                  };
                });
              });
              for (const pair of pairs) {
                const a = luminance(pair.foreground),
                  b = luminance(pair.background),
                  ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
                assert.ok(ratio >= 4.5, JSON.stringify({ theme, ...pair, ratio }));
                contrasts.push({ theme, ...pair, ratio });
              }
            }
          }
          // Forced-colour / non-reduced state uses the same live section, no injected component.
          if (w === 1024 && text === 32 && state === "populated") {
            const cdp = await page.createCDPSession();
            await cdp.send("Emulation.setEmulatedMedia", {
              features: [
                { name: "forced-colors", value: "active" },
                { name: "prefers-reduced-motion", value: "no-preference" },
              ],
            });
            await page.focus('textarea[name="target-job-description"]');
            await page.keyboard.press("Tab");
            const focus = await page.$eval(".resume-section-body .air-button--primary", (el) => ({
              focused: el === document.activeElement,
              outline: getComputedStyle(el).outlineStyle,
              height: el.getBoundingClientRect().height,
            }));
            assert.ok(
              focus.focused && focus.outline !== "none" && focus.height >= 44,
              JSON.stringify(focus),
            );
            layouts.push({
              w,
              h,
              theme,
              text,
              state,
              section: "Target JD",
              forcedColours: true,
              ...focus,
            });
            await page.screenshot({ path: `${out}/forced-colours-${theme}.png` });
          }
          await context.close();
        }
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/results.json`,
    JSON.stringify({ url, layouts, contrasts, errors }, null, 2),
  );
  console.log(
    `${layouts.length} content-section layouts; ${contrasts.length} contrast pairs; no page errors. Evidence: ${out}`,
  );
} finally {
  await browser.close();
}
