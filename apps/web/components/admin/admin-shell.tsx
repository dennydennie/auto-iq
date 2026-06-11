"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, List, Shield, Calendar, Sparkles,
  User, FileText, Settings, Search,
} from "lucide-react";
import { BiSellLogo } from "@/components/ui/bisell-logo";

const NAV = [
  { href: "/admin",             icon: Home,      label: "Overview",        count: 0 },
  { href: "/admin/listings",    icon: List,       label: "Approval queue",  count: 12 },
  { href: "/admin/inspections", icon: Shield,     label: "Inspections",     count: 4 },
  { href: "/admin/viewings",    icon: Calendar,   label: "Viewings",        count: 7 },
  { href: "/admin/requests",    icon: Sparkles,   label: "Buyer requests",  count: 0 },
  { href: "/admin/users",       icon: User,       label: "Users",           count: 0 },
  { href: "/admin/reports",     icon: FileText,   label: "Reports",         count: 0 },
  { href: "/admin/settings",    icon: Settings,   label: "Settings",        count: 0 },
];

export function AdminShell({
  children,
  title,
  breadcrumbs,
}: {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--paper)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: "var(--ink-900)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <BiSellLogo size={28} />
          <div style={{
            marginTop: 8,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
          }}>Admin Console</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV.map(({ href, icon: Icon, label, count }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  marginBottom: 2,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#FFC72C" : "rgba(255,255,255,0.65)",
                  background: active ? "rgba(255,199,44,0.1)" : "transparent",
                  borderLeft: active ? "3px solid #FFC72C" : "3px solid transparent",
                  transition: "all 0.12s",
                  position: "relative",
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {count > 0 && (
                  <span style={{
                    background: active ? "#FFC72C" : "rgba(255,255,255,0.15)",
                    color: active ? "#0A1E4D" : "rgba(255,255,255,0.7)",
                    borderRadius: 10,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 20,
                    textAlign: "center",
                  }}>{count}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: "50%",
            background: "#FFC72C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#0A1E4D",
          }}>DM</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Dennis M.</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Admin</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid var(--ink-100)",
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ flex: 1 }}>
            {breadcrumbs && (
              <div style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 2, display: "flex", gap: 6, alignItems: "center" }}>
                {breadcrumbs.map((b, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
                    {b.href ? <Link href={b.href} style={{ color: "inherit", textDecoration: "none" }}>{b.label}</Link> : <span>{b.label}</span>}
                  </span>
                ))}
              </div>
            )}
            <h1 className="display" style={{ fontSize: 18, color: "var(--ink-900)" }}>{title}</h1>
          </div>

          {/* Search */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--ink-50)",
            border: "1px solid var(--ink-200)",
            borderRadius: 8,
            padding: "7px 14px",
            width: 220,
          }}>
            <Search size={14} color="var(--ink-400)" />
            <span style={{ fontSize: 13, color: "var(--ink-400)" }}>Search… </span>
            <kbd style={{
              marginLeft: "auto",
              fontSize: 10,
              background: "var(--ink-200)",
              borderRadius: 4,
              padding: "1px 5px",
              color: "var(--ink-500)",
            }}>⌘K</kbd>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
