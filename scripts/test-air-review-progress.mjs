/** Production Air review evidence. Run against a built local preview; data are synthetic. */
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
const { blankResume } = await import("../src/data/blankResume.ts");
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
const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakresume-air-review/edges";
await mkdir(out, { recursive: true });
const b = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const records = [],
  captures = [],
  contrasts = [];
try {
  for (const mode of ["known", "unknown", "error"]) {
    const c = await b.createBrowserContext(),
      p = await c.newPage();
    await p.setViewport({ width: 1440, height: 900, hasTouch: true });
    await p.evaluateOnNewDocument(
      ({ mode, resume }) => {
        Object.defineProperty(navigator, "serviceWorker", { value: undefined });
        localStorage.setItem("cloakresume:v1", JSON.stringify({ resume, templateId: "ats-plain" }));
        const fetch = window.fetch;
        window.fetch = async (...args) => {
          const requestUrl = args[0] instanceof Request ? args[0].url : args[0].toString();
          if (!requestUrl.includes(".wasm")) return fetch(...args);
          if (mode === "error") return new Response("Failure", { status: 503 });
          const response = await fetch(...args),
            bytes = new Uint8Array(await response.arrayBuffer()),
            split = Math.floor(bytes.length / 4),
            headers = { "content-type": "application/wasm" };
          if (mode === "known") headers["content-length"] = String(bytes.length);
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(bytes.slice(0, split));
                window.releaseReview = () => {
                  controller.enqueue(bytes.slice(split));
                  controller.close();
                };
              },
            }),
            { headers },
          );
        };
      },
      {
        mode,
        resume: {
          ...blankResume,
          profile: {
            ...blankResume.profile,
            summary:
              "Built reliable tools that help our teams deliver useful software and maintain quality for customers every day.",
          },
        },
      },
    );
    await p.goto(process.env.SITE_URL || "http://127.0.0.1:8201/", { waitUntil: "networkidle0" });
    await p.evaluate(() =>
      [...document.querySelectorAll("button")]
        .find((e) => e.textContent.startsWith("Resume editing"))
        .click(),
    );
    await p.click('[aria-label="Scan résumé for ATS and writing issues"]');
    if (mode === "error") await p.waitForSelector('.resume-review [role="alert"]');
    else {
      await p.waitForFunction(() => !!window.releaseReview);
      await p.waitForSelector('.resume-review [role="progressbar"]');
      if (mode === "known")
        await p.waitForSelector('.resume-review [role="progressbar"][aria-valuenow="25"]');
    }
    for (const [width, height] of sizes)
      for (const theme of ["light", "dark"])
        for (const text of [16, 32]) {
          await p.setViewport({ width, height, hasTouch: true });
          await p.emulateMediaFeatures([
            { name: "prefers-color-scheme", value: theme },
            { name: "prefers-reduced-motion", value: "reduce" },
          ]);
          await p.evaluate((t) => {
            document.documentElement.style.fontSize = `${t}px`;
            document.querySelector(".resume-review-body").scrollTop = 0;
          }, text);
          await p.evaluate(
            () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
          );
          const data = await p.evaluate(() => {
            const d = document.querySelector(".resume-review"),
              b = d.querySelector(".resume-review-body"),
              r = d.getBoundingClientRect(),
              bar = d.querySelector('[role="progressbar"]'),
              close = d.querySelector('[aria-label="Close ATS review"]').getBoundingClientRect();
            return {
              fits:
                r.left >= 0 &&
                r.right <= innerWidth + 1 &&
                r.top >= 0 &&
                r.bottom <= innerHeight + 1 &&
                b.scrollWidth <= b.clientWidth + 1 &&
                close.bottom <= r.bottom,
              value: bar?.getAttribute("aria-valuenow"),
              time: !!d.querySelector("time"),
              status: d.querySelector('[role="status"]').textContent,
            };
          });
          const id = `${mode}-${width}x${height}-${theme}-${text}`;
          records.push({ id, ...data });
          if (
            !data.fits ||
            data.time ||
            (mode === "known" && data.value !== "25") ||
            (mode === "unknown" && data.value !== null)
          )
            throw new Error(id + JSON.stringify(data));
          if (
            [
              [1440, 16],
              [390, 16],
              [844, 32],
            ].some(([w, t]) => w === width && t === text)
          ) {
            await p.screenshot({ path: `${out}/${id}.png` });
            captures.push(`${id}.png`);
          }
        }
    if (mode !== "error") {
      await p.evaluate(() => window.releaseReview());
      await p.waitForSelector(".resume-review time", { timeout: 30000 });
    }
    if (mode === "known") {
      for (const theme of ["light", "dark"]) {
        await p.setViewport({ width: 390, height: 844, hasTouch: true });
        await p.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await p.evaluate(() => {
          document.documentElement.style.fontSize = "16px";
          document.querySelector(".resume-review-body").scrollTop = 0;
        });
        await p.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        const values = await p.evaluate(() => {
          const el = document.querySelector(".resume-review"),
            s = getComputedStyle(el),
            canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d", { willReadFrequently: true });
          const rgb = (color) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
          };
          const lum = (rgb) =>
            rgb
              .map((v) => {
                v /= 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              })
              .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
          const bg = lum(rgb(s.backgroundColor));
          return [
            "--air-ink",
            "--air-ink-secondary",
            "--air-ink-muted",
            "--air-accent",
            "--air-success",
            "--air-warning",
            "--air-danger",
          ].map((token) => {
            const probe = document.createElement("span");
            probe.style.color = `var(${token})`;
            el.append(probe);
            const color = getComputedStyle(probe).color;
            const ink = lum(rgb(color));
            probe.remove();
            return {
              token,
              color: s.getPropertyValue(token).trim(),
              background: s.backgroundColor,
              ratio: (Math.max(ink, bg) + 0.05) / (Math.min(ink, bg) + 0.05),
            };
          });
        });
        contrasts.push({ theme, values });
        if (values.some((v) => v.ratio < 4.5))
          throw new Error("Contrast " + JSON.stringify(values));
        const client = await p.createCDPSession();
        await client.send("Emulation.setEmulatedMedia", {
          features: [
            { name: "forced-colors", value: "active" },
            { name: "prefers-color-scheme", value: theme },
            { name: "prefers-reduced-motion", value: "reduce" },
          ],
        });
        await p.focus('[aria-label="Close ATS review"]');
        await p.keyboard.press("Tab");
        await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
        const focus = await p.evaluate(() => {
          const a = document.activeElement,
            s = getComputedStyle(a);
          return {
            inside: !!a.closest(".resume-review"),
            width: s.outlineWidth,
            style: s.outlineStyle,
          };
        });
        if (!focus.inside || focus.width === "0px" || focus.style === "none")
          throw new Error("Forced focus invisible");
        records.push({ id: `forced-${theme}`, focus });
        await p.screenshot({ path: `${out}/forced-${theme}.png` });
        captures.push(`forced-${theme}.png`);
        await client.send("Emulation.setEmulatedMedia", { features: [] });
        await client.detach();
      }
    }
    await c.close();
    console.log("finished", mode);
  }
  await writeFile(`${out}/results.json`, JSON.stringify({ records, captures, contrasts }, null, 2));
  console.log(
    `${records.length} edge layouts; ${captures.length} captures; ${contrasts.length * 7} contrast pairs`,
  );
} finally {
  await b.close();
}
