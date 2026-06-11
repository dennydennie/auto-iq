type CarType = "sedan" | "suv" | "hatch" | "bakkie";

const PATHS: Record<CarType, string> = {
  sedan: "M30 130 L60 130 Q70 95 95 90 L150 88 L170 70 Q185 60 215 60 L290 64 Q310 66 330 90 L370 95 Q380 98 380 110 L380 130 L350 130 Q345 145 330 145 Q315 145 310 130 L100 130 Q95 145 80 145 Q65 145 60 130 Z",
  suv:   "M28 132 L60 132 Q68 96 92 90 L132 90 L155 60 Q170 50 200 50 L300 52 Q322 54 345 88 L378 96 Q388 100 388 116 L388 132 L355 132 Q350 148 332 148 Q314 148 309 132 L100 132 Q95 148 78 148 Q60 148 55 132 Z",
  hatch: "M40 130 L65 130 Q72 96 100 90 L150 90 L175 64 Q190 56 220 56 L295 60 Q315 64 326 90 L350 100 Q360 105 358 124 L358 130 L335 130 Q330 144 315 144 Q300 144 295 130 L100 130 Q95 144 80 144 Q65 144 60 130 Z",
  bakkie:"M22 132 L60 132 Q68 96 92 90 L145 90 L165 65 Q180 56 210 56 L240 58 Q258 60 264 80 L266 95 L390 95 Q395 95 395 102 L395 132 L360 132 Q355 148 338 148 Q320 148 315 132 L100 132 Q95 148 78 148 Q60 148 55 132 Z",
};

const WINDOW_PATHS: Record<CarType, string> = {
  sedan: "M175 72 Q185 64 215 64 L285 68 Q300 70 315 88 L180 88 Z",
  suv:   "M160 63 Q172 53 200 53 L295 55 Q316 57 338 88 L158 90 Z",
  hatch: "M178 67 Q192 59 220 59 L292 63 Q308 67 318 90 L176 90 Z",
  bakkie:"M168 68 Q180 59 210 59 L238 61 Q252 63 258 85 L166 85 Z",
};

interface CarSilhouetteProps {
  type?: CarType;
  color?: string;
  accent?: string;
  shadow?: boolean;
  width?: number;
}

export function CarSilhouette({
  type = "sedan",
  color = "#1F2E5C",
  accent = "#FFC72C",
  shadow = true,
  width = 200,
}: CarSilhouetteProps) {
  const vbW = type === "bakkie" ? 420 : 410;
  const vbH = 160;
  const scale = width / vbW;
  const height = vbH * scale;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {shadow && (
        <ellipse cx={vbW / 2} cy={148} rx={vbW * 0.43} ry={8} fill="rgba(0,0,0,0.18)" />
      )}
      {/* Body */}
      <path d={PATHS[type]} fill={color} />
      {/* Accent belt */}
      <path d={PATHS[type]} fill={accent} opacity={0.15} />
      {/* Window */}
      <path d={WINDOW_PATHS[type]} fill="rgba(255,255,255,0.18)" />
      {/* Headlight */}
      <ellipse cx={type === "bakkie" ? 390 : 372} cy={112} rx={8} ry={5} fill={accent} />
      {/* Wheels */}
      <circle cx={type === "bakkie" ? 78 : 78} cy={132} r={16} fill="#111827" />
      <circle cx={type === "bakkie" ? 78 : 78} cy={132} r={7} fill="#4B5563" />
      <circle cx={type === "bakkie" ? 337 : (type === "sedan" ? 330 : 330)} cy={132} r={16} fill="#111827" />
      <circle cx={type === "bakkie" ? 337 : (type === "sedan" ? 330 : 330)} cy={132} r={7} fill="#4B5563" />
    </svg>
  );
}
