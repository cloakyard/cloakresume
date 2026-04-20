/**
 * Circular ATS score ring. Auto-compacts stroke + typography below 110px.
 */

interface AtsScoreRingProps {
  score: number;
  color: string;
  size?: number;
}

export function AtsScoreRing({ score, color, size = 136 }: AtsScoreRingProps) {
  const compact = size < 110;
  const stroke = compact ? 6 : 8;
  const numFontPx = compact ? 26 : 42;
  const captionFontPx = compact ? 8.5 : 10.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true" className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
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
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center leading-none"
        style={{ color: "var(--ink-1)" }}
      >
        <span
          className="font-mono font-semibold tabular-nums tracking-[-0.02em]"
          style={{ fontSize: numFontPx }}
        >
          {clamped}
        </span>
        <span
          className="mt-1 font-mono font-medium tracking-wider"
          style={{ color: "var(--ink-5)", fontSize: captionFontPx }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
