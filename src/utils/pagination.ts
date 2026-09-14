/** Browser-measured pagination. Fragments retain real HTML/text rather than clipping pixels. */
export interface PageFragment {
  index: number;
  html?: string;
  height: number;
  keepWithNext: boolean;
  contextLabel?: string;
  hasHeading?: boolean;
}

const MIN_REMAINDER = 76;
const EPSILON = 1;
const SECTION_HEADING = 'h2, [class*="-h2"], [class*="-h3"], [class*="-marker-label"]';
const KEEP_HEADING = 'h1, h2, h3, h4, [data-keep-with-next="true"], [class*="-h2"], [class*="-h3"]';

function layoutHeight(element: HTMLElement): number {
  // offsetHeight rounds every atom independently. Fractional rounding errors
  // accumulate on dense pages; undo preview zoom on the precise layout box.
  const scale = element.getBoundingClientRect().width / element.offsetWidth || 1;
  return element.getBoundingClientRect().height / scale;
}

function meaningful(node: Node | null): boolean {
  return (
    !!node &&
    (!!node.textContent?.trim() || (node instanceof Element && !!node.querySelector("img,svg")))
  );
}

/** Split text at its rendered line boundary, preserving every character. */
function textOffsetAt(text: Text, bottom: number): number {
  const range = document.createRange();
  range.selectNodeContents(text);
  let rects = Array.from(range.getClientRects());
  if (!text.data.trim() && !rects.some((rect) => rect.width && rect.height)) {
    // Collapsed separator nodes have no useful box. Keep them with their
    // following inline sibling instead of classifying an empty rect as page 1.
    const adjacent = text.nextSibling ?? text.previousSibling;
    if (adjacent) {
      range.selectNodeContents(adjacent);
      rects = Array.from(range.getClientRects());
    }
  }
  if (rects.every((rect) => rect.bottom <= bottom)) return text.length;
  if (rects.every((rect) => rect.top >= bottom)) return 0;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    range.setStart(text, mid - 1);
    range.setEnd(text, mid);
    const rect = range.getBoundingClientRect();
    if (rect.bottom <= bottom || rect.height === 0) low = mid;
    else high = mid - 1;
  }
  // A collapsed trailing space belongs to the preceding line. Keeping it
  // preserves exact source text and avoids joining words during extraction.
  while (low > 0 && low < text.length && /\s/.test(text.data[low])) low++;
  return low;
}

/** Real line boxes also keep the PDF text layer inside its visible page. */
export function renderedTextLines(text: Text): { text: string; rect: DOMRect }[] {
  const range = document.createRange();
  range.selectNodeContents(text);
  const rects = Array.from(range.getClientRects());
  let offset = 0;
  return rects.flatMap((rect) => {
    const end = textOffsetAt(text, rect.bottom + 0.01);
    const value = text.data.slice(offset, end).replace(/\s+/g, " ");
    offset = end;
    return value.trim() && rect.width && rect.height ? [{ text: value, rect }] : [];
  });
}

/** Keep differently sized inline glyphs on the same physical text line. */
function inlineBoundary(element: HTMLElement, bottom: number): number {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(walker.currentNode);
    rects.push(...range.getClientRects());
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const rect of rects) {
      if (rect.height && rect.top < bottom - 0.01 && rect.bottom > bottom + 0.01) {
        bottom = rect.top;
        changed = true;
      }
    }
  }
  return bottom;
}

/**
 * Partition the rendered tree. Unlike Range.cloneContents, this preserves
 * empty grid columns and row alignment when two columns cross a page together.
 */
