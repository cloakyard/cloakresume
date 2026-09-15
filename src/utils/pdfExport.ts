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

import { renderedTextLines } from "./pagination.ts";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { DEFAULT_PAPER_SIZE, PAPER_SIZES, type PaperSize } from "./paperSize.ts";
import { profileTitleOverflows } from "./profileTitle.ts";
import { preparePdfFonts } from "./pdfFonts.ts";

/** 1mm in CSS pixels at 96dpi. */
const PX_PER_MM = 96 / 25.4;
/** 1pt in CSS pixels (1in = 72pt = 96px). */
const PX_PER_PT = 96 / 72;

/** Scale factor for rasterisation. 3× keeps serif strokes crisp even when the
 *  PDF is zoomed past 100 % on retina displays; pairs with PNG output. */
const RENDER_SCALE = 3;

/** Elements we never want to pull text from — decoration, not content. */
const SKIP_TAGS = new Set(["STYLE", "SCRIPT", "SVG", "CANVAS", "NOSCRIPT"]);

/** Fail visibly if a future template regression would otherwise crop its PDF. */
export function assertExportFits(source: HTMLElement, paperSize: PaperSize): void {
  if (profileTitleOverflows(source)) {
    throw new Error(
      "Your title exceeds 4 lines. Open Profile and shorten the title or adjust its line breaks, then export again.",
    );
  }
  const paper = PAPER_SIZES[paperSize];
  const pages = source.querySelectorAll<HTMLElement>(".resume-page");
  if (!pages.length) throw new Error("The resume preview is still loading. Please try again.");
  pages.forEach((page, index) => {
    const pageRect = page.getBoundingClientRect();
    const scale = pageRect.width / (paper.widthMm * PX_PER_MM);
    const bottom = pageRect.top + paper.heightMm * PX_PER_MM * scale;
    const tolerance = 2 * scale;
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        !node.textContent?.trim() ||
        !node.parentElement ||
        node.parentElement.closest("style,script,svg")
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        let clipped =
          rect.bottom > bottom + tolerance ||
          rect.top < pageRect.top - tolerance ||
          rect.left < pageRect.left - tolerance ||
          rect.right > pageRect.right + tolerance;
        for (
          let parent: HTMLElement | null = node.parentElement;
          !clipped && parent && parent !== page;
          parent = parent.parentElement
        ) {
          const style = getComputedStyle(parent);
          const box = parent.getBoundingClientRect();
          if (
            ["hidden", "clip"].includes(style.overflowY) &&
            (rect.bottom > box.bottom + tolerance || rect.top < box.top - tolerance)
          )
            clipped = true;
          if (
            ["hidden", "clip"].includes(style.overflowX) &&
            (rect.right > box.right + tolerance || rect.left < box.left - tolerance)
          )
            clipped = true;
        }
        if (clipped)
          throw new Error(
            `Page ${index + 1} could not be laid out completely. Please retry after the preview updates.`,
          );
      }
    }
  });
}

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
    for (const rect of a.getClientRects()) {
      if (rect.width <= 0 || rect.height <= 0) continue;
      const xMm = Math.max(0, (rect.left - pageRect.left) / PX_PER_MM);
      const yMm = Math.max(0, (rect.top - pageRect.top) / PX_PER_MM);
      const wMm = Math.min(rect.width / PX_PER_MM, widthMm - xMm);
      const hMm = Math.min(rect.height / PX_PER_MM, heightMm - yMm);
      if (wMm > 0 && hMm > 0) pdf.link(xMm, yMm, wMm, hMm, { url: href });
    }
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
      if (!text) return NodeFilter.FILTER_REJECT;
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

  let pendingSpace: DOMRect | null = null;
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && node instanceof Text) {
      if (!node.data.trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width && rect.height) pendingSpace = rect;
      }
      for (const line of renderedTextLines(node)) {
        const { rect } = line;
        const hasSeparator =
          pendingSpace &&
          rect.top < pendingSpace.bottom &&
          rect.bottom > pendingSpace.top &&
          rect.left >= pendingSpace.left - 1;
        const text = hasSeparator ? ` ${line.text}` : line.text;
        const left = hasSeparator ? pendingSpace!.left : rect.left;
        pendingSpace = null;
        const xMm = (left - pageRect.left) / PX_PER_MM;
        const topMm = (rect.top - pageRect.top) / PX_PER_MM;
        if (xMm >= -2 && xMm <= widthMm + 2 && topMm >= -2 && topMm <= heightMm + 2) {
          const fontSizePx = Number.parseFloat(window.getComputedStyle(parent).fontSize);
          const fontSizePt =
            Number.isFinite(fontSizePx) && fontSizePx > 0 ? fontSizePx / PX_PER_PT : DEFAULT_PT;
          const baselineMm = topMm + (rect.height / PX_PER_MM) * 0.8;
          try {
            pdf.setFontSize(fontSizePt);
            pdf.text(text, xMm, baselineMm, { renderingMode: "invisible", baseline: "alphabetic" });
          } catch {
            // The raster still represents Unicode unsupported by jsPDF's core font.
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
  await document.fonts.ready;
  await Promise.all(
    Array.from(source.querySelectorAll("img"), (img) => img.decode().catch(() => undefined)),
  );
  // Font/image completion schedules pagination in a layout effect/observer.
  // Wait for that live DOM to settle before making the export snapshot.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  assertExportFits(source, paperSize);
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
    await preparePdfFonts(clone);
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

    assertExportFits(clone, paperSize);

    const pdf = new jsPDF({
      unit: "mm",
      format: pdfFormat,
      orientation: "portrait",
      compress: true,
    });

    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i]!;
      // Strip preview-only decoration from the clone page. The live proof stays
      // template-true in every theme; clearing filter remains a defensive export
      // guard for pages loaded from older cached styles.
      pageEl.style.boxShadow = "none";
      pageEl.style.borderRadius = "0";
      pageEl.style.filter = "none";

      const canvas = await html2canvas(pageEl, {
        scale: RENDER_SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Exact paper dimensions, validated above before rasterisation.
        width: widthMm * PX_PER_MM,
        height: pageHeightPx,
        windowWidth: Math.ceil(widthMm * PX_PER_MM),
        windowHeight: Math.ceil(pageHeightPx),
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
