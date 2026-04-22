/**
 * Scroll to and soft-glow a specific editor field after a jump-to-fix tap
 * from the ATS Insights pane.
 *
 * Implementation notes:
 * - Fields opt in by rendering `data-field-id="<segmentId>"` on a wrapping
 *   element. The segment id format matches what `buildGrammarSegments()`
 *   produces (e.g. `profile.summary`, `experience.0.bullets.2`).
 * - We poll a few frames because the target field may not exist in the DOM
 *   yet when the user taps — the editor rail has to switch sections and
 *   that section may lazily mount bullet rows.
 * - `scroll-margin` on the `.cr-field-glow` class ensures the field isn't
 *   flush against the toolbar after `scrollIntoView`.
 */

const MAX_POLL_FRAMES = 30; // ~0.5 s at 60 fps — covers animated transitions
const GLOW_DURATION_MS = 2200; // keep in sync with @keyframes cr-field-glow

export function highlightField(segmentId: string): void {
  let frame = 0;
  const tick = () => {
    const el = document.querySelector<HTMLElement>(`[data-field-id="${CSS.escape(segmentId)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Re-trigger the animation if the class is already present.
      el.classList.remove("cr-field-glow");
      void el.offsetWidth;
      el.classList.add("cr-field-glow");
      window.setTimeout(() => el.classList.remove("cr-field-glow"), GLOW_DURATION_MS);
      return;
    }
    if (++frame >= MAX_POLL_FRAMES) return;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
