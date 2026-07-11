"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { BiSellLogo } from "@/components/ui/bisell-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SiteHeaderLink = {
  href: string;
  label: string;
};

export type SiteHeaderProps = {
  links: SiteHeaderLink[];
  primaryCta?: { href: string; label: string };
  homeHref?: string;
  /** When true, show a Sign out button instead of the sign-in CTA. */
  signedIn?: boolean;
  variant?: "pill" | "underline";
};

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  links,
  primaryCta,
  homeHref = "/",
  signedIn,
  variant = "pill",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[var(--paper)]/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-[0_16px_36px_-28px_rgba(22,31,58,0.4)]"
        >
          <BiSellLogo size={24} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
                  variant === "underline" && "rounded-none border-b-2 px-3.5",
                  active && variant === "underline"
                    ? "border-[var(--amber)] text-[var(--ink-900)]"
                    : active
                      ? "bg-[var(--ink-900)] text-white"
                      : variant === "underline"
                        ? "border-transparent text-[var(--ink-500)] hover:border-[var(--ink-200)] hover:text-[var(--ink-900)]"
                        : "text-[var(--ink-500)] hover:bg-white hover:text-[var(--ink-900)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <LogoutButton
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            />
          ) : primaryCta ? (
            <Link
              href={primaryCta.href}
              className={buttonVariants({
                variant: "amber",
                size: "sm",
                className: "hidden sm:inline-flex",
              })}
            >
              {primaryCta.label}
            </Link>
          ) : null}

          <button
            type="button"
            aria-controls="site-header-mobile-nav"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ink-200)] bg-white text-[var(--ink-900)] shadow-sm transition hover:bg-[var(--ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-[rgba(10,30,77,0.28)] lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <aside
            id="site-header-mobile-nav"
            className="absolute inset-x-4 top-20 rounded-[1.75rem] border border-white/70 bg-white p-4 shadow-[0_32px_80px_-40px_rgba(22,31,58,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="grid gap-2" aria-label="Mobile primary">
              {links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-[var(--ink-900)] text-white"
                        : "text-[var(--ink-500)] hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)]",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {signedIn ? (
                <LogoutButton
                  variant="outline"
                  className="mt-2 justify-center"
                />
              ) : primaryCta ? (
                <Link
                  href={primaryCta.href}
                  onClick={() => setIsOpen(false)}
                  className={buttonVariants({
                    variant: "amber",
                    className: "mt-2 justify-center",
                  })}
                >
                  {primaryCta.label}
                </Link>
              ) : null}
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
