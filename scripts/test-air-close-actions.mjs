// Closing an autosaved section retains the actual draft across reopen/reload.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-close-actions";
await mkdir(out, { recursive: true });
const results = [],
  errors = [];
for (const engine of ["chromium", "webkit"]) {
  const browser =
    engine === "webkit"
      ? await webkit.launch()
      : await chromium.launch({
          executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        });
  try {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
      [844, 390],
    ])
      for (const theme of ["light", "dark"]) {
        const p = await browser.newPage({
          viewport: { width, height },
          hasTouch: true,
          colorScheme: theme,
          reducedMotion: process.env.AIR_REDUCED_MOTION || "reduce",
          serviceWorkers: "block",
        });
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(process.env.SITE_URL || "http://127.0.0.1:8464");
        await p.getByRole("button", { name: "Start blank", exact: true }).first().click();
        const name = p.getByRole("textbox", { name: "Full name", exact: true });
        await name.fill("Air local example");
        const close = p.locator(".resume-section-close");
        assert.equal(await close.textContent(), "Close");
        assert.equal(await close.locator("svg").count(), 0);
        await close.click();
        await p
          .locator(".resume-section-nav--picker")
          .getByRole("button", { name: /^Profile/ })
          .click();
        assert.equal(await name.inputValue(), "Air local example");
        await p.waitForFunction(
          () =>
            JSON.parse(localStorage.getItem("cloakresume:v1") || "null")?.resume.profile.name ===
            "Air local example",
        );
        await p.reload();
        await p.getByRole("button", { name: /^Resume editing/ }).click();
        assert.equal(await name.inputValue(), "Air local example");
        results.push({
          engine,
          width,
          height,
          theme,
          closeRetainsDraft: true,
          reloadRetainsDraft: true,
        });
        await p.close();
      }
  } finally {
    await browser.close();
  }
}
await writeFile(`${out}/results.json`, JSON.stringify({ results, errors }, null, 2) + "\n");
assert.deepEqual(errors, []);
console.log(`${results.length} Close/reopen/autosave/reload journeys passed`);
