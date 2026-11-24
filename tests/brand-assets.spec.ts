/// <reference types="node" />

import { readFile } from "node:fs/promises";
import sharp from "sharp";
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
    const social = JSON.parse(await source("artwork/social.json")) as { imagePath: string };
    const canonicalImage = new URL(social.imagePath, "https://resume.cloakyard.com/").href;

    expect(metaContent(html, "property", "og:image")).toBe(canonicalImage);
    expect(metaContent(html, "property", "og:image:type")).toBe("image/png");
    expect(metaContent(html, "property", "og:image:width")).toBe("1200");
    expect(metaContent(html, "property", "og:image:height")).toBe("630");
    expect(metaContent(html, "property", "og:image:alt")).toMatch(
      /white résumé.*green career timeline/i,
    );
    expect(metaContent(html, "name", "twitter:card")).toBe("summary_large_image");
    expect(metaContent(html, "name", "twitter:image")).toBe(canonicalImage);
    expect(metaContent(html, "name", "twitter:image:alt")).toBe(
      metaContent(html, "property", "og:image:alt"),
    );
  });

  it("keeps preview generation documented and README sources theme-aware", async () => {
    const [packageSource, artwork, brandDocs, readme] = await Promise.all([
      source("package.json"),
      source("docs/air/social.html"),
      source("docs/brand-assets.md"),
      source("README.md"),
    ]);
    const pkg = JSON.parse(packageSource) as { scripts: Record<string, string> };
    for (const command of ["generate-icons", "generate-og", "generate-screenshots"]) {
      expect(pkg.scripts[command]).toBeTruthy();
      expect(brandDocs).toContain(`vp run ${command}`);
      expect(readme).toContain(`vp run ${command}`);
    }
    expect(artwork).toContain("__AIR_CSS__");
    expect(artwork).toContain('width="480" height="328" alt="__ART_ALT__"');
    expect(brandDocs).toContain("artwork/social.json");
    expect(readme).toContain(
      'media="(prefers-color-scheme: dark)" srcset="public/screenshots/editor-wide-dark.png"',
    );
    expect(readme).toContain('src="public/screenshots/editor-wide-light.png"');
    expect(readme).not.toMatch(/iPad\.png|iPhone\.png|github\.com\/sumitsahoo\/cloakresume/);
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
      source("404.html"),
      source("pwa-assets.config.ts"),
      source("vite.config.ts"),
      source("docs/brand-assets.md"),
    ]);

    expect(mark).toContain('viewBox="0 0 64 64"');
    expect(favicon).toContain('viewBox="0 0 16 16"');
    for (const svg of [mark, favicon]) expect(svg).toContain('data-logo-spec="cloakyard-mark-v2"');
    expect(appIcon).toContain('data-logo-spec="cloakyard-app-icon-v2"');
    expect(legacyLogo).toBe(appIcon);
    expect(appIcon).toContain('data-maskable-safe-zone="circle(32 32 25.6)"');
    for (const svg of [mark, favicon, appIcon, pinnedTab]) {
      expect(svg.match(/href="#index-tab"/g)).toHaveLength(3);
    }
    expect(mark).toContain('id="profile-cut"');
    expect(brandLogo).toContain("src={`${import.meta.env.BASE_URL}cloakresume-mark.svg`}");
    expect(html).toContain('href="/icons/favicon.svg"');
    expect(notFound.match(/src="\/cloakresume-mark\.svg"/g)).toHaveLength(1);
    expect(pwaAssets).toContain('images: ["public/icons/cloakresume-app-icon.svg"]');
    expect(pwaAssets).toContain("palette: false");
    expect(pwaAssets).toContain("adaptiveFiltering: true");
    expect(viteConfig).toContain('"cloakresume-mark.svg"');
    expect(brandDocs).toContain("`public/cloakresume-mark.svg`");
    expect(brandDocs).toContain("`public/icons/cloakresume-app-icon.svg`");
  });

  it("keeps the Android launcher glyph inside the complete maskable safe zone", async () => {
    const appIcon = await source("public/icons/cloakresume-app-icon.svg");
    const backdrop = appIcon.replace(/<g id="artwork"[\s\S]*<\/g>\s*<\/svg>/, "</svg>");
    expect(backdrop).not.toBe(appIcon);
    const size = 512;
    const [full, background] = await Promise.all(
      [appIcon, backdrop].map((svg) =>
        sharp(Buffer.from(svg)).resize(size, size).removeAlpha().raw().toBuffer(),
      ),
    );
    let maxRadius = 0;
    for (let offset = 0; offset < full.length; offset += 3) {
      const changed = [0, 1, 2].some(
        (c) => Math.abs(full[offset + c] - background[offset + c]) > 1,
      );
      if (!changed) continue;
      const pixel = offset / 3;
      maxRadius = Math.max(
        maxRadius,
        Math.hypot((pixel % size) + 0.5 - size / 2, Math.floor(pixel / size) + 0.5 - size / 2),
      );
    }
    expect(maxRadius).toBeGreaterThan(size / 4);
    expect(maxRadius).toBeLessThanOrEqual(size * 0.4);
  });

  it("keeps PWA manifest declarations, generators, and documentation in agreement", async () => {
    const [config, html, screenshotScript, brandDocs] = await Promise.all([
      source("vite.config.ts"),
      source("index.html"),
      source("scripts/build-pwa-screenshots.mjs"),
      source("docs/brand-assets.md"),
    ]);
    const expected = {
      "landing-narrow": { sizes: "860x1864", formFactor: "narrow", label: /landing.*Start blank/i },
      "editor-wide": {
        sizes: "1440x900",
        formFactor: "wide",
        label: /editor.*sample résumé preview/i,
      },
    } as const;

    expect(config).toContain('orientation: "any"');
    expect(config).toContain('theme_color: "#fafbfc"');
    expect(config).toContain('background_color: "#fafbfc"');
    expect(config).not.toMatch(/iPad\.png|iPhone\.png|start workbench/);
    const ignoredAssets = config.match(/globIgnores:\s*\[([^\]]+)\]/)?.[1];
    for (const path of ["icons/og-image.png", "screenshots/**"]) {
      expect(ignoredAssets).toContain(JSON.stringify(path));
    }
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
      const capture = captureTarget(screenshotScript, name);
      expect(capture.output).toBe(expectation.sizes);
      for (const theme of ["light", "dark"]) {
        const filename = `${name}-${theme}.png`;
        const manifest = manifestScreenshot(config, filename);
        const dimensions = await pngSize(`public/screenshots/${filename}`);
        expect(manifest.sizes).toBe(`${dimensions.width}x${dimensions.height}`);
        expect(manifest.sizes).toBe(expectation.sizes);
        expect(manifest.formFactor).toBe(expectation.formFactor);
        expect(manifest.label).toMatch(expectation.label);
        expect(manifest.label).toContain(`${theme} appearance`);
        expect(brandDocs).toContain(`public/screenshots/${filename}`);
        expect(brandDocs).toContain(expectation.sizes.replace("x", "×"));
      }
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
    const [og, pwa64, pwa192, pwa512, maskable, apple] = await Promise.all([
      pngSize("public/icons/og-image.png"),
      pngSize("public/icons/pwa-64x64.png"),
      pngSize("public/icons/pwa-192x192.png"),
      pngSize("public/icons/pwa-512x512.png"),
      pngSize("public/icons/maskable-icon-512x512.png"),
      pngSize("public/icons/apple-touch-icon.png"),
    ]);

    expect(og).toEqual({ width: 1200, height: 630 });
    expect(pwa64).toEqual({ width: 64, height: 64 });
    expect(pwa192).toEqual({ width: 192, height: 192 });
    expect(pwa512).toEqual({ width: 512, height: 512 });
    expect(maskable).toEqual({ width: 512, height: 512 });
    expect(apple).toEqual({ width: 180, height: 180 });
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
