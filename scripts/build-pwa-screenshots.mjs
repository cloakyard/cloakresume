/**
 * Capture deterministic install-store screenshots from the real landing page.
 *
 * Usage:
 *   vp run generate-screenshots
 *   SCREENSHOT_URL=http://127.0.0.1:5173 vp run generate-screenshots
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(SCRIPT_DIR, "..");
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CHROME_PATH = process.env.CHROME_PATH || DEFAULT_CHROME;
const CAPTURE_URL = process.env.SCREENSHOT_URL || "http://127.0.0.1:4180/";
const ownsServer = !process.env.SCREENSHOT_URL;

const targets = [
  { name: "iPhone", width: 430, height: 932, deviceScaleFactor: 3, view: "landing" },
  { name: "iPad", width: 1366, height: 1024, deviceScaleFactor: 2, view: "editor" },
];

if (!existsSync(CHROME_PATH)) {
  console.error(`Chrome not found at ${CHROME_PATH}.`);
  console.error("Set CHROME_PATH=/absolute/path/to/chrome and re-run.");
  process.exit(1);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`CloakResume did not become ready at ${url}: ${lastError}`);
}

let devServer = null;
let serverLog = "";
if (ownsServer) {
  devServer = spawn(
    "pnpm",
    ["exec", "vp", "dev", "--host", "127.0.0.1", "--port", "4180", "--strictPort"],
    {
      cwd: PROJECT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    },
  );
  const collect = (chunk) => {
    serverLog = `${serverLog}${chunk.toString()}`.slice(-8_000);
  };
  devServer.stdout?.on("data", collect);
  devServer.stderr?.on("data", collect);
}

function stopDevServer(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.unref();
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;
  }
}

let browser = null;
try {
  await waitForServer(CAPTURE_URL);
  browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (error) => console.error(`[page error] ${error.message}`));
  await page.evaluateOnNewDocument(() => {
    // generateSampleResume intentionally uses Math.random for real users. Brand
    // captures seed it so repeated release builds reproduce the same proof.
    let state = 0xc10a2026;
    Math.random = () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    };
  });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);

  for (const target of targets) {
    await page.setViewport(target);
    await page.goto(CAPTURE_URL, { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => document.querySelector("h1")?.textContent?.includes("A complete résumé workbench"),
      { timeout: 15_000 },
    );
    if (target.view === "editor") {
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
          candidate.textContent?.includes("Load sample"),
        );
        if (!(button instanceof HTMLButtonElement)) throw new Error("Load sample action not found");
        button.click();
      });
      await page.waitForSelector(".cr-editor-panel .cr-input", { visible: true, timeout: 15_000 });
      await page.waitForSelector('.resume-root[data-template-ready="true"] .resume-page', {
        visible: true,
        timeout: 15_000,
      });
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      const style = document.createElement("style");
      style.textContent =
        "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
      document.head.append(style);
      window.scrollTo(0, 0);
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    });
    const outPath = resolve(PROJECT_DIR, "public", "screenshots", `${target.name}.png`);
    await page.screenshot({
      path: outPath,
      type: "png",
      captureBeyondViewport: false,
      omitBackground: false,
    });
    console.log(
      `Wrote ${outPath} (${target.width * target.deviceScaleFactor}x${target.height * target.deviceScaleFactor}).`,
    );
  }
} catch (error) {
  if (serverLog.trim()) console.error(`Vite+ output:\n${serverLog.trim()}`);
  throw error;
} finally {
  try {
    await browser?.close();
  } finally {
    stopDevServer(devServer);
  }
}
