/** Production Air review evidence. Run against a built local preview; data are synthetic. */

import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
const { blankResume } = await import("../src/data/blankResume.ts");
const { generateSampleResume } = await import("../src/data/sampleResume.ts");
const sample = generateSampleResume();
sample.custom.push({
  id: "review-long",
  header: "Long review section name with complete context for editing the correct original field",
  bullets: Array.from(
    { length: 30 },
    (_, i) =>
      `I built teh system for team ${i + 1} and helped teh customer achieve reliable results with careful testing.`,
  ),
});
const fixtures = [
  { id: "empty", resume: blankResume, jd: "" },
  {
    id: "short",
    resume: {
      ...blankResume,
      profile: { ...blankResume.profile, summary: "Built TypeScript tools." },
    },
    jd: "the and is",
  },
  {
    id: "populated",
    resume: sample,
    jd: "TypeScript React Kubernetes leadership cloud systems terraform accessibility",
  },
];
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
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-review/matrix";
await mkdir(out, { recursive: true });
const b = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const records = [],
  captures = [],
  errors = [];
const frame = (p) =>
  p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
try {
  for (const fixture of fixtures)
    for (const coarse of [true, false]) {
      const context = await b.createBrowserContext(),
        p = await context.newPage();
      p.on("pageerror", (e) => errors.push(String(e)));
      await p.setViewport({ width: 1440, height: 900, hasTouch: coarse });
      await p.setBypassServiceWorker(true);
      await p.evaluateOnNewDocument(
        (payload) => {
          Object.defineProperty(navigator, "serviceWorker", { value: undefined });
          localStorage.setItem("cloakresume:v1", JSON.stringify(payload));
        },
        {
          resume: fixture.resume,
          templateId: "ats-plain",
          primary: "#123456",
          jobDescription: fixture.jd,
          activeSection: "profile",
        },
      );
      await p.goto(process.env.SITE_URL || "http://127.0.0.1:8201/", { waitUntil: "networkidle0" });
      await p.evaluate(() =>
        [...document.querySelectorAll("button")]
          .find(
            (e) =>
              e.textContent.trim().startsWith("Resume editing") ||
              e.textContent.trim() === "Start blank",
          )
          .click(),
      );
      await p.waitForSelector('[aria-label="Scan résumé for ATS and writing issues"]');
      await p.click('[aria-label="Scan résumé for ATS and writing issues"]');
      await p.waitForSelector('.resume-review [role="tab"]', { timeout: 30000 });
      for (const [width, height] of sizes.filter(([w]) => w <= 1024 === coarse))
        for (const theme of ["light", "dark"])
          for (const text of [16, 32]) {
            await p.setViewport({ width, height, hasTouch: coarse });
            await p.emulateMediaFeatures([
              { name: "prefers-color-scheme", value: theme },
              { name: "prefers-reduced-motion", value: "reduce" },
            ]);
            await p.evaluate(
              (text) => (document.documentElement.style.fontSize = `${text}px`),
              text,
            );
            await frame(p);
            for (const state of ["summary", "overview", "keywords", "insights", "parse"]) {
              await p.evaluate((state) => {
                if (state === "summary") {
                  document.querySelector(".resume-review-body").scrollTop = 0;
                  document
                    .querySelector('[aria-label="Close ATS review"]')
                    .focus({ preventScroll: true });
                } else document.querySelector(`[role="tab"][id$="tab-${state}"]`).click();
              }, state);
              await frame(p);
              const info = await p.evaluate(
                ({ coarse, text, state }) => {
                  const d = document.querySelector(".resume-review"),
                    dr = d.getBoundingClientRect(),
                    body = d.querySelector(".resume-review-body"),
                    br = body.getBoundingClientRect();
                  const close = d.querySelector('[aria-label="Close ATS review"]'),
                    cr = close.getBoundingClientRect();
                  const problems = [];
                  if (
                    dr.left < -0.5 ||
                    dr.right > innerWidth + 0.5 ||
                    dr.top < -0.5 ||
                    dr.bottom > innerHeight + 0.5
                  )
                    problems.push("dialog outside viewport");
                  if (body.scrollWidth > body.clientWidth + 1)
                    problems.push("horizontal report overflow");
                  if (cr.top < dr.top || cr.bottom > dr.bottom || cr.right > dr.right)
                    problems.push("close clipped");
                  const targets = [...d.querySelectorAll("button")].filter(
                    (e) => e.getClientRects().length,
                  );
                  if (
                    targets.some((e) => e.getBoundingClientRect().height < (coarse ? 44 : 32) - 0.5)
                  )
                    problems.push("small target");
                  const texts = [
                    ...d.querySelectorAll(
                      "p,h2,h3,pre,li,.resume-review-meta,.resume-review-tab-count",
                    ),
                  ].filter((e) => e.getClientRects().length);
                  if (
                    texts.some(
                      (e) =>
                        e.getBoundingClientRect().right > br.right + 1 ||
                        e.getBoundingClientRect().left < br.left - 1,
                    )
                  )
                    problems.push("text outside report width");
                  if (
                    [...d.querySelectorAll(".resume-review-meta,.resume-review-tab-count")]
                      .filter((e) => e.getClientRects().length)
                      .some(
                        (e) => parseFloat(getComputedStyle(e).fontSize) < (12 * text) / 16 - 0.1,
                      )
                  )
                    problems.push("metadata too small");
                  const tabs = d.querySelector('[role="tablist"]');
                  const tabTop = tabs.getBoundingClientRect().top;
                  if (state !== "summary" && Math.abs(tabTop - br.top) > 5)
                    problems.push("tab anchor shifted");
                  const panel = d.querySelector('[role="tabpanel"]:not([hidden])');
                  return {
                    problems,
                    scroll: Math.round(body.scrollTop),
                    tabOffset: Math.round(tabTop - br.top),
                    report:
                      state === "summary" ? d.querySelector("h3").textContent : panel.textContent,
                    findings: panel?.querySelectorAll('[aria-label^="Jump to"]').length || 0,
                  };
                },
                { coarse, text, state },
              );
              const id = `${fixture.id}-${width}x${height}-${theme}-${text}-${state}`;
              records.push({ id, width, height, theme, text, coarse, state, ...info });
              if (info.problems.length) console.log(id, info.problems);
              if (
                (fixture.id === "populated" &&
                  [
                    [1440, 16],
                    [1280, 16],
                    [390, 16],
                    [844, 32],
                  ].some(([w, t]) => w === width && t === text)) ||
                (fixture.id === "empty" &&
                  width === 320 &&
                  text === 32 &&
                  ["summary", "keywords"].includes(state)) ||
                (fixture.id === "short" &&
                  width === 390 &&
                  text === 16 &&
                  ["summary", "keywords"].includes(state))
              ) {
                await p.screenshot({ path: `${out}/${id}.png` });
                captures.push(`${id}.png`);
              }
              // Every pane's final row must be reachable by its own scroll container.
              if (state !== "summary") {
                await p.evaluate(() => {
                  const body = document.querySelector(".resume-review-body");
                  body.scrollTop = body.scrollHeight;
                });
                await frame(p);
                const reachable = await p.evaluate(() => {
                  const body = document.querySelector(".resume-review-body");
                  const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
                  return (
                    panel.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom + 1
                  );
                });
                if (!reachable) info.problems.push("pane end unreachable");
              }
            }
          }
      await context.close();
      console.log("finished", fixture.id, coarse ? "coarse" : "fine");
    }
  await writeFile(`${out}/results.json`, JSON.stringify({ records, captures, errors }, null, 2));
  if (errors.length || records.some((r) => r.problems.length)) throw new Error("Matrix failed");
  console.log(`${records.length} layouts; ${captures.length} screenshots; no errors`);
} finally {
  await b.close();
}
