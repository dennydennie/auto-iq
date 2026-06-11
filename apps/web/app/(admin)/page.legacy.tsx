import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { ArrowRight, TrendingUp, Eye, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

const PENDING = [
  { id: "LST-1042", seller: "Rumbi Chikwanda", make: "Toyota", model: "Hilux", year: 2021, status: "submitted" as const, age: "2h ago", type: "bakkie" as const },
  { id: "LST-1039", seller: "Tendai Moyo",     make: "Honda",  model: "CR-V",  year: 2020, status: "changes" as const,   age: "5h ago", type: "suv" as const },
  { id: "LST-1035", seller: "Farai Ncube",      make: "Toyota", model: "Camry", year: 2019, status: "inspection" as const, age: "1d ago", type: "sedan" as const },
  { id: "LST-1031", seller: "Chipo Mutasa",     make: "VW",     model: "Polo",  year: 2022, status: "submitted" as const,  age: "1d ago", type: "hatch" as const },
  { id: "LST-1028", seller: "Bongani Dube",     make: "Ford",   model: "Ranger",year: 2020, status: "verifying" as const,  age: "2d ago", type: "bakkie" as const },
];

const PIPELINE = [
  { label: "Submitted",  count: 12, color: "#FFC72C" },
  { label: "Inspection", count: 4,  color: "#F47B20" },
  { label: "Verifying",  count: 3,  color: "#14245F" },
  { label: "Approved",   count: 8,  color: "#1F7A4C" },
  { label: "Published",  count: 41, color: "#0A1E4D" },
];

const ACTIVITY = [
  { text: "LST-1040 approved and published",              time: "10m ago",  color: "#1F7A4C" },
  { text: "Inspection completed for LST-1039",            time: "42m ago",  color: "#FFC72C" },
  { text: "Changes requested on LST-1038 by Admin",       time: "1h ago",   color: "#F47B20" },
  { text: "New listing LST-1042 submitted by Rumbi C.",   time: "2h ago",   color: "#0A1E4D" },
  { text: "Viewing confirmed — Toyota Hilux, Wed 11am",   time: "3h ago",   color: "#14245F" },
];

const KPI = [
  { label: "Pending review", value: "12", delta: "+3 today", icon: Clock,       navy: true },
  { label: "Live listings",  value: "41", delta: "+2 this week", icon: Eye,     navy: false },
  { label: "Inspections",    value: "4",  delta: "due this week", icon: Shield2, navy: false },
  { label: "Approved today", value: "2",  delta: "↑ from 1 yesterday", icon: CheckCircle, navy: false },
];

function Shield2({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

export default function AdminOverviewPage() {
  const maxPipeline = Math.max(...PIPELINE.map(p => p.count));
  return (
    <AdminShell title="Overview" breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}>
      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{
              borderRadius: 14,
              padding: "20px 22px",
              background: k.navy ? "var(--ink-900)" : "#fff",
              border: k.navy ? "none" : "1px solid var(--ink-100)",
              boxShadow: "0 2px 8px rgba(10,30,77,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: k.navy ? "rgba(255,255,255,0.5)" : "var(--ink-400)", marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
                  <div className="display" style={{ fontSize: 36, color: k.navy ? "#FFC72C" : "var(--ink-900)", lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 12, marginTop: 6, color: k.navy ? "rgba(255,255,255,0.45)" : "var(--ink-400)" }}>{k.delta}</div>
                </div>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 8,
                  background: k.navy ? "rgba(255,199,44,0.12)" : "var(--ink-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: k.navy ? "#FFC72C" : "var(--ink-400)",
                }}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Pending table */}
        <div style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid var(--ink-100)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--ink-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="display" style={{ fontSize: 15 }}>Pending review</h2>
            <Link href="/admin/listings" style={{ fontSize: 12, color: "var(--ink-400)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Age</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {PENDING.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 52, height: 36,
                        background: "var(--ink-900)",
                        borderRadius: 6,
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CarSilhouette type={row.type} width={48} shadow={false} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>{row.year} {row.make} {row.model}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-400)" }}>{row.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{row.seller}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--ink-400)" }}>{row.age}</td>
                  <td>
                    <Link href={`/admin/listings/${row.id}`}>
                      <ArrowRight size={16} color="var(--ink-300)" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Pipeline */}
          <div style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid var(--ink-100)",
            padding: "18px 20px",
          }}>
            <h2 className="display" style={{ fontSize: 15, marginBottom: 16 }}>Listing pipeline</h2>
            {PIPELINE.map((p) => (
              <div key={p.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{p.label}</span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-700)", fontWeight: 700 }}>{p.count}</span>
                </div>
                <div className="progress-seg">
                  <div style={{ width: `${(p.count / maxPipeline) * 100}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid var(--ink-100)",
            padding: "18px 20px",
            flex: 1,
          }}>
            <h2 className="display" style={{ fontSize: 15, marginBottom: 14 }}>Recent activity</h2>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
