/** Production entry/recovery acceptance. Run after vp run build + vp preview. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { blankResume } from "../src/data/blankResume.ts";
const output = resolve(process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-entry");
const url = process.env.SITE_URL || "http://127.0.0.1:8145/";
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const layouts = [],
  journeys = [],
  errors = [],
  requests = [];
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [1023, 768],
  [864, 900],
  [863, 900],
  [820, 1180],
  [768, 1024],
  [640, 800],
  [639, 800],
  [430, 932],
  [390, 844],
  [375, 667],
  [360, 800],
  [320, 568],
  [844, 390],
  [667, 375],
];
const draft = {
  resume: {
    profile: { name: "Air Test Person", title: "Engineer", summary: "Original local draft" },
    contact: [{ id: "mail", kind: "email", value: "test@example.com" }],
  },
  templateId: "classic-sidebar",
  primary: "#112233",
  paperSize: "letter",
  jobDescription: "Original target",
  activeSection: "profile",
  savedAt: "2026-10-18T12:00:00Z",
};
let page;
async function fresh() {
  await page?.close();
  page = await browser.newPage();
  await page.setBypassServiceWorker(true);
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(url).origin))
      requests.push(r.url());
  });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  // Suppress registration only in this deterministic geometry suite. Real PWA is a separate gate.
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "serviceWorker", { value: undefined });
  });
  await page.goto(url, { waitUntil: "networkidle0" });
}
async function click(text, scope = "") {
  const handle = await page.waitForFunction(
    (text, scope) =>
      [...document.querySelectorAll(`${scope} button`)].find(
        (el) => el.textContent.trim() === text,
      ),
    {},
    text,
    scope,
  );
  await handle.asElement().scrollIntoView();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await handle.asElement().click();
  await handle.dispose();
}

async function upload(content) {
  await page.evaluate((content) => {
    const input = document.querySelector('input[name="resume-file"]');
    const dt = new DataTransfer();
    dt.items.add(new File([content], "draft.json", { type: "application/json" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, content);
}
async function seed() {
  await page.evaluate((d) => localStorage.setItem("cloakresume:v1", JSON.stringify(d)), draft);
  await page.reload({ waitUntil: "networkidle0" });
}
async function saved() {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("cloakresume:v1"));
  });
}
async function measure(state, width, height, theme, text) {
  if (["replacement", "render-error"].includes(state))
    await page.waitForSelector(".resume-overlay .air-modal", { visible: true });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const result = await page.evaluate(() => {
    const root =
      document.querySelector(".resume-overlay .air-modal") ||
      document.querySelector(".resume-site");
    const bad = [];
    for (const el of root.querySelectorAll("a,button,summary,h1,h2,h3,p")) {
      if (el.closest("[inert]") || !el.checkVisibility() || el.matches(".resume-skip")) continue;
      const rect = el.getBoundingClientRect(),
        style = getComputedStyle(el);
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.left < -1 || rect.right > innerWidth + 1)
        bad.push(["bounds", el.textContent.trim(), rect.toJSON()]);
      if (el.matches("button,summary") && rect.height < 39.5)
        bad.push(["target", el.textContent.trim(), rect.height]);
      if (
        matchMedia("(pointer:coarse)").matches &&
        el.matches("button,summary,.resume-nav a,.resume-menu nav a,.resume-footer nav a") &&
        (rect.height < 43.5 || rect.width < 43.5)
      )
        bad.push(["coarse", el.textContent.trim(), rect.toJSON()]);
      if (el.matches("h1,h2,h3,p,button,summary")) {
        const range = document.createRange();
        range.selectNodeContents(el);
        for (const r of range.getClientRects())
          if (r.width && (r.left < rect.left - 1 || r.right > rect.right + 1))
            bad.push(["text", el.textContent.trim()]);
      }
      if (style.visibility !== "visible") continue;
    }
    const dialog = document.querySelector(".resume-overlay .air-modal"),
      r = dialog?.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > innerHeight + 1)) bad.push(["dialog-height", r.toJSON()]);
    const policy = document.querySelector(".resume-policy");
    if (policy) {
      const scroller = policy.querySelector(".resume-policy-body");
      const close = policy.querySelector('[aria-label="Close privacy policy"]');
      const before = close.getBoundingClientRect().top;
      scroller.scrollTop = scroller.scrollHeight;
      if (close.getBoundingClientRect().top !== before) bad.push(["privacy close scrolls away"]);
      scroller.scrollTop = 0;
      const prose = getComputedStyle(policy.querySelector("article p"));
      const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (
        parseFloat(prose.fontSize) !== rootSize ||
        Math.abs(parseFloat(prose.lineHeight) - rootSize * 1.6) > 0.1
      )
        bad.push(["privacy reading typography", prose.font]);
      if (innerWidth > 640 && policy.getBoundingClientRect().width > 576.1)
        bad.push(["privacy exceeds Air dialog width"]);
    }
    const body = document.querySelector(".resume-site"),
      footer = document.querySelector(".resume-footer");
    return {
      bad,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      background:
        !body || body.getBoundingClientRect().bottom >= footer.getBoundingClientRect().bottom - 1,
    };
  });
  assert.deepEqual(result.bad, [], `${state}/${width}/${theme}/${text}`);
  assert.equal(result.overflow, false);
  assert.equal(result.background, true);
  layouts.push({ state, width, height, theme, text });
}
try {
  await fresh();
  for (const [width, height] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        await page.setViewport({ width, height, isMobile: false, hasTouch: width < 1024 });
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await page.evaluate((text) => {
          document.documentElement.style.fontSize = `${text}px`;
          window.scrollTo(0, 0);
        }, text);
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        console.log(`Checking ${width}x${height} ${theme} ${text}px`);
        await measure("entry", width, height, theme, text);
        const compact = await page.$eval(
          ".resume-menu",
          (el) => getComputedStyle(el).display !== "none",
        );
        if (compact) {
          await page.click(".resume-menu summary");
          await measure("menu", width, height, theme, text);
          await page.keyboard.press("Escape");
          assert.equal(await page.$eval(".resume-menu", (el) => el.open), false);
        }
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0" }),
          page.click('a[href$="?view=privacy"]'),
        ]);
        await page.evaluate(
          (text) => (document.documentElement.style.fontSize = `${text}px`),
          text,
        );
        await measure("privacy", width, height, theme, text);
        if (text === 16 && [1440, 1280, 768, 390, 320, 844].includes(width))
          await page.screenshot({ path: resolve(output, `privacy-${width}-${theme}.png`) });
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0" }),
          page.click(".air-policy-back"),
        ]);
        await page.evaluate(
          (text) => (document.documentElement.style.fontSize = `${text}px`),
          text,
        );
        if (text === 16 && [1440, 1280, 768, 390, 320, 844].includes(width)) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: resolve(output, `entry-${width}-${theme}.png`),
            fullPage: true,
          });
        }
      }
  journeys.push("responsive home, compact menu and public privacy; explicit return link");
  await fresh();
  await page.setViewport({ width: 390, height: 844, hasTouch: true });
  await page.focus(".resume-menu summary");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "start");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Start blank");
  journeys.push("compact menu Space, Tab, anchor Enter and next action");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click('a[href$="?view=privacy"]'),
  ]);
  assert.ok(await page.$(".air-policy"));
  assert.equal(await page.$('[role="dialog"]'), null);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click(".air-policy-back"),
  ]);
  journeys.push("public privacy is a reading page with a direct home link");
  await upload("{invalid");
  await page.waitForSelector('[role="alertdialog"]');
  await page.keyboard.press("Escape");
  assert.ok(await page.$(".resume-site"));
  await click("Start blank");
  await page.waitForSelector(".cr-editor-panel");
  assert.equal((await saved()).resume.profile.name, blankResume.profile.name);
  journeys.push("invalid file recovery and blank start");
  await fresh();
  await seed();
  const original = JSON.stringify((await saved()).resume);
  for (const action of ["Start blank", "Load sample"]) {
    await click(action);
    await page.waitForSelector('[role="dialog"]');
    assert.equal(JSON.stringify((await saved()).resume), original);
    await click("Cancel", '[role="dialog"]');
    assert.equal(JSON.stringify((await saved()).resume), original);
  }
  await upload("{invalid");
  await page.waitForSelector('[role="alertdialog"]');
  assert.equal(JSON.stringify((await saved()).resume), original);
  await click("Dismiss", '[role="alertdialog"]');
  journeys.push("saved draft unchanged through blank/sample cancel and invalid import");
  const payload = {
    kind: "cloakresume.v1",
    ...draft,
    resume: { ...draft.resume, profile: { ...draft.resume.profile, name: "Imported Person" } },
  };
  await upload(JSON.stringify(payload));
  await page.waitForSelector('[role="dialog"]');
  await click("Cancel", '[role="dialog"]');
  assert.equal(JSON.stringify((await saved()).resume), original);
  await upload(JSON.stringify(payload));
  await page.waitForSelector('[role="dialog"]');
  await click("Replace draft", '[role="dialog"]');
  await page.waitForSelector(".cr-editor-panel");
  const imported = await saved();
  assert.equal(imported.resume.profile.name, "Imported Person");
  for (const key of ["primary", "paperSize", "templateId", "jobDescription"])
    assert.equal(imported[key], payload[key]);
  await page.reload({ waitUntil: "networkidle0" });
  await click("Resume editing");
  await page.waitForSelector(".cr-editor-panel");
  assert.equal((await saved()).resume.profile.name, "Imported Person");
  journeys.push("valid import cancellation/confirmation, all settings and browser restore");
  await page.reload({ waitUntil: "networkidle0" });
  await click("Load sample");
  await click("Replace draft", '[role="dialog"]');
  await page.waitForSelector(".cr-editor-panel");
  assert.notEqual((await saved()).resume.profile.name, "Imported Person");
  assert.ok((await saved()).resume.experience.length);
  journeys.push("confirmed sample enters populated editor");
  await page.reload({ waitUntil: "networkidle0" });
  await click("Start blank");
  await click("Replace draft", '[role="dialog"]');
  await page.waitForSelector(".cr-editor-panel");
  assert.equal((await saved()).resume.profile.name, blankResume.profile.name);
  journeys.push("confirmed blank replaces only after consent");
  await fresh();
  await seed();
  for (const [width, height] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        await page.setViewport({ width, height, hasTouch: width < 1024 });
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await page.evaluate((text) => {
          document.documentElement.style.fontSize = `${text}px`;
        }, text);
        await click("Start blank");
        await measure("replacement", width, height, theme, text);
        if (text === 16 && [1280, 390].includes(width))
          await page.screenshot({ path: resolve(output, `replacement-${width}-${theme}.png`) });
        await page.keyboard.press("Escape");
        await page.waitForSelector(".resume-overlay", { hidden: true });
      }
  journeys.push("replacement dialog matrix, cancellation preserves original draft");

  await fresh();
  await seed();
  await page.evaluate(() => {
    const read = (file) => Blob.prototype.text.call(file);
    File.prototype.text = function () {
      return new Promise((resolve) => {
        window.addEventListener("finish-file-read", () => read(this).then(resolve), {
          once: true,
        });
      });
    };
  });
  await upload(JSON.stringify(payload));
  await page.waitForSelector('button[aria-busy="true"]');
  assert.equal(
    await page.$$eval(".resume-start button, .resume-continue button", (buttons) =>
      buttons.every((button) => button.disabled),
    ),
    true,
  );
  await page.keyboard.press("Escape");
  assert.ok(await page.$(".resume-site"));
  await upload(JSON.stringify({ ...payload, resume: { profile: { name: "Must be ignored" } } }));
  await page.evaluate(() => window.dispatchEvent(new Event("finish-file-read")));
  await page.waitForSelector('[role="dialog"]');
  await click("Replace draft", '[role="dialog"]');
  await page.waitForSelector(".cr-editor-panel");
  assert.equal((await saved()).resume.profile.name, "Imported Person");
  journeys.push("pending file disables entry, blocks Escape and ignores duplicate reads");

  // Public privacy no longer has modal/swipe gestures. The editor retains its
  // in-place policy and must preserve the draft, inert background and focus return.
  await fresh();
  await page.setViewport({ width: 1440, height: 900 });
  await seed();
  await click("Resume editing");
  await page.waitForSelector(".cr-editor-panel");
  const beforePolicy = await saved();
  await page.click('button[aria-label="Privacy policy"]');
  await page.waitForSelector(".resume-policy");
  assert.equal(await page.$eval("#app", (el) => el.inert), true);
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  assert.equal(
    await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.$eval("#app", (el) => el.inert), false);
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("aria-label")),
    "Privacy policy",
  );
  assert.deepEqual((await saved()).resume, beforePolicy.resume);
  journeys.push("editor privacy keeps draft, inertness, focus containment and Escape return");

  await fresh();
  await seed();
  const injection = await page.evaluateOnNewDocument(() => {
    Intl.RelativeTimeFormat = class {
      constructor() {
        throw new Error("Air acceptance render failure");
      }
    };
  });
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector('[role="alertdialog"]');
  for (const [width, height] of sizes)
    for (const theme of ["light", "dark"])
      for (const text of [16, 32]) {
        await page.setViewport({ width, height, hasTouch: width < 1024 });
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await page.evaluate((text) => {
          document.documentElement.style.fontSize = `${text}px`;
        }, text);
        await measure("render-error", width, height, theme, text);
        if (text === 16 && [1280, 390].includes(width))
          await page.screenshot({ path: resolve(output, `error-${width}-${theme}.png`) });
      }
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: () => Promise.reject(new Error("Denied for test")),
    });
  });
  await click("Copy error details");
  await page.waitForFunction(() =>
    window.getSelection().toString().includes("Air acceptance render failure"),
  );
  assert.match(
    await page.$eval(".resume-dialog-actions a", (el) => el.href),
    /github.com\/cloakyard\/cloakresume\/issues\/new/,
  );
  await page.removeScriptToEvaluateOnNewDocument(injection.identifier);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), click("Go Home")]);
  await page.waitForSelector(".resume-site");
  assert.equal((await saved()).resume.profile.name, draft.resume.profile.name);
  journeys.push(
    "real render-error boundary matrix, denied clipboard fallback, home preserves saved work",
  );

  await fresh();
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.setViewport({ width: 390, height: 844 });
  await measure("forced-colours", 390, 844, "forced", 16);
  await page.screenshot({ path: resolve(output, "forced-colours.png") });
  journeys.push("forced colours");
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await page.setJavaScriptEnabled(false);
  await page.reload({ waitUntil: "networkidle0" });
  assert.match(await page.$eval("h1", (el) => el.textContent), /needs JavaScript/);
  assert.ok(await page.$('a[href="https://cloakyard.com"]'));
  journeys.push("no-JavaScript explanation and family recovery");
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(
    resolve(output, "entry.json"),
    JSON.stringify(
      { layouts, journeys, errors, requests, browser: await browser.version() },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${layouts.length} layouts, ${journeys.length} journeys; no script errors or foreign requests`,
  );
} catch (error) {
  await page.screenshot({ path: resolve(output, "failure.png"), fullPage: true });
  await writeFile(
    resolve(output, "failure.json"),
    JSON.stringify(
      {
        layouts,
        journeys,
        state: await page.evaluate(() => ({
          text: document.body.innerText,
          focus: document.activeElement?.outerHTML,
        })),
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
