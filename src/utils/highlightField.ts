/** Focus the named writing field after a review-to-editor handoff. */
const MAX_POLL_FRAMES = 30; // Covers lazy section mounting.

export function highlightField(segmentId: string): void {
  let frame = 0;
  const tick = () => {
    const field = document.querySelector<HTMLElement>(`[data-field-id="${CSS.escape(segmentId)}"]`);
    if (field) {
      field.scrollIntoView({ behavior: "instant", block: "center" });
      field.focus({ preventScroll: true });
      return;
    }
    if (++frame < MAX_POLL_FRAMES) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
