/**
 * Renders an actual template component at small scale for the picker.
 *
 * The resume page is natively rendered at 210mm width and then scaled
 * down via CSS transform into a card-sized box. The container width is
 * measured with a ResizeObserver so the scale stays correct across any
 * viewport width — the scaled content always fills the card precisely.
 *
 * An overlay intercepts pointer events so clicks reach the card button.
 */

import { Suspense, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from "react";
import type { ResumeData } from "../types.ts";
import { derivePalette, type PrimaryPalette } from "../utils/colors.ts";
import type { TemplateProps } from "../templates/index.ts";

interface Props {
  TemplateComponent: ComponentType<TemplateProps>;
  resume: ResumeData;
  accent: string;
}

/** 1mm in CSS pixels at 96dpi (used to match `210mm` template pages). */
const PX_PER_MM = 96 / 25.4;
const A4_WIDTH_PX = 210 * PX_PER_MM; // ≈ 794 px

export function TemplatePreview({ TemplateComponent, resume, accent }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? el.clientWidth;
      if (w > 0) {
        const nextScale = w / A4_WIDTH_PX;
        setScale((currentScale) =>
          Math.abs(currentScale - nextScale) > 0.0001 ? nextScale : currentScale,
        );
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Override the palette purely for this preview — using the template's
   * suggested accent means cards stay distinguishable even when the
   * user picks a brand colour that clashes with one template.
   */
  const palette: PrimaryPalette = useMemo(() => derivePalette(accent), [accent]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      inert
      aria-hidden="true"
      tabIndex={-1}
      style={{
        aspectRatio: "210 / 297",
        overflow: "hidden",
        background: "var(--color-proof-paper)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${A4_WIDTH_PX}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Suspense fallback={<div className="resume-page bg-(--color-proof-paper)" />}>
          <TemplateComponent resume={resume} palette={palette} />
        </Suspense>
      </div>
    </div>
  );
}
