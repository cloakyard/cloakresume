/**
 * Per-bullet pagination helpers.
 *
 * Long list-style sections (Experience, Custom) traditionally emit one
 * atom per item: a single wrapper containing the title/company/dates
 * head and all its bullets. When such an item is taller than the
 * remaining space on a page, the whole atom shifts to the next page —
 * leaving visible empty space behind. That is the "section shifted
 * without continuing content" bug.
 *
 * `pushSplitItem` decomposes a single item into a head atom + per-bullet
 * atoms so the packer can continue the item across a page boundary at
 * any bullet. It wires the `data-keep-with-next` flags so:
 *   - the head is evicted with the first bullet (never orphaned);
 *   - the first bullet stays with the head (never sits alone at the top
 *     of a new page with the head left behind on the previous one).
 *
 * Each atom is wrapped in a `display: contents` div so the wrapper
 * itself has no box and the template's inner element (`<ul>`, `<li>`,
 * card div, timeline row) drives the layout and measurement normally.
 * The wrapper exists purely to carry the data attribute that the
 * `PaginatedCanvas` packer reads.
 */

import type { ReactNode } from "react";

export interface SplitItemOptions {
  /** Stable key prefix for this item's atoms (e.g. `exp-${job.id}`). */
  keyPrefix: string;
  /**
   * Renders the item's head (title + company + dates block). Emitted as
   * its own atom with `data-keep-with-next="true"` so the packer
   * evicts it onto the next page alongside the first bullet when it
   * would otherwise orphan at the bottom. Omit when the item has no
   * dedicated head — bullets will still split across pages cleanly.
   */
  renderHead?: () => ReactNode;
  /** Bullet strings. Each becomes its own atom. */
  bullets: readonly string[];
  /**
   * Renders a single bullet as one atom's content. `index` is 0-based,
   * `total` is `bullets.length`. Templates typically wrap the bullet in
   * the same element as the full-item `<ul>` would — one `<ul><li>…</li></ul>`
   * per atom renders identically to a single merged list when margins
   * collapse to 0 between adjacent bullet atoms.
   */
  renderBullet: (bullet: string, index: number, total: number) => ReactNode;
}

/**
 * Push an item as a head atom + per-bullet atoms with keep-with-next
 * wired so the item never splits between its head and its first bullet,
 * but remaining bullets flow freely across pages at bullet boundaries.
 *
 * Atom chain:
 *   head                    — `data-keep-with-next="true"`
 *   bullet 0                — `data-keep-with-next="true"` when total > 1
 *   bullet 1..N-1           — no keep-with-next (can end a page)
 */
export function pushSplitItem(atoms: ReactNode[], opts: SplitItemOptions): void {
  const { keyPrefix, renderHead, bullets, renderBullet } = opts;
  const total = bullets.length;

  if (renderHead) {
    atoms.push(
      <div key={`${keyPrefix}-head`} data-keep-with-next="true" style={{ display: "contents" }}>
        {renderHead()}
      </div>,
    );
  }

  bullets.forEach((bullet, i) => {
    const chainNext = i === 0 && total > 1;
    atoms.push(
      <div
        key={`${keyPrefix}-b-${i}`}
        data-keep-with-next={chainNext ? "true" : undefined}
        style={{ display: "contents" }}
      >
        {renderBullet(bullet, i, total)}
      </div>,
    );
  });
}
