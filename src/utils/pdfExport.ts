/**
 * Client-side PDF export.
 *
 * The preview wraps the resume in a `.resume-root` container that itself
 * sits inside a `transform: scale(zoom)` wrapper used by the zoom dock.
 * We clone `.resume-root` into an off-screen host with no ancestor
 * transform, then rasterise each `.resume-page` child to a canvas via
 * html2canvas-pro (which handles modern CSS colour spaces the baseline
 * html2canvas chokes on), and assemble the canvases into a multi-page
 * A4 PDF with jsPDF.
 *
 * Rasterising means the PDF text isn't selectable — that's an accepted
 * trade-off to avoid rewriting every template against @react-pdf. For
 * ATS-safe variants the rendered-to-PDF file preserves the on-screen
 * layout exactly; users can still Cmd+P the preview if they need a
 * text-layer PDF.
 */

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;
const A4_HEIGHT_PX = A4_HEIGHT_MM * PX_PER_MM;

/** Scale factor for rasterisation. 2× gives a crisp result without blowing up file size. */
const RENDER_SCALE = 2;

function sanitiseFilename(input: string): string {
  const cleaned = input
    .trim()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return cleaned || "resume";
}

export function buildPdfFilename(displayName: string): string {
  const name = sanitiseFilename(displayName || "resume");
  const date = new Date().toISOString().slice(0, 10);
  return `${name}-${date}.pdf`;
}

/**
 * Render `source` (a `.resume-root` element) into a multi-page A4 PDF
 * and trigger a download with the given filename.
 */
export async function exportResumeToPdf(source: HTMLElement, filename: string): Promise<void> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.pointerEvents = "none";
  host.style.background = "#ffffff";
  host.style.width = `${A4_WIDTH_MM}mm`;

  const clone = source.cloneNode(true) as HTMLElement;
  // Drop the zoom transform, vertical padding, and inter-page gap so the
  // clone renders each page at its true A4 size with no decorative chrome.
  clone.style.transform = "none";
  clone.style.width = `${A4_WIDTH_MM}mm`;
  clone.style.padding = "0";
  clone.style.gap = "0";

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      await document.fonts.ready.catch(() => undefined);
    }

    const pageEls = Array.from(clone.querySelectorAll<HTMLElement>(".resume-page"));
    if (pageEls.length === 0) {
      throw new Error("No resume pages found to export.");
    }

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i]!;
      // Strip box-shadow/border-radius on the clone page — those are preview
      // decoration, not part of the printed document.
      pageEl.style.boxShadow = "none";
      pageEl.style.borderRadius = "0";

      const canvas = await html2canvas(pageEl, {
        scale: RENDER_SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Lock the capture to the logical A4 page size so content that
        // overflows (rare — templates pack into A4 pages already) doesn't
        // stretch the PDF page. Height is clamped to 297mm.
        width: pageEl.offsetWidth,
        height: Math.min(pageEl.offsetHeight, A4_HEIGHT_PX),
        windowWidth: pageEl.offsetWidth,
        windowHeight: Math.min(pageEl.offsetHeight, A4_HEIGHT_PX),
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}
