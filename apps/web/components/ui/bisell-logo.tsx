export function BiSellLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Hexagonal mark */}
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon
          points="20,2 36,11 36,29 20,38 4,29 4,11"
          fill="#FFC72C"
        />
        <polygon
          points="20,7 32,14 32,27 20,34 8,27 8,14"
          fill="#0A1E4D"
        />
        <text x="20" y="25" textAnchor="middle" fill="#FFC72C"
          fontSize="12" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">B</text>
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "Bricolage Grotesque, sans-serif",
          fontWeight: 800,
          fontSize: size * 0.65,
          color: "#0A1E4D",
          letterSpacing: "-0.02em",
        }}>BiSell.</div>
        <div style={{
          fontFamily: "Geist Mono, monospace",
          fontWeight: 600,
          fontSize: size * 0.3,
          color: "#FFC72C",
          letterSpacing: "0.12em",
        }}>AUTO·IQ</div>
      </div>
    </div>
  );
}
