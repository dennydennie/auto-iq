"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import {
  Calendar,
  FileText,
  Home,
  ListChecks,
  type LucideIcon,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { BiSellLogo } from "@/components/ui/bisell-logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/listings", label: "Listings", icon: ListChecks },
  { href: "/admin/viewings", label: "Viewings", icon: Calendar },
  { href: "/admin/inspections", label: "Inspections", icon: ShieldCheck },
  { href: "/admin/requests", label: "Buyer requests", icon: Sparkles },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
  icon: Icon,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
  icon: LucideIcon;
}) {
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "inline-flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
        active
          ? "bg-[var(--ink-900)] text-white shadow-[0_22px_45px_-28px_rgba(22,31,58,0.45)]"
          : "text-[var(--ink-500)] hover:bg-white hover:text-[var(--ink-900)]",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-[var(--amber)]" : "text-[var(--ink-400)]")} />
      <span>{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (segment === "login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(214,155,29,0.12),transparent_24%),linear-gradient(180deg,#f7f8fb_0%,#eef2f8_100%)]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-[var(--ink-900)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden min-h-screen w-72 shrink-0 border-r border-white/60 bg-white/72 px-6 py-6 backdrop-blur lg:flex lg:flex-col">
          <Link href="/admin" className="rounded-[1.5rem] bg-[var(--ink-900)] px-5 py-4 text-white">
            <BiSellLogo size={28} />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Admin console
            </p>
          </Link>

          <nav className="mt-6 flex flex-1 flex-col gap-2" aria-label="Admin">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} pathname={pathname} {...item} />
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/70 bg-[var(--paper)]/92 px-4 py-4 backdrop-blur sm:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link href="/admin" className="rounded-[1.25rem] bg-white px-4 py-3 shadow-[0_16px_36px_-28px_rgba(22,31,58,0.4)]">
                <BiSellLogo size={26} />
              </Link>
              <button
                type="button"
                aria-controls="admin-mobile-nav"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close admin navigation" : "Open admin navigation"}
                onClick={() => setIsMenuOpen((current) => !current)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--ink-200)] bg-white text-[var(--ink-900)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {isMenuOpen ? (
            <div className="fixed inset-0 z-30 bg-[rgba(10,30,77,0.28)] lg:hidden" onClick={() => setIsMenuOpen(false)}>
              <aside
                id="admin-mobile-nav"
                className="absolute inset-x-4 top-20 rounded-[1.75rem] border border-white/70 bg-white p-4 shadow-[0_32px_80px_-40px_rgba(22,31,58,0.45)]"
                onClick={(event) => event.stopPropagation()}
              >
                <nav className="grid gap-2" aria-label="Admin mobile">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.href}
                      pathname={pathname}
                      onNavigate={() => setIsMenuOpen(false)}
                      {...item}
                    />
                  ))}
                </nav>
              </aside>
            </div>
          ) : null}

          <div id="admin-content" className="min-w-0 flex-1 py-4 lg:py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
