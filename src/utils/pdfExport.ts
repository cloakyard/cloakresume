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
import { DEFAULT_PAPER_SIZE, PAPER_SIZES, type PaperSize } from "./paperSize.ts";

/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;
/** 1pt in CSS pixels (1in = 72pt = 96px). */
const PX_PER_PT = 96 / 72;

/** Scale factor for rasterisation. 3× keeps serif strokes crisp even when the
 *  PDF is zoomed past 100 % on retina displays; pairs with PNG output. */
const RENDER_SCALE = 3;

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
function addLinkAnnotations(
  pdf: jsPDF,
  pageEl: HTMLElement,
  widthMm: number,
  heightMm: number,
): void {
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
    // Skip anchors that lie outside the page box (rare, but guards
    // against accidental off-screen clones).
    if (xMm > widthMm + 2 || yMm > heightMm + 2 || xMm + wMm < -2 || yMm + hMm < -2) {
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
function addInvisibleTextLayer(
  pdf: jsPDF,
  pageEl: HTMLElement,
  widthMm: number,
  heightMm: number,
): void {
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
        // Drop anything that lies outside the page box — covers
        // hidden/off-screen bits the walker accepted.
        if (xMm >= -2 && xMm <= widthMm + 2 && topMm >= -2 && topMm <= heightMm + 2) {
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
 * Render `source` (a `.resume-root` element) into a multi-page PDF
 * sized to the selected paper (A4 or Letter) and trigger a download
 * with the given filename.
 */
export async function exportResumeToPdf(
  source: HTMLElement,
  filename: string,
  paperSize: PaperSize = DEFAULT_PAPER_SIZE,
): Promise<void> {
  const { widthMm, heightMm, pdfFormat } = PAPER_SIZES[paperSize];
  const pageHeightPx = heightMm * PX_PER_MM;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.pointerEvents = "none";
  host.style.background = "#ffffff";
  host.style.width = `${widthMm}mm`;

  const clone = source.cloneNode(true) as HTMLElement;
  // Drop the zoom transform, vertical padding, and inter-page gap so the
  // clone renders each page at its true paper size with no decorative chrome.
  clone.style.transform = "none";
  clone.style.width = `${widthMm}mm`;
  clone.style.padding = "0";
  clone.style.gap = "0";
  // Republish paper dimensions so descendant styles (e.g. `.resume-page`)
  // that read CSS vars match the export target even if the live preview
  // was being rendered against the other size.
  clone.style.setProperty("--resume-page-w", `${widthMm}mm`);
  clone.style.setProperty("--resume-page-h", `${heightMm}mm`);

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
      format: pdfFormat,
      orientation: "portrait",
      compress: true,
    });

    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i]!;
      // Strip box-shadow/border-radius on the clone page — those are preview
      // decoration, not part of the printed document. Also clear any dark-mode
      // dim filter so the export always looks the way the template was designed
      // for paper, regardless of whether the user has the app in dark mode.
      pageEl.style.boxShadow = "none";
      pageEl.style.borderRadius = "0";
      pageEl.style.filter = "none";

      const canvas = await html2canvas(pageEl, {
        scale: RENDER_SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Lock the capture to the logical paper page size so content that
        // overflows (rare — templates pack into pages already) doesn't
        // stretch the PDF page. Height is clamped to the selected size.
        width: pageEl.offsetWidth,
        height: Math.min(pageEl.offsetHeight, pageHeightPx),
        windowWidth: pageEl.offsetWidth,
        windowHeight: Math.min(pageEl.offsetHeight, pageHeightPx),
      });

      // PNG at full quality — text (especially serif headings) stays crisp
      // where JPEG 0.95 would soften thin strokes. File size is larger but
      // resumes are short documents so the trade-off favours fidelity.
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage(pdfFormat, "portrait");
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm, undefined, "FAST");
      // Add the invisible text layer AFTER the image. Visual stacking
      // doesn't matter since the text is rendered with mode 3 (invisible),
      // but keeping the call order deterministic makes the PDF content
      // stream predictable.
      addInvisibleTextLayer(pdf, pageEl, widthMm, heightMm);
      // Emit PDF link annotations for every <a href> on the page so
      // email/website/linkedin/certification links stay clickable in the
      // exported document.
      addLinkAnnotations(pdf, pageEl, widthMm, heightMm);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}
