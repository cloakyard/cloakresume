import { rename, unlink } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import sharp from "sharp";

const PROJECT_DIR = resolve(import.meta.dirname, "..");
const ICONS_DIR = resolve(PROJECT_DIR, "public", "icons");
const LAUNCHER_ICONS = [
  "pwa-64x64.png",
  "pwa-192x192.png",
  "pwa-512x512.png",
  "maskable-icon-512x512.png",
  "apple-touch-icon.png",
];

async function finalizeLauncherIcon(filename) {
  const input = resolve(ICONS_DIR, filename);
  const temporary = join(dirname(input), `.${basename(input)}.tmp.png`);

  try {
    const stats = await sharp(input).stats();
    const alpha = stats.channels[3];
    if (alpha && alpha.min !== 255) {
      throw new Error(
        `${filename} contains transparent pixels; launcher icons must stay full bleed`,
      );
    }

    await sharp(input)
      .removeAlpha()
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: false,
        force: true,
      })
      .toFile(temporary);
    await rename(temporary, input);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

await Promise.all(LAUNCHER_ICONS.map(finalizeLauncherIcon));
