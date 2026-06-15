interface ScoreGaugeProps {
  score: number;
  size?: number;
  light?: boolean;
  ariaLabel?: string;
}

export function ScoreGauge({ score, size = 80, light = false, ariaLabel }: ScoreGaugeProps) {
  const r = (size / 2) - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.max(0, Math.min(100, score)) / 100;
  const dash = fraction * circumference;

  const color = score >= 80 ? "var(--verified)" : score >= 60 ? "var(--amber)" : "var(--reject)";
  const trackColor = light ? "rgba(255,255,255,0.15)" : "var(--ink-100)";
  const textColor = light ? "#FFFFFF" : "var(--ink-900)";
  const labelColor = light ? "rgba(255,255,255,0.6)" : "var(--ink-400)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel ?? `Inspection score ${score} out of 100`}
    >
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={6}
      />
      {/* Arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Score number */}
      <text
        x={cx} y={cy - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={size * 0.26}
        fontWeight="700"
        fontFamily="Geist Mono, monospace"
      >{score}</text>
      <text
        x={cx} y={cy + size * 0.17}
        textAnchor="middle"
        fill={labelColor}
        fontSize={size * 0.14}
        fontFamily="Geist, sans-serif"
      >/100</text>
    </svg>
  );
}
