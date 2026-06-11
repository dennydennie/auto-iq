interface ScoreGaugeProps {
  score: number;
  size?: number;
  light?: boolean;
}

export function ScoreGauge({ score, size = 80, light = false }: ScoreGaugeProps) {
  const r = (size / 2) - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.max(0, Math.min(100, score)) / 100;
  const dash = fraction * circumference;

  const color = score >= 80 ? "#1F7A4C" : score >= 60 ? "#FFC72C" : "#9B1C1C";
  const trackColor = light ? "rgba(255,255,255,0.15)" : "#ECEEF4";
  const textColor = light ? "#FFFFFF" : "#0A1E4D";
  const labelColor = light ? "rgba(255,255,255,0.6)" : "#8089A3";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
