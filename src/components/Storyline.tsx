import { useLayoutEffect, useRef } from "react";
import { mountAirArtwork } from "../../docs/air/artwork.mjs";
import "../styles/storyline.css";

const milestones = [0.12, 0.5, 0.88];
const chapters = [
  ["Experience", "Making everyday tools", "feel a little more human.", "What you’ve done"],
  ["Projects", "Ideas explored.", "Useful things made.", "What you’ve made"],
  ["Education", "A foundation to build on.", "A curiosity to keep.", "What comes next"],
];
const pieces = Array.from({ length: 80 }, (_, index) => index / 80);
function point(t: number, progress: number, width: number) {
  const x = 18 + t * (width - 36) - width / 2;
  const y = 208 + Math.sin(t * Math.PI * 2) * 58;
  return [x + (-94 - x) * progress, y + (137 + ((t - 0.12) * 174) / 0.76 - y) * progress];
}
function pose(t: number, progress: number, width: number) {
  const a = point(t, progress, width),
    b = point(Math.min(1, t + 1 / 80), progress, width);
  return `translate(${a[0]}px, ${a[1]}px) rotate(${Math.atan2(b[1] - a[1], b[0] - a[0])}rad) scaleX(${(Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.5) / 10})`;
}
const move = (x: number, y: number) => `translate(${x}px, ${y}px)`;

/** One illustrative career path; never reads a draft or delays entry to the editor. */
export function Storyline() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const stage = element.querySelector<HTMLElement>(".resume-story-stage")!;
    const lines = [...stage.querySelectorAll<HTMLElement>(".resume-story-line")];
    const nodes = [...stage.querySelectorAll<HTMLElement>(".resume-story-node")];
    const labels = [...stage.querySelectorAll<HTMLElement>(".resume-story-label")];
    const rows = [...stage.querySelectorAll<HTMLElement>(".resume-story-chapter")];
    let width = stage.clientWidth;
    const artwork = mountAirArtwork(element, {
      settle() {}, // Markup and CSS always describe the complete static résumé.
      run: (animate) => {
        width = stage.clientWidth;
        const options = {
          duration: 3400,
          easing: getComputedStyle(element).getPropertyValue("--air-ease-in-out").trim(),
        };
        const steps = lines.map((line, i) => ({
          element: line,
          options,
          keyframes: [
            { transform: pose(pieces[i], 0, width), offset: 0 },
            ...Array.from({ length: 13 }, (_, j) => ({
              transform: pose(pieces[i], j / 12, width),
              offset: 0.18 + (0.7 * j) / 12,
            })),
            { transform: pose(pieces[i], 1, width), offset: 1 },
          ] as Keyframe[],
        }));
        nodes.forEach((node, i) => {
          const a = point(milestones[i], 0, width),
            b = point(milestones[i], 1, width);
          steps.push({
            element: node,
            options,
            keyframes: [
              { transform: move(a[0] - 3, a[1] - 3), offset: 0 },
              { transform: move(a[0] - 3, a[1] - 3), offset: 0.18 },
              { transform: move(b[0] - 3, b[1] - 3), offset: 0.88 },
              { transform: move(b[0] - 3, b[1] - 3), offset: 1 },
            ],
          });
        });
        // Read label geometry together before writing any styles/creating effects.
        const labelWidths = labels.map((label) => label.offsetWidth);
        labels.forEach((label, i) => {
          const p = point(milestones[i], 0, width);
          const x = Math.min(
            width / 2 - labelWidths[i] - 8,
            Math.max(8 - width / 2, p[0] - labelWidths[i] / 2),
          );
          steps.push({
            element: label,
            options,
            keyframes: [
              { opacity: 1, transform: move(x, p[1] - 96), offset: 0 },
              { opacity: 1, transform: move(x, p[1] - 96), offset: 0.2 },
              { opacity: 0, transform: move(x, p[1] - 96), offset: 0.42 },
              { opacity: 0, transform: move(x, p[1] - 96), offset: 1 },
            ],
          });
        });
        steps.push({
          element: stage.querySelector<HTMLElement>(".resume-story-paper")!,
          options,
          keyframes: [
            { opacity: 0, transform: "translateY(16px) scale(.97)", offset: 0 },
            { opacity: 0, transform: "translateY(16px) scale(.97)", offset: 0.3 },
            { opacity: 1, transform: "translateY(0) scale(1)", offset: 0.78 },
            { opacity: 1, transform: "translateY(0) scale(1)", offset: 1 },
          ],
        });
        steps.push({
          element: stage.querySelector<HTMLElement>(".resume-story-name")!,
          options,
          keyframes: [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.55 },
            { opacity: 1, offset: 1 },
          ],
        });
        rows.forEach((row, i) => {
          const p = point(milestones[i], 0, width),
            end = move(-76, 128 + i * 87);
          steps.push({
            element: row,
            options,
            keyframes: [
              { opacity: 0, transform: move(p[0] + 16, p[1] - 9), offset: 0 },
              { opacity: 0, transform: move(p[0] + 16, p[1] - 9), offset: 0.4 },
              { opacity: 1, transform: end, offset: 0.9 },
              { opacity: 1, transform: end, offset: 1 },
            ],
          });
        });
        return animate(steps);
      },
    });
    const resize = new ResizeObserver(() => {
      if (stage.clientWidth !== width) {
        width = stage.clientWidth;
        artwork.finish();
      }
    });
    resize.observe(stage);
    return () => {
      resize.disconnect();
      artwork.destroy();
    };
  }, []);

  return (
    <div className="resume-story air-artwork" ref={root}>
      <div className="resume-story-stage" aria-hidden="true">
        <div className="resume-story-paper" />
        <div className="resume-story-name">
          <strong>Alex Morgan</strong>
          <span>Product designer · Berlin</span>
        </div>
        {chapters.map(([title, first, second, label], i) => (
          <div key={title}>
            <div className="resume-story-chapter" style={{ transform: move(-76, 128 + i * 87) }}>
              <strong>{title}</strong>
              <span>
                {first}
                <br />
                {second}
              </span>
            </div>
            <span className="resume-story-label">{label}</span>
            <span className="resume-story-node" style={{ transform: move(-97, 134 + i * 87) }} />
          </div>
        ))}
        {pieces.map((t) => (
          <span className="resume-story-line" key={t} style={{ transform: pose(t, 1, 0) }} />
        ))}
      </div>
      <button
        className="air-artwork-replay"
        type="button"
        aria-label="Replay CloakResume animation"
        hidden
      />
    </div>
  );
}