function partition(node: Node, bottom: number, maxWholeHeight: number): [Node | null, Node | null] {
  if (node instanceof Text) {
    const offset = textOffsetAt(node, bottom);
    return [
      offset ? document.createTextNode(node.data.slice(0, offset)) : null,
      offset < node.length ? document.createTextNode(node.data.slice(offset)) : null,
    ];
  }
  if (!(node instanceof HTMLElement)) {
    if (node instanceof SVGElement) {
      return node.getBoundingClientRect().bottom <= bottom
        ? [node.cloneNode(true), null]
        : [null, node.cloneNode(true)];
    }
    return [node.cloneNode(true), null];
  }
  const rect = node.getBoundingClientRect();
  if (rect.height && rect.bottom <= bottom) return [node.cloneNode(true), null];
  if (rect.height && rect.top >= bottom) return [null, node.cloneNode(true)];
  if (!node.childNodes.length) {
    return rect.bottom <= bottom ? [node.cloneNode(true), null] : [null, node.cloneNode(true)];
  }
  // Keep explicit records and stat value/label pairs whole when they fit on
  // a fresh page. Taller records must still be allowed to split into lines.
  if (
    (node.dataset.statCard === "true" || node.dataset.keepTogether === "true") &&
    layoutHeight(node) <= maxWholeHeight
  )
    return [null, node.cloneNode(true)];
  // Short factual blocks (an award, language, or credential) move as a
  // unit. Line fragmentation is reserved for content that is actually long.
  const display = getComputedStyle(node).display;
  const compactFact =
    ["block", "list-item", "flex", "grid"].includes(display) && layoutHeight(node) <= 56;
  const compactAvoided =
    getComputedStyle(node).breakInside === "avoid" && layoutHeight(node) <= 110;
  if (rect.height > 0 && (compactFact || compactAvoided)) return [null, node.cloneNode(true)];
  const before = node.cloneNode(false) as HTMLElement;
  const after = node.cloneNode(false) as HTMLElement;
  const style = getComputedStyle(node);
  const children = Array.from(node.children);
  const inlineFlow =
    ["block", "list-item", "flow-root"].includes(style.display) &&
    children.every((child) =>
      ["inline", "inline-block", "contents"].includes(getComputedStyle(child).display),
    );
  if (inlineFlow) bottom = inlineBoundary(node, bottom);
  const grid = style.display === "grid";
  const row =
    style.display === "flex" && style.flexDirection === "row" && style.flexWrap === "nowrap";
  const columns = grid
    ? [...new Set(children.map((child) => Math.round(child.getBoundingClientRect().left)))].sort(
        (a, b) => a - b,
      )
    : [];
  const movableHeadings = new Set<Node>();
  for (const child of node.childNodes) {
    let [left, right] = partition(child, bottom, maxWholeHeight);
    if (child instanceof HTMLElement && grid) {
      const explicitColumn = Number.parseInt(getComputedStyle(child).gridColumnStart, 10);
      const column = Number.isFinite(explicitColumn)
        ? explicitColumn
        : columns.indexOf(Math.round(child.getBoundingClientRect().left)) + 1;
      if (left instanceof HTMLElement) left.style.gridColumnStart = String(column);
      if (right instanceof HTMLElement) right.style.gridColumnStart = String(column);
    }
    if (child instanceof HTMLElement && row) {
      // Keep the date/marker cell in a horizontal layout even after its text
      // has ended; otherwise continuation prose moves to the wrong column.
      left ??= child.cloneNode(false);
      right ??= child.cloneNode(false);
    }
    if (left && !right && child instanceof HTMLElement && child.matches(KEEP_HEADING))
      movableHeadings.add(left);
    if (left) before.appendChild(left);
    if (right) after.appendChild(right);
  }
  // A nested project/section heading must follow its first content onto the
  // next page. Move a trailing chain only when each whole heading fitted;
  // exceptionally long headings can still fragment themselves.
  if (meaningful(after)) {
    while (true) {
      const trailing = Array.from(before.childNodes).findLast((child) => meaningful(child));
      if (!trailing || !movableHeadings.has(trailing)) break;
      after.insertBefore(trailing, after.firstChild);
    }
  }
  const hasBefore = meaningful(before);
  const hasAfter = meaningful(after);
  if (hasBefore && hasAfter) {
    // The content keeps its template background/borders. Vertical spacing at
    // the internal cut is removed so continuation starts at the content edge.
    before.style.marginBottom = "0";
    before.style.paddingBottom = "0";
    after.style.marginTop = "0";
    after.style.paddingTop = "0";
    after.dataset.paginationContinuation = "true";
  }
  return [hasBefore ? before : null, hasAfter ? after : null];
}

function splitToFit(
  element: HTMLElement,
  budget: number,
  scratch: HTMLElement,
  pageBudget: number,
): [HTMLElement, HTMLElement, number] | null {
  const scale = element.getBoundingClientRect().width / element.offsetWidth || 1;
  const top = element.getBoundingClientRect().top;
  // Borders, grid gaps and repeated card framing can make the reconstructed
  // fragment a little taller. Re-measure it; never guess or crop the result.
  for (let allowance = budget - EPSILON; allowance >= 20; allowance -= 10) {
    const [before, after] = partition(element, top + allowance * scale, pageBudget);
    if (!(before instanceof HTMLElement) || !(after instanceof HTMLElement)) return null;
    if (!meaningful(before) || !meaningful(after)) return null;
    scratch.appendChild(before);
    const height = layoutHeight(before);
    before.remove();
    if (height <= budget + EPSILON) return [before, after, height];
  }
  return null;
}

