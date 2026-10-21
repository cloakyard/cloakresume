import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite-plus";

declare const process: { env: Record<string, string | undefined> };

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  base: process.env.VITE_APP_BASE_PATH || "/",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // `prompt` rather than `autoUpdate` so the user gets the
      // chance to approve a service-worker rollover via the
      // ReloadPrompt UI. Auto-updates have a habit of swapping the
      // chunk graph mid-edit; the explicit prompt keeps the user in
      // control, and the prompt itself self-checks every 10 minutes.
      registerType: "prompt",
      includeAssets: [
        "cloakresume-mark.svg",
        "icons/favicon.ico",
        "icons/apple-touch-icon.png",
        "icons/safari-pinned-tab.svg",
      ],
      manifest: {
        name: "CloakResume",
        short_name: "CloakResume",
        description:
          "Build, tailor, review and export your résumé in your browser. Your draft and job description stay on your device.",
        // Install metadata starts on Air’s light page; HTML supplies both system themes.
        theme_color: "#fafbfc",
        background_color: "#fafbfc",
        display: "standalone",
        orientation: "any",
        scope: process.env.VITE_APP_BASE_PATH || "/",
        start_url: process.env.VITE_APP_BASE_PATH || "/",
        icons: [
          {
            src: "icons/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/landing-narrow-light.png",
            sizes: "860x1864",
            type: "image/png",
            form_factor: "narrow",
            label: "CloakResume landing and Start blank action on a phone, light appearance",
          },
          {
            src: "screenshots/landing-narrow-dark.png",
            sizes: "860x1864",
            type: "image/png",
            form_factor: "narrow",
            label: "CloakResume landing and Start blank action on a phone, dark appearance",
          },
          {
            src: "screenshots/editor-wide-light.png",
            sizes: "1440x900",
            type: "image/png",
            form_factor: "wide",
            label: "CloakResume editor and sample résumé preview on a desktop, light appearance",
          },
          {
            src: "screenshots/editor-wide-dark.png",
            sizes: "1440x900",
            type: "image/png",
            form_factor: "wide",
            label: "CloakResume editor and sample résumé preview on a desktop, dark appearance",
          },
        ],
      },
      workbox: {
        // Only the editor root is an app route. Missing URLs must reach the real 404.
        navigateFallbackAllowlist: [
          new RegExp(
            `^${(process.env.VITE_APP_BASE_PATH || "/").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:index\\.html)?(?:\\?.*)?$`,
          ),
        ],
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        // Presentation assets and the optional landing renderer are not offline-shell essentials.
        // The horizon retains its SVG fallback without downloading the GPU module.
        globIgnores: ["icons/og-image.png", "screenshots/**", "**/air-light-shader-*.js"],
        runtimeCaching: [
          {
            // Harper is loaded only when writing review first runs. Its production filename is
            // content-hashed, so CacheFirst preserves a completed download without making the
            // 18 MB engine part of every install's cold-cache shell.
            urlPattern: /\/assets\/harper_wasm(?:_slim)?_bg-[^/]+\.wasm$/,
            handler: "CacheFirst",
            options: {
              cacheName: "cloakresume-language-engine",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
        skipWaiting: false,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // Build the standalone recovery page with the same pinned Air CSS; no React required.
  build: { rolldownOptions: { input: { main: "index.html", notFound: "404.html" } } },
  // ES module worker output so the grammar worker can use top-level await
  // (dictionary-en ships an ESM module that decodes its data at load time).
  worker: { format: "es" },
  staged: {
    "*": "vp check --fix",
  },
  // Local agent skill packages are development references, not application source.
  // Keeping them outside product checks also avoids rewriting vendored documentation.
  fmt: { ignorePatterns: ["dist/**", ".agents/**", "docs/air/assets/**"] },
  lint: {
    ignorePatterns: ["dist/**", ".agents/**", "docs/air/assets/**"],
    options: { typeAware: true, typeCheck: true },
  },
});
