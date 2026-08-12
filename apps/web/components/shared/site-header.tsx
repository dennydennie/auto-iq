"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { PageContainer } from "@/components/shared/page-container";
import { useOverlayDialog } from "@/components/shared/use-overlay-dialog";
import { useLocale } from "@/components/shared/locale-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { BiSellLogo } from "@/components/ui/bisell-logo";
import { buttonVariants } from "@/components/ui/button";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SiteHeaderLink = {
  href: string;
  label?: string;
  messageKey?: MessageKey;
  activePaths?: string[];
};

export type SiteHeaderProps = {
  links: SiteHeaderLink[];
  primaryCta?: { href: string; label?: string; messageKey?: MessageKey };
  homeHref?: string;
  /** When true, show a Sign out button instead of the sign-in CTA. */
  signedIn?: boolean;
};

function matchesPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, link: SiteHeaderLink) {
  return [link.href, ...(link.activePaths ?? [])].some((href) =>
    matchesPath(pathname, href),
  );
}

export function SiteHeader({
  links,
  primaryCta,
  homeHref = "/",
  signedIn,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const { t } = useLocale();
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  useOverlayDialog(isOpen, menuRef, closeMenu);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[var(--paper)]/92 backdrop-blur">
      <PageContainer className="flex items-center justify-between gap-4 py-3">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-[0_16px_36px_-28px_rgba(22,31,58,0.4)]"
        >
          <BiSellLogo size={24} />
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label={t("nav.primary")}
        >
          {links.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
                  active
                    ? "bg-[var(--ink-900)] text-white"
                    : "text-[var(--ink-500)] hover:bg-white hover:text-[var(--ink-900)]",
                )}
              >
                {link.messageKey ? t(link.messageKey) : link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden xl:block">
            <LocaleSwitcher compact />
          </div>
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
              {primaryCta.messageKey
                ? t(primaryCta.messageKey)
                : primaryCta.label}
            </Link>
          ) : null}

          <button
            ref={triggerRef}
            type="button"
            aria-controls="site-header-mobile-nav"
            aria-expanded={isOpen}
            aria-label={isOpen ? t("menu.close") : t("menu.open")}
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ink-200)] bg-white text-[var(--ink-900)] shadow-sm transition hover:bg-[var(--ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </PageContainer>

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-[rgba(10,30,77,0.28)] lg:hidden"
          onMouseDown={closeMenu}
        >
          <aside
            ref={menuRef}
            id="site-header-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mobilePrimary")}
            className="absolute inset-x-4 top-20 rounded-[1.75rem] border border-white/70 bg-white p-4 shadow-[0_32px_80px_-40px_rgba(22,31,58,0.45)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <nav className="grid gap-2" aria-label={t("nav.mobilePrimary")}>
              <div className="mb-2 border-b border-[var(--ink-100)] pb-3">
                <LocaleSwitcher />
              </div>
              {links.map((link) => {
                const active = isActive(pathname, link);
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
                    {link.messageKey ? t(link.messageKey) : link.label}
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
                  {primaryCta.messageKey
                    ? t(primaryCta.messageKey)
                    : primaryCta.label}
                </Link>
              ) : null}
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
