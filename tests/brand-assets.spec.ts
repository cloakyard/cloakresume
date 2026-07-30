/// <reference types="node" />

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vite-plus/test";

const projectRoot = new URL("../", import.meta.url);

async function source(path: string) {
  return readFile(new URL(path, projectRoot), "utf8");
}

async function pngSize(path: string) {
  const image = await readFile(new URL(path, projectRoot));
  const signature = image.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || image.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${path} is not a valid PNG with an IHDR header`);
  }
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

async function pngColourType(path: string) {
  const image = await readFile(new URL(path, projectRoot));
  const signature = image.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || image.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${path} is not a valid PNG with an IHDR header`);
  }
  return image[25];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function metaContent(html: string, key: "name" | "property", value: string) {
  const tag = html
    .match(/<meta\b[^>]*>/gi)
    ?.find((candidate) =>
      new RegExp(`\\b${key}=["']${escapeRegExp(value)}["']`, "i").test(candidate),
    );
  if (!tag) throw new Error(`Missing ${key}=${value} metadata`);
  const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
  if (content === undefined) throw new Error(`Missing content for ${key}=${value}`);
  return content;
}

function manifestScreenshot(config: string, filename: string) {
  const escapedFilename = escapeRegExp(filename);
  const match = config.match(
    new RegExp(
      `\\{\\s*src:\\s*["']screenshots/${escapedFilename}["'],[\\s\\S]*?sizes:\\s*["'](\\d+x\\d+)["'],[\\s\\S]*?type:\\s*["']image/png["'],[\\s\\S]*?form_factor:\\s*["'](narrow|wide)["'],[\\s\\S]*?label:\\s*["']([^"']+)["']`,
    ),
  );
  if (!match) throw new Error(`Missing complete manifest screenshot entry for ${filename}`);
  return { sizes: match[1], formFactor: match[2], label: match[3] };
}

function captureTarget(script: string, name: string) {
  const escapedName = escapeRegExp(name);
  const match = script.match(
    new RegExp(
      `name:\\s*["']${escapedName}["'],\\s*width:\\s*(\\d+),\\s*height:\\s*(\\d+),\\s*deviceScaleFactor:\\s*(\\d+)`,
    ),
  );
  if (!match) throw new Error(`Missing ${name} capture target`);
  const [, width, height, deviceScaleFactor] = match.map(Number);
  return {
    width,
    height,
    deviceScaleFactor,
    output: `${width * deviceScaleFactor}x${height * deviceScaleFactor}`,
  };
}

