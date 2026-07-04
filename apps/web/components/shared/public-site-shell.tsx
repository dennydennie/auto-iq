import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";

const PUBLIC_LINKS = [
  { href: "/buy-a-car", label: "Buy a Car" },
  { href: "/sell-my-car", label: "Sell My Car" },
  { href: "/vehicles", label: "Browse" },
  { href: "/about", label: "About" },
] as const;

export function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader
        links={[...PUBLIC_LINKS]}
        homeHref="/"
        primaryCta={{ href: "/auth/login", label: "Sign in" }}
      />
      {children}
      <footer className="border-t border-white/70 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-[var(--ink-500)] sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <p>BiSell AutoIQ helps Zimbabwean buyers and sellers move through verified vehicle workflows.</p>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            {PUBLIC_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="font-semibold text-[var(--ink-900)] hover:text-[var(--amber-dark)]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
