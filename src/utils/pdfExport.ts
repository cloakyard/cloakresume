/**
 * Client-side PDF export.
 *
 * The preview wraps the resume in a `.resume-root` container that itself
 * sits inside a `transform: scale(zoom)` wrapper used by the zoom dock.
 * We clone `.resume-root` into an off-screen host with no ancestor
 * transform, then for each `.resume-page` child we:
 *
 *   1. Rasterise it to a canvas via html2canvas-pro (which handles
 *      modern CSS colour spaces the baseline html2canvas chokes on) and
 *      add that canvas as the visible page image.
 *   2. Walk the clone's text nodes and write them back onto the page as
 *      INVISIBLE text (PDF text rendering mode 3). The raster stays
 *      pixel-perfect; the hidden text layer gives ATS parsers, screen
 *      readers, pdftotext, and select-all a real text stream in DOM
 *      (reading) order.
 *
 * So the export is raster for fidelity + vector text for accessibility.
 */

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { safeFilename } from "./fileIO.ts";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;
const A4_HEIGHT_PX = A4_HEIGHT_MM * PX_PER_MM;
/** 1pt in CSS pixels (1in = 72pt = 96px). */
const PX_PER_PT = 96 / 72;

/** Scale factor for rasterisation. 3× keeps serif strokes crisp even when the
 *  PDF is zoomed past 100 % on retina displays; pairs with PNG output. */
const RENDER_SCALE = 3;

export function buildPdfFilename(displayName: string): string {
  const name = safeFilename(displayName || "resume");
  const date = new Date().toISOString().slice(0, 10);
  return `${name}-${date}.pdf`;
}

/** Elements we never want to pull text from — decoration, not content. */
const SKIP_TAGS = new Set(["STYLE", "SCRIPT", "SVG", "CANVAS", "NOSCRIPT"]);

/**
 * Walk every `<a href>` inside `pageEl` and register it as a PDF link
 * annotation at the anchor's on-page bounding box. Pairs with the raster
 * image and the invisible text layer: raster preserves the look, text
 * layer makes the content selectable/searchable, and this layer makes
 * URLs *actually* clickable in the exported PDF — which the raster
 * (being just an image) can't do on its own.
 *
 * Only external http/https/mailto/tel hrefs are emitted. javascript:
 * and in-document hash links are ignored.
 */
function addLinkAnnotations(pdf: jsPDF, pageEl: HTMLElement): void {
  const pageRect = pageEl.getBoundingClientRect();
  const anchors = pageEl.querySelectorAll<HTMLAnchorElement>("a[href]");
  for (const a of anchors) {
    const href = a.getAttribute("href");
    if (!href) continue;
    if (!/^(https?:|mailto:|tel:)/i.test(href)) continue;
    const rect = a.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const xMm = (rect.left - pageRect.left) / PX_PER_MM;
    const yMm = (rect.top - pageRect.top) / PX_PER_MM;
    const wMm = rect.width / PX_PER_MM;
    const hMm = rect.height / PX_PER_MM;
    // Skip anchors that lie outside the A4 page box (rare, but guards
    // against accidental off-screen clones).
    if (xMm > A4_WIDTH_MM + 2 || yMm > A4_HEIGHT_MM + 2 || xMm + wMm < -2 || yMm + hMm < -2) {
      continue;
    }
    pdf.link(xMm, yMm, wMm, hMm, { url: href });
  }
}

/**
 * Write every text node inside `pageEl` into `pdf` at its on-page
 * position as invisible text. This gives the PDF a real text stream
 * (DOM order → reading order) without changing the raster appearance.
 *
 * Coordinates are computed from `Range.getBoundingClientRect()` of each
 * text node, translated into mm relative to `pageEl`'s top-left.
 */
function addInvisibleTextLayer(pdf: jsPDF, pageEl: HTMLElement): void {
  const pageRect = pageEl.getBoundingClientRect();
  const walker = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue;
      if (!text?.trim()) return NodeFilter.FILTER_REJECT;
      let ancestor: HTMLElement | null = node.parentElement;
      while (ancestor) {
        if (SKIP_TAGS.has(ancestor.tagName)) return NodeFilter.FILTER_REJECT;
        ancestor = ancestor.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Use a reasonable default (13px ≈ 9.75pt) for parents that don't yield
  // a numeric font-size (shouldn't happen, but keep defensive).
  const DEFAULT_PT = 9.75;

  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    const raw = node.nodeValue ?? "";
    // Collapse whitespace the way browsers render it — otherwise we emit
    // long runs of newlines/tabs from pretty-printed JSX into the PDF.
    const text = raw.replace(/\s+/g, " ").trim();
    if (parent && text) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      range.detach?.();

      if (rect.width > 0 && rect.height > 0) {
        const xMm = (rect.left - pageRect.left) / PX_PER_MM;
        const topMm = (rect.top - pageRect.top) / PX_PER_MM;
        // Drop anything that lies outside the A4 page box — covers
        // hidden/off-screen bits the walker accepted.
        if (xMm >= -2 && xMm <= A4_WIDTH_MM + 2 && topMm >= -2 && topMm <= A4_HEIGHT_MM + 2) {
          const cs = window.getComputedStyle(parent);
          const fontSizePx = Number.parseFloat(cs.fontSize);
          const fontSizePt =
            Number.isFinite(fontSizePx) && fontSizePx > 0 ? fontSizePx / PX_PER_PT : DEFAULT_PT;
          // Nudge to the glyph baseline — roughly 80% of the line-box
          // height from the top. Good enough for text extraction; exact
          // baseline alignment isn't required when the text is invisible.
          const baselineMm = topMm + (rect.height / PX_PER_MM) * 0.8;

          try {
            pdf.setFontSize(fontSizePt);
            pdf.text(text, xMm, baselineMm, {
              renderingMode: "invisible",
              baseline: "alphabetic",
            });
          } catch {
            // jsPDF's core font can't encode some Unicode code points
            // (e.g. rare symbols). Skip the offending node rather than
            // failing the whole export — the raster is unaffected.
          }
        }
      }
    }
    node = walker.nextNode();
  }
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

  // Any cloned <img> that came from an external URL needs `crossOrigin`
  // set BEFORE html2canvas reads it — otherwise the browser serves a
  // tainted version of the image and the canvas becomes unreadable. Data
  // URLs and blob: URLs are unaffected.
  for (const img of clone.querySelectorAll<HTMLImageElement>("img")) {
    const src = img.getAttribute("src") ?? "";
    if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
  }

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      await document.fonts.ready.catch(() => undefined);
    }
    // Give the browser a frame to settle layout/style on the freshly
    // inserted clone. Without this, html2canvas can occasionally read
    // positions before the first paint on complex templates.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

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

      // PNG at full quality — text (especially serif headings) stays crisp
      // where JPEG 0.95 would soften thin strokes. File size is larger but
      // resumes are short documents so the trade-off favours fidelity.
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
      // Add the invisible text layer AFTER the image. Visual stacking
      // doesn't matter since the text is rendered with mode 3 (invisible),
      // but keeping the call order deterministic makes the PDF content
      // stream predictable.
      addInvisibleTextLayer(pdf, pageEl);
      // Emit PDF link annotations for every <a href> on the page so
      // email/website/linkedin/certification links stay clickable in the
      // exported document.
      addLinkAnnotations(pdf, pageEl);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}
