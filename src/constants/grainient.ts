// Shared config for the <Grainient /> backdrop. Anything that mounts
// the gradient (onboarding hero, future surfaces) reads from here so
// the palette and motion stay coherent across surfaces — change once,
// applied everywhere.
//
// Palette is anchored to the brand mark in public/icons/logo.svg
// (--color-primary-500 → --color-primary-700, midpoint --color-primary-600
// = #059669, the app primary). `color2` carries the brand hue so the
// ribbon weaving through the field reads as the logo. Flanking stops
// are pushed to extreme luminance — pale-on-pale in light, deep-green-
// on-near-black in dark — so `color2` stands alone as the only
// chromatic anchor.

export const GRAINIENT_LIGHT = {
  color1: "#f4faf6",
  color2: "#aecbc3",
  color3: "#ecfdf5",
} as const;

export const GRAINIENT_DARK = {
  // Toned-down brand anchor: the previous `#10b981` (emerald-500)
  // read as a vivid neon ribbon against the near-black flanks. The
  // muted forest tone here keeps the green identity legible while
  // matching the desaturated character of GRAINIENT_LIGHT.color2,
  // so the field feels like ambient atmosphere rather than a brand
  // wall.
  color1: "#0c241b",
  color2: "#236a52",
  color3: "#03130d",
} as const;

// Mode-independent motion + saturation knockdown. The brand emerald
// reads as a hint rather than a wall, and translucent panels layered
// on top still pick up enough warmth via backdrop-blur.
export const GRAINIENT_MOTION = {
  timeSpeed: 0.3,
  warpSpeed: 3,
  saturation: 1.0,
} as const;
