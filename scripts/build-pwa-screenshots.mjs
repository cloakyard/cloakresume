/** Capture real Air landing/editor states from a production build. See docs/brand-assets.md. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const url = process.env.SCREENSHOT_URL || "http://127.0.0.1:4180/";
const output = resolve(process.env.PREVIEW_OUTPUT_DIR || resolve(root, "public"), "screenshots");
const targets = [
  { name: "landing-narrow", width: 430, height: 932, deviceScaleFactor: 2 },
  { name: "editor-wide", width: 1440, height: 900, deviceScaleFactor: 1 },
];
let server, browser;
let serverLog = "";
try {
  if (!process.env.SCREENSHOT_URL) {
    // Build first. Captures must match shipped CSS and chunks, never the dev server.
    server = spawn(
      "pnpm",
      ["exec", "vp", "preview", "--host", "127.0.0.1", "--port", "4180", "--strictPort"],
      {
        cwd: root,
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      },
    );
    server.on("error", (error) => {
      serverLog += String(error);
    });
    for (const stream of [server.stdout, server.stderr])
      stream.on("data", (chunk) => {
        serverLog = (serverLog + chunk).slice(-8000);
      });
  }
  const deadline = Date.now() + 30000;
  for (;;) {
    if (server?.exitCode !== null && server?.exitCode !== undefined)
      throw new Error(`Preview exited: ${serverLog}`);
    if (
      await fetch(url)
        .then((r) => r.ok)
        .catch(() => false)
    )
      break;
    if (Date.now() > deadline) throw new Error(`Preview unavailable at ${url}: ${serverLog}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await mkdir(output, { recursive: true });
  browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  for (const target of targets)
    for (const theme of ["light", "dark"]) {
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        page.on("requestfailed", (request) =>
          errors.push(`${request.url()}: ${request.failure()?.errorText}`),
        );
        page.on("response", (response) => {
          if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
        });
        await page.setViewport({ ...target, hasTouch: target.name === "landing-narrow" });
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await page.evaluateOnNewDocument(() => {
          // Capture-only isolation: no saved personal draft, update notice or varying sample date.
          Object.defineProperty(navigator, "serviceWorker", { value: undefined });
          const NativeDate = Date;
          const timestamp = NativeDate.UTC(2026, 9, 21, 12);
          window.Date = class extends NativeDate {
            constructor(...args) {
              super(...(args.length ? args : [timestamp]));
            }
            static now() {
              return timestamp;
            }
          };
          let seed = 0xc10a2026;
          Math.random = () => {
            seed += 0x6d2b79f5;
            let value = seed;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
          };
        });
        await page.goto(url, { waitUntil: "networkidle0" });
        assert.equal(
          await page.$('script[src*="/@vite/client"]'),
          null,
          "Use a production preview",
        );
        await page.waitForSelector("#landing-title", { visible: true });
        if (target.name === "editor-wide") {
          await page.locator("::-p-aria(Load sample)").click();
          await page.waitForSelector(".resume-editor-panel .air-field", { visible: true });
          await page.waitForSelector('.resume-root[data-template-ready="true"] .resume-page', {
            visible: true,
          });
        }
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((image) => image.decode()));
          window.scrollTo(0, 0);
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
        });
        assert.deepEqual(errors, [], `${target.name}/${theme} failed`);
        const path = resolve(output, `${target.name}-${theme}.png`);
        // Font readiness can precede the final glyph paint in a fresh theme context.
        // Require stable pixels over several frames before publishing the preview.
        let previous;
        let stable = 0;
        for (let attempt = 0; attempt < 12; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const next = Buffer.from(await page.screenshot({ captureBeyondViewport: false }));
          stable = previous?.equals(next) ? stable + 1 : 0;
          previous = next;
          if (attempt >= 3 && stable >= 2) break;
        }
        assert.ok(stable >= 2, `${target.name}/${theme} pixels did not settle`);
        await writeFile(path, previous);
        console.log(
          `Wrote ${path} (${target.width * target.deviceScaleFactor}×${target.height * target.deviceScaleFactor})`,
        );
      } finally {
        await context.close();
      }
    }
} finally {
  await browser?.close();
  if (server?.pid) {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"]);
    else {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") {
          console.error("Could not close the owned preview:", error);
          process.exitCode = 1;
        }
      }
    }
  }
}
