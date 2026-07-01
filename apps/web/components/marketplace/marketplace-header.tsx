import Link from "next/link";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { BiSellLogo } from "@/components/ui/bisell-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOptionalSessionJson } from "@/lib/server-api";

const LINKS = [
  { href: "/buyer", label: "Buyer desk" },
  { href: "/vehicles", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/seller", label: "Sell" },
];

const ADMIN_ROLES = new Set(["ADMIN", "PARTNER_ADMIN", "SYSTEM_ADMINISTRATOR"]);

function primaryCta(result: Awaited<ReturnType<typeof getOptionalSessionJson<MeResponse>>>) {
  if (!result || !result.ok) {
    return { href: "/auth/login", label: "Sign in" };
  }

  if (result.data.roles.some((role) => ADMIN_ROLES.has(role))) {
    return { href: "/admin", label: "Admin" };
  }

  if (result.data.roles.includes("SELLER")) {
    return { href: "/seller/listings/new", label: "New listing" };
  }

  return { href: "/buyer", label: "Buyer desk" };
}

function NavLinks({ activeHref, mobile = false }: { activeHref?: string; mobile?: boolean }) {
  return (
    <nav
      className={cn(
        "items-center gap-1",
        mobile ? "flex overflow-x-auto px-4 pb-3 sm:px-6 md:hidden" : "hidden md:flex",
      )}
      aria-label={mobile ? "Mobile marketplace navigation" : "Marketplace"}
    >
      {LINKS.map((link) => {
        const active = activeHref === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition hover:bg-white hover:text-[var(--ink-900)]",
              active ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export async function MarketplaceHeader({ activeHref }: { activeHref?: string }) {
  const meResult = await getOptionalSessionJson<MeResponse>(ROUTES.me.profile);
  const cta = primaryCta(meResult);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[var(--paper)]/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={meResult?.ok ? "/buyer" : "/vehicles"}
          className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-[0_16px_36px_-28px_rgba(22,31,58,0.4)]"
          aria-label="BiSell AutoIQ marketplace home"
        >
          <BiSellLogo size={24} />
        </Link>

        <NavLinks activeHref={activeHref} />

        <Link
          href={cta.href}
          className={buttonVariants({ variant: "amber", size: "sm", className: "whitespace-nowrap" })}
        >
          {cta.label}
        </Link>
      </div>
      <NavLinks activeHref={activeHref} mobile />
    </header>
  );
}
