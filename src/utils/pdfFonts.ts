/**
 * Canvas's font shorthand cannot express OpenType numeric variants or feature
 * settings. html2canvas measures text in the DOM, then paints it with Canvas;
 * losing those features changes advances and can paint a digit over its suffix.
 * Put the same features on export-only font faces so both engines shape alike.
 */
const NUMERIC_FEATURES: Record<string, string> = {
  "lining-nums": "lnum",
  "oldstyle-nums": "onum",
  "proportional-nums": "pnum",
  "tabular-nums": "tnum",
  "diagonal-fractions": "frac",
  "stacked-fractions": "afrc",
  ordinal: "ordn",
  "slashed-zero": "zero",
};

function fontFaces(sheets: StyleSheetList): CSSFontFaceRule[] {
  const faces: CSSFontFaceRule[] = [];
  function visit(container: CSSStyleSheet | CSSGroupingRule) {
    // Cross-origin sheets need not be readable. The app's bundled fonts are
    // same-origin; an inaccessible fallback sheet keeps its original family.
    try {
      for (const rule of container.cssRules) {
        if (rule instanceof CSSFontFaceRule) faces.push(rule);
        else if (rule instanceof CSSImportRule && rule.styleSheet) visit(rule.styleSheet);
        else if (rule instanceof CSSGroupingRule) visit(rule);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "SecurityError")) throw error;
    }
  }
  for (const sheet of sheets) visit(sheet);
  return faces;
}

const familyName = (family: string) => family.trim().replace(/^["']|["']$/g, "");

/** Call only on the attached export clone, never on the editable preview. */
export async function preparePdfFonts(clone: HTMLElement): Promise<void> {
  const faces = fontFaces(document.styleSheets);
  const descriptors = new CSSStyleSheet();
  descriptors.insertRule("@font-face {}");
  const descriptor = (descriptors.cssRules[0] as CSSFontFaceRule).style;
  const aliases = new Map<string, string>();
  const rules: string[] = [];
  const loads = new Map<string, string>();
  const parents = new Set<HTMLElement>();
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent?.trim() && node.parentElement && !node.parentElement.closest("style,svg"))
      parents.add(node.parentElement);
  }
  // Snapshot styles before changing families, including inherited settings.
  const entries = [...parents].map((element) => {
    const style = getComputedStyle(element);
    return {
      element,
      family: style.fontFamily,
      numeric: style.fontVariantNumeric,
      features: style.fontFeatureSettings,
      weight: style.fontWeight,
      style: style.fontStyle,
    };
  });
  for (const entry of entries) {
    const features = entry.numeric
      .split(/\s+/)
      .flatMap((variant) =>
        NUMERIC_FEATURES[variant] ? [`"${NUMERIC_FEATURES[variant]}" 1`] : [],
      );
    // Explicit feature settings take precedence over font-variant properties.
    if (entry.features !== "normal") features.push(entry.features);
    if (!features.length) continue;
    const settings = features.join(", ");
    const families = entry.family.match(/"[^"]*"|'[^']*'|[^,]+/g) ?? [];
    const replacement = families.map((family) => {
      const name = familyName(family);
      const matching = faces.filter((face) => familyName(face.style.fontFamily) === name);
      if (!matching.length) return family;
      const key = `${name}:${settings}`;
      let alias = aliases.get(key);
      if (!alias) {
        alias = `CloakPdfFont${aliases.size}`;
        aliases.set(key, alias);
        for (const face of matching) {
          descriptor.cssText = face.style.cssText;
          descriptor.fontFamily = alias;
          const defaults = face.style.getPropertyValue("font-feature-settings");
          descriptor.fontFeatureSettings = [defaults === "normal" ? "" : defaults, settings]
            .filter(Boolean)
            .join(", ");
          // Resolve relative font URLs against the stylesheet they came from.
          descriptor.setProperty(
            "src",
            face.style
              .getPropertyValue("src")
              .replace(
                /url\((['"]?)(.*?)\1\)/g,
                (_, _quote, url) =>
                  `url("${new URL(url, face.parentStyleSheet?.href ?? document.baseURI).href}")`,
              ),
          );
          rules.push(`@font-face { ${descriptor.cssText} }`);
        }
      }
      const font = `${entry.style} ${entry.weight} 16px "${alias}"`;
      loads.set(font, (loads.get(font) ?? "") + entry.element.textContent);
      return `"${alias}"`;
    });
    entry.element.style.fontFamily = replacement.join(", ");
  }
  if (!rules.length) return;
  const style = document.createElement("style");
  style.textContent = rules.join("\n");
  clone.prepend(style);
  await Promise.all([...loads].map(([font, text]) => document.fonts.load(font, text)));
}
