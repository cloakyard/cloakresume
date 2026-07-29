import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// The dedicated full-bleed app icon shares the canonical mark's
// diameter-42 glyph keyline. Render it without generator-added padding
// so launcher masks preserve the Cloakyard family proportions.
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
  images: ["public/icons/cloakresume-app-icon.svg"],
});
