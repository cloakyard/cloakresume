/** Render the Air social composition from local CSS, mark and a real editor capture. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const output = resolve(process.env.PREVIEW_OUTPUT_DIR || resolve(root, "public"), "icons");
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  // Software rasterization keeps the scaled editor image stable across GPU backends.
  args: ["--disable-gpu"],
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("requestfailed", (request) => errors.push(request.url()));
  await page.goto(pathToFileURL(resolve(root, "artwork/og.html")).href, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  assert.deepEqual(errors, []);
  await mkdir(output, { recursive: true });
  const path = resolve(output, "og-image.png");
  await page.screenshot({ path, captureBeyondViewport: false });
  console.log(`Wrote ${path} (1200×630)`);
} finally {
  await browser.close();
}