export function paginateMeasured(
  container: HTMLElement,
  budgetForPage: (pageIndex: number) => number,
): PageFragment[][] {
  const sources = Array.from(container.children) as HTMLElement[];
  const scratch = document.createElement("div");
  scratch.style.display = "flow-root";
  container.appendChild(scratch);
  const pages: PageFragment[][] = [];
  let current: PageFragment[] = [];
  let used = 0;
  let contextLabel = "";
  const headingSelector = SECTION_HEADING;
  const close = () => {
    const carry: PageFragment[] = [];
    while (current.length && current[current.length - 1].keepWithNext) {
      carry.unshift(current.pop()!);
    }
    if (current.length) pages.push(current);
    // An impossibly large keep chain must be allowed to break. It may not
    // create an empty page or force later text outside the paper boundary.
    if (!current.length && carry.length) {
      pages.push(carry);
      current = [];
    } else current = carry;
    used = current.reduce((sum, fragment) => sum + fragment.height, 0);
  };
  try {
    sources.forEach((source, index) => {
      const headings = [
        ...new Set(
          Array.from(source.querySelectorAll(headingSelector), (heading) =>
            heading.textContent?.trim(),
          ).filter(Boolean),
        ),
      ];
      if (headings.length > 1) contextLabel = "Additional information";
      else if (headings[0]) contextLabel = headings[0];
      let pending = source;
      let isFragment = false;
      let height = layoutHeight(pending);
      let keepWithNext = source.firstElementChild?.getAttribute("data-keep-with-next") === "true";
      while (true) {
        const available = budgetForPage(pages.length) - used;
        if (height <= available + EPSILON) {
          current.push({
            index,
            html: isFragment ? pending.innerHTML : undefined,
            height,
            keepWithNext,
            contextLabel,
            hasHeading: !!pending.querySelector(headingSelector),
          });
          used += height;
          break;
        }
        // Keep normal compact cards together, but use meaningful remaining
        // page space for long prose/grids instead of moving a whole section.
        const atom = pending.firstElementChild as HTMLElement | null;
        const preserveRow =
          atom?.dataset.statRow === "true" || atom?.dataset.keepTogether === "true";
        const compactCard = atom && getComputedStyle(atom).breakInside === "avoid" && height <= 110;
        const fitsFreshPage = height <= budgetForPage(pages.length + 1);
        const canSplit =
          !(fitsFreshPage && (preserveRow || compactCard)) &&
          (available >= MIN_REMAINDER || (!current.length && available >= 20));
        const split = canSplit
          ? splitToFit(pending, available, scratch, budgetForPage(pages.length + 1))
          : null;
        if (split) {
          const [before, after, firstHeight] = split;
          current.push({
            index,
            html: before.innerHTML,
            height: firstHeight,
            keepWithNext: false,
            contextLabel,
            hasHeading: !!before.querySelector(headingSelector),
          });
          used += firstHeight;
          close();
          if (pending !== source) pending.remove();
          scratch.appendChild(after);
          pending = after;
          isFragment = true;
          height = layoutHeight(pending);
          keepWithNext = false;
        } else if (current.length) close();
        else {
          // This only covers a genuinely indivisible object (e.g. an image).
          // Templates constrain those to the column; surface any regression
          // in the export validator instead of silently hiding content.
          current.push({
            index,
            html: isFragment ? pending.innerHTML : undefined,
            height,
            keepWithNext,
            contextLabel,
            hasHeading: !!pending.querySelector(headingSelector),
          });
          used += height;
          break;
        }
      }
      if (pending !== source) pending.remove();
    });
    if (current.length) pages.push(current);
    return pages.length ? pages : [[]];
  } finally {
    scratch.remove();
  }
}

export function pageFragmentsEqual(a: PageFragment[][], b: PageFragment[][]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (page, i) =>
        page.length === b[i].length &&
        page.every(
          (fragment, j) =>
            fragment.index === b[i][j].index &&
            fragment.html === b[i][j].html &&
            fragment.contextLabel === b[i][j].contextLabel &&
            fragment.hasHeading === b[i][j].hasHeading,
        ),
    )
  );
}