describe("brand, social, and install asset contracts", () => {
  it("keeps Open Graph and Twitter metadata on one canonical 1200x630 image", async () => {
    const html = await source("index.html");
    const canonicalImage = "https://resume.cloakyard.com/icons/og-image.png";

    expect(metaContent(html, "property", "og:image")).toBe(canonicalImage);
    expect(metaContent(html, "property", "og:image:type")).toBe("image/png");
    expect(metaContent(html, "property", "og:image:width")).toBe("1200");
    expect(metaContent(html, "property", "og:image:height")).toBe("630");
    expect(metaContent(html, "property", "og:image:alt")).toMatch(/landing page/i);
    expect(metaContent(html, "name", "twitter:card")).toBe("summary_large_image");
    expect(metaContent(html, "name", "twitter:image")).toBe(canonicalImage);
    expect(metaContent(html, "name", "twitter:image:alt")).toBe(
      metaContent(html, "property", "og:image:alt"),
    );
  });

  it("keeps package commands and capture scripts on the documented live-page workflow", async () => {
    const [packageSource, iconScript, ogScript, screenshotScript, brandDocs, readme] =
      await Promise.all([
        source("package.json"),
        source("scripts/finalize-pwa-icons.mjs"),
        source("scripts/build-og-image.mjs"),
        source("scripts/build-pwa-screenshots.mjs"),
        source("docs/brand-assets.md"),
        source("README.md"),
      ]);
    const pkg = JSON.parse(packageSource) as { scripts: Record<string, string> };

    expect(pkg.scripts["generate-icons"]).toContain("node scripts/finalize-pwa-icons.mjs");
    expect(pkg.scripts["generate-og"]).toBe("node scripts/build-og-image.mjs");
    expect(pkg.scripts["generate-screenshots"]).toBe("node scripts/build-pwa-screenshots.mjs");
    expect(iconScript).toContain("alpha.min !== 255");
    expect(iconScript).toContain(".removeAlpha()");
    expect(ogScript).toContain(
      'const OUT_PATH = resolve(PROJECT_DIR, "public", "icons", "og-image.png")',
    );
    expect(ogScript).toContain("width: 1200, height: 630, deviceScaleFactor: 1");
    expect(ogScript).toContain("A complete résumé workbench");
    expect(screenshotScript).toContain("A complete résumé workbench");
    expect(screenshotScript).toContain("evaluateOnNewDocument");
    expect(screenshotScript).toContain("Math.random = () =>");
    expect(screenshotScript).toContain('.resume-root[data-template-ready="true"] .resume-page');
    expect(brandDocs).toContain("capture-only random seed");
    for (const command of [
      "vp run generate-icons",
      "vp run generate-og",
      "vp run generate-screenshots",
    ]) {
      expect(brandDocs).toContain(command);
      expect(readme).toContain(command);
    }
    expect(readme).toContain('src="public/screenshots/iPad.png"');
    expect(readme).toContain("[docs/brand-assets.md](docs/brand-assets.md)");
    expect(readme).not.toContain("github.com/sumitsahoo/cloakresume");
  });

  it("uses one named Cloakyard-family mark as the canonical brand source", async () => {
    const [
      mark,
      favicon,
      appIcon,
      legacyLogo,
      pinnedTab,
      brandLogo,
      html,
      notFound,
      pwaAssets,
      viteConfig,
      brandDocs,
    ] = await Promise.all([
      source("public/cloakresume-mark.svg"),
      source("public/icons/favicon.svg"),
      source("public/icons/cloakresume-app-icon.svg"),
      source("public/icons/logo.svg"),
      source("public/icons/safari-pinned-tab.svg"),
      source("src/components/BrandLogo.tsx"),
      source("index.html"),
      source("public/404.html"),
      source("pwa-assets.config.ts"),
      source("vite.config.ts"),
      source("docs/brand-assets.md"),
    ]);

    for (const svg of [mark, favicon, appIcon, legacyLogo]) {
      expect(svg).toContain('viewBox="0 0 64 64"');
      expect(svg).toContain('data-glyph-keyline="42"');
      expect(svg).toContain('stroke-width="3"');
      expect(svg).toContain("#047857");
    }
    for (const svg of [mark, favicon]) {
      expect(svg).toContain('data-logo-spec="cloakyard-mark-v1"');
    }
    for (const svg of [appIcon, legacyLogo]) {
      expect(svg).toContain('data-logo-spec="cloakyard-app-icon-v1"');
    }
    expect(appIcon).toContain('data-maskable-safe-zone="circle(32 32 25.6)"');
    for (const svg of [mark, favicon, appIcon, legacyLogo, pinnedTab]) {
      expect(svg).toContain("M24.4 37.5h15.2");
      expect(svg).toContain("M25.2 42h9.8");
      expect(svg).not.toContain("M23.9 44");
    }
    expect(mark).toContain('aria-labelledby="cloakresume-mark-title"');
    expect(brandLogo).toContain('src="/cloakresume-mark.svg"');
    expect(html).toContain('href="/cloakresume-mark.svg"');
    expect(notFound.match(/src="\/cloakresume-mark\.svg"/g)).toHaveLength(2);
    expect(pwaAssets).toContain('images: ["public/icons/cloakresume-app-icon.svg"]');
    expect(pwaAssets).toContain("palette: false");
    expect(pwaAssets).toContain("adaptiveFiltering: true");
    expect(viteConfig).toContain('"cloakresume-mark.svg"');
    expect(brandDocs).toContain("`public/cloakresume-mark.svg`");
    expect(brandDocs).toContain("`public/icons/cloakresume-app-icon.svg`");
  });

  it("keeps the Android launcher glyph inside the complete maskable safe zone", async () => {
    const appIcon = await source("public/icons/cloakresume-app-icon.svg");
    const safeZone = { x: 32, y: 32, radius: 25.6 };
    const glyphExtrema = [
      [32, 10.6],
      [49.7, 18.7],
      [49.7, 32.3],
      [32, 54.2],
      [14.3, 32.3],
      [14.3, 18.7],
    ] as const;

    expect(appIcon).toContain(
      "M32 12.1 48.2 18.7v13.6c0 8.6-5.4 15.2-16.2 20.4-10.8-5.2-16.2-11.8-16.2-20.4V18.7L32 12.1Z",
    );
    for (const [x, y] of glyphExtrema) {
      expect(Math.hypot(x - safeZone.x, y - safeZone.y)).toBeLessThan(safeZone.radius);
    }
  });

  it("keeps PWA manifest declarations, generators, and documentation in agreement", async () => {
    const [config, html, screenshotScript, brandDocs] = await Promise.all([
      source("vite.config.ts"),
      source("index.html"),
      source("scripts/build-pwa-screenshots.mjs"),
      source("docs/brand-assets.md"),
    ]);
    const expected = {
      iPhone: { sizes: "1290x2796", formFactor: "narrow", label: /start workbench/i },
      iPad: { sizes: "2732x2048", formFactor: "wide", label: /editor.*document proof/i },
    } as const;

    expect(config).toContain('orientation: "any"');
    expect(config).toContain('globIgnores: ["icons/og-image.png", "screenshots/**"]');
    for (const size of [64, 192, 512]) {
      expect(config).toMatch(
        new RegExp(
          `src:\\s*["']icons/pwa-${size}x${size}\\.png["'][\\s\\S]*?sizes:\\s*["']${size}x${size}["'][\\s\\S]*?purpose:\\s*["']any["']`,
        ),
      );
    }
    expect(config).toMatch(
      /src:\s*["']icons\/maskable-icon-512x512\.png["'][\s\S]*?sizes:\s*["']512x512["'][\s\S]*?purpose:\s*["']maskable["']/,
    );
    expect(html).toMatch(
      /<link rel="apple-touch-icon" sizes="180x180" href="\/icons\/apple-touch-icon\.png" \/>/,
    );
    for (const [name, expectation] of Object.entries(expected)) {
      const manifest = manifestScreenshot(config, `${name}.png`);
      const capture = captureTarget(screenshotScript, name);
      expect(manifest.sizes).toBe(expectation.sizes);
      expect(manifest.formFactor).toBe(expectation.formFactor);
      expect(manifest.label).toMatch(expectation.label);
      expect(capture.output).toBe(expectation.sizes);
      expect(brandDocs).toContain(`public/screenshots/${name}.png`);
      expect(brandDocs).toContain(expectation.sizes.replace("x", "×"));
    }
  });

  it("keeps template count metadata equal to the live registry", async () => {
    const [{ TEMPLATES }, { TEMPLATE_COUNT }, landing, html, readme] = await Promise.all([
      import("../src/templates/index.ts"),
      import("../src/templates/meta.ts"),
      source("src/components/CloakWorkbenchLanding.tsx"),
      source("index.html"),
      source("README.md"),
    ]);
    const registryCount = Object.keys(TEMPLATES).length;

    expect(TEMPLATE_COUNT).toBe(registryCount);
    expect(landing).toContain('import { TEMPLATE_COUNT } from "../templates/meta.ts"');
    expect(html).toContain(`"${registryCount} Résumé Templates"`);
    expect(readme).toContain(`choose from ${registryCount} live résumé layouts`);
  });

  it("ships the exact declared OG, install icon, and PWA screenshot dimensions", async () => {
    const [og, pwa64, pwa192, pwa512, maskable, apple, phone, tablet] = await Promise.all([
      pngSize("public/icons/og-image.png"),
      pngSize("public/icons/pwa-64x64.png"),
      pngSize("public/icons/pwa-192x192.png"),
      pngSize("public/icons/pwa-512x512.png"),
      pngSize("public/icons/maskable-icon-512x512.png"),
      pngSize("public/icons/apple-touch-icon.png"),
      pngSize("public/screenshots/iPhone.png"),
      pngSize("public/screenshots/iPad.png"),
    ]);

    expect(og).toEqual({ width: 1200, height: 630 });
    expect(pwa64).toEqual({ width: 64, height: 64 });
    expect(pwa192).toEqual({ width: 192, height: 192 });
    expect(pwa512).toEqual({ width: 512, height: 512 });
    expect(maskable).toEqual({ width: 512, height: 512 });
    expect(apple).toEqual({ width: 180, height: 180 });
    expect(phone).toEqual({ width: 1290, height: 2796 });
    expect(tablet).toEqual({ width: 2732, height: 2048 });
  });

  it("keeps launcher PNGs in full-colour RGB instead of a dithered indexed palette", async () => {
    for (const path of [
      "public/icons/pwa-64x64.png",
      "public/icons/pwa-192x192.png",
      "public/icons/pwa-512x512.png",
      "public/icons/maskable-icon-512x512.png",
      "public/icons/apple-touch-icon.png",
    ]) {
      expect(await pngColourType(path)).toBe(2);
    }
  });
});
