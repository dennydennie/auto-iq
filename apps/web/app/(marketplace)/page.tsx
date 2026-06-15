import Link from "next/link";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { Search, SlidersHorizontal, Bell } from "lucide-react";

const BODY_TYPES = [
  { label: "All", active: true },
  { label: "Bakkies", type: "bakkie" },
  { label: "Sedans",  type: "sedan" },
  { label: "SUVs",    type: "suv" },
  { label: "Hatch",   type: "hatch" },
  { label: "Vans",    type: "sedan" },
];

const LISTINGS = [
  { id: "1", year: 2021, make: "Toyota", model: "Hilux", price: "19,500", score: 82, type: "bakkie" as const },
  { id: "2", year: 2020, make: "Honda",  model: "CR-V",  price: "16,200", score: 75, type: "suv" as const },
  { id: "3", year: 2022, make: "VW",     model: "Polo",  price: "11,800", score: 88, type: "hatch" as const },
  { id: "4", year: 2019, make: "Toyota", model: "Camry", price: "14,000", score: 71, type: "sedan" as const },
];

export default function BrowsePage() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 0 18px",
        borderBottom: "1px solid var(--ink-100)",
        marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 2 }}>Mhoro, Tendai 👋</div>
          <h1 className="display" style={{ fontSize: 28, lineHeight: 1.1 }}>
            Find your <span style={{ color: "var(--amber-dark)" }}>next ride</span>
          </h1>
        </div>
        <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer" }}>
          <Bell size={22} color="var(--ink-500)" />
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 8, height: 8, borderRadius: "50%",
            background: "#FFC72C",
          }} />
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          border: "1px solid var(--ink-200)",
          borderRadius: 12,
          padding: "12px 16px",
        }}>
          <Search size={16} color="var(--ink-400)" />
          <span style={{ fontSize: 14, color: "var(--ink-400)" }}>Search make, model, year…</span>
        </div>
        <button className="btn btn-ink" style={{ borderRadius: 12, padding: "0 18px" }}>
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Body type filter pills */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24 }}>
        {BODY_TYPES.map((bt) => (
          <button key={bt.label} style={{
            padding: "8px 18px",
            borderRadius: 999,
            border: bt.active ? "none" : "1px solid var(--ink-200)",
            background: bt.active ? "var(--ink-900)" : "#fff",
            color: bt.active ? "#FFC72C" : "var(--ink-500)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}>{bt.label}</button>
        ))}
      </div>

      {/* Hero featured card */}
      <div style={{
        borderRadius: 20,
        background: "linear-gradient(135deg, var(--ink-800) 0%, var(--ink-900) 60%, var(--earth) 100%)",
        padding: "24px 28px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
        minHeight: 160,
      }}>
        <div style={{ zIndex: 1 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#FFC72C",
            marginBottom: 8,
          }}>⭐ This week&apos;s pick</div>
          <div className="display" style={{ fontSize: 24, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
            2021 Toyota Hilux
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
            Harare · 47,200 km · 4WD
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="display" style={{ fontSize: 22, color: "#FFC72C" }}>USD 19,500</div>
            <Link href="/vehicles/1" className="btn btn-amber" style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8 }}>
              View →
            </Link>
          </div>
        </div>
        <div style={{ position: "absolute", right: -20, bottom: 0, opacity: 0.9 }}>
          <CarSilhouette type="bakkie" width={320} />
        </div>
      </div>

      {/* Just inspected section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 18 }}>Just inspected</h2>
        <Link href="/vehicles" style={{ fontSize: 13, color: "var(--ink-400)", textDecoration: "none" }}>See all →</Link>
      </div>

      {/* Vehicle card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {LISTINGS.map((v) => (
          <Link key={v.id} href={`/vehicles/${v.id}`} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid var(--ink-100)",
              overflow: "hidden",
              transition: "box-shadow 0.15s",
            }}>
              {/* Car stage */}
              <div style={{
                height: 110,
                background: "linear-gradient(135deg, var(--ink-800) 0%, var(--ink-900) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}>
                <CarSilhouette type={v.type} width={160} shadow={false} />
                {/* Score badge */}
                <div style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(4px)",
                  borderRadius: 6,
                  padding: "2px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <span style={{ fontSize: 10, color: "#FFC72C" }}>●</span>
                  <span className="mono" style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{v.score}</span>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--ink-400)", marginBottom: 2 }}>{v.year}</div>
                <div className="display" style={{ fontSize: 15, color: "var(--ink-900)", marginBottom: 6 }}>
                  {v.make} {v.model}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-400)", fontFamily: "monospace" }}>USD</span>
                  <span className="display mono" style={{ fontSize: 16, color: "var(--ink-900)" }}>{v.price}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
