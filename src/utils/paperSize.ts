/**
 * Paper size definitions for the resume canvas.
 *
 * Templates are laid out against one of these dimensions and the PDF
 * exporter emits a matching page format. Letter is ~6 mm wider and ~17 mm
 * shorter than A4, so switching formats reshuffles how content packs —
 * the wider main column benefits from the extra horizontal room while the
 * shorter page forces slightly more aggressive pagination.
 */

export type PaperSize = "a4" | "letter";

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
  /** jsPDF format argument ("a4" is built-in; letter passes explicit mm). */
  pdfFormat: string | [number, number];
  label: string;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  a4: {
    widthMm: 210,
    heightMm: 297,
    pdfFormat: "a4",
    label: "A4",
  },
  letter: {
    // 8.5 × 11 inches → 215.9 × 279.4 mm.
    widthMm: 215.9,
    heightMm: 279.4,
    pdfFormat: "letter",
    label: "Letter",
  },
};

/** Default paper size for new resumes / unknown persisted values. */
export const DEFAULT_PAPER_SIZE: PaperSize = "a4";

/** Narrow an unknown persisted value to a valid PaperSize, falling back to A4. */
export function resolvePaperSize(candidate: unknown): PaperSize {
  return candidate === "letter" || candidate === "a4" ? candidate : DEFAULT_PAPER_SIZE;
}
