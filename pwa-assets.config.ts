import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// The default `minimal-2023` preset bakes in 30% white-background padding
// for the maskable / apple-touch-icon and 5% transparent padding for the
// pwa-* PNGs. That produced launcher tiles where the icon sat as a small
// rounded square inside a square frame ("saves like square" on installed
// PWAs). The source `logo.svg` already has its own breathing room via the
// `scale(1.1)` transform around the shield, so we render it edge-to-edge
// with no extra padding and a transparent background — letting the
// full-bleed gradient `<rect>` fill the canvas itself.
const noPadding = {
  padding: 0,
  resizeOptions: { fit: "cover" as const, background: "transparent" },
};

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, ...noPadding },
    maskable: { ...minimal2023Preset.maskable, ...noPadding },
    apple: { ...minimal2023Preset.apple, ...noPadding },
  },
  images: ["public/icons/logo.svg"],
});
