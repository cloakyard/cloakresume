/**
 * Capture the real CloakResume landing page as the Open Graph card.
 *
 * Keeping the product UI as the source prevents a second social-card design
 * system from drifting away from the live logo, typography, spacing, and copy.
 *
 * Usage:
 *   vp run generate-og
 *   OG_URL=http://127.0.0.1:5173 vp run generate-og
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(SCRIPT_DIR, "..");
const OUT_PATH = resolve(PROJECT_DIR, "public", "icons", "og-image.png");
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CHROME_PATH = process.env.CHROME_PATH || DEFAULT_CHROME;
const CAPTURE_URL = process.env.OG_URL || "http://127.0.0.1:4179/";
const ownsServer = !process.env.OG_URL;

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
    ["exec", "vp", "dev", "--host", "127.0.0.1", "--port", "4179", "--strictPort"],
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
  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  page.on("pageerror", (error) => console.error(`[page error] ${error.message}`));
  page.on("requestfailed", (request) =>
    console.error(
      `[request failed] ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`,
    ),
  );
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);

  await page.goto(CAPTURE_URL, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => document.querySelector("h1")?.textContent?.includes("A complete résumé workbench"),
    { timeout: 15_000 },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    const style = document.createElement("style");
    style.textContent =
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
    document.head.append(style);
    window.scrollTo(0, 0);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });

  await page.screenshot({
    path: OUT_PATH,
    type: "png",
    captureBeyondViewport: false,
    omitBackground: false,
  });
  console.log(`Wrote ${OUT_PATH} from ${CAPTURE_URL} (1200x630).`);
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
