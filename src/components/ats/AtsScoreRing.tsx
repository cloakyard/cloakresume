/**
 * Circular ATS score ring. Auto-compacts stroke + typography below 110px.
 *
 * Number + "/100" are rendered as a tightly-spaced flex stack and the whole
 * group is vertically centered, which gives equal breathing room above the
 * number and below the caption without either element hugging the arc.
 */

interface AtsScoreRingProps {
  score: number;
  color: string;
  size?: number;
}

export function AtsScoreRing({ score, color, size = 136 }: AtsScoreRingProps) {
  const compact = size < 110;
  const stroke = compact ? 5.5 : 8;
  const numFontPx = compact ? 22 : 38;
  const captionFontPx = compact ? 7.5 : 9.5;
  const gap = compact ? 3 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c - (clamped / 100) * c;
  const glow = `color-mix(in srgb, ${color} 32%, transparent)`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        aria-hidden="true"
        className="-rotate-90"
        style={{ overflow: "visible" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset .6s ease",
            filter: `drop-shadow(0 0 4px ${glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap }}>
        <span
          className="font-mono font-semibold tabular-nums tracking-[-0.03em]"
          style={{ color: "var(--ink-1)", fontSize: numFontPx, lineHeight: 1 }}
        >
          {clamped}
        </span>
        <span
          className="font-mono tracking-[0.12em] opacity-70"
          style={{ color: "var(--ink-5)", fontSize: captionFontPx, lineHeight: 1 }}
        >
          /100
        </span>
      </div>
    </div>
  );
}
