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
        "icons/favicon.svg",
        "icons/favicon.ico",
        "icons/apple-touch-icon.png",
        "icons/safari-pinned-tab.svg",
      ],
      manifest: {
        name: "CloakResume",
        short_name: "CloakResume",
        description:
          "A private résumé workbench for building, tailoring, reviewing, and exporting in your browser. Résumé content stays on your device.",
        theme_color: "#047857",
        // Hex equivalent of the Paper token: oklch(0.975 0.009 255).
        background_color: "#F3F7FD",
        display: "standalone",
        orientation: "any",
        scope: process.env.VITE_APP_BASE_PATH || "/",
        start_url: process.env.VITE_APP_BASE_PATH || "/",
        icons: [
          {
            src: "icons/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
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
            src: "screenshots/iPhone.png",
            sizes: "1290x2796",
            type: "image/png",
            form_factor: "narrow",
            label: "CloakResume private résumé start workbench on a phone",
          },
          {
            src: "screenshots/iPad.png",
            sizes: "2732x2048",
            type: "image/png",
            form_factor: "wide",
            label: "CloakResume résumé editor and live document proof on a tablet",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        // Social and store screenshots are presentation assets, not application-shell assets.
        globIgnores: ["icons/og-image.png", "screenshots/**"],
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
  // ES module worker output so the grammar worker can use top-level await
  // (dictionary-en ships an ESM module that decodes its data at load time).
  worker: { format: "es" },
  staged: {
    "*": "vp check --fix",
  },
  // Local agent skill packages are development references, not application source.
  // Keeping them outside product checks also avoids rewriting vendored documentation.
  fmt: { ignorePatterns: ["dist/**", ".agents/**"] },
  lint: {
    ignorePatterns: ["dist/**", ".agents/**"],
    options: { typeAware: true, typeCheck: true },
  },
});
