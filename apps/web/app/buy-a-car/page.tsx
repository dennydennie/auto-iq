import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { absoluteSiteUrl } from "@/lib/site-url";

const links = [
  { href: "/buy-a-car", label: "Buy a car" },
  { href: "/sell-my-car", label: "Sell my car" },
  { href: "/vehicles", label: "Browse" },
];

export const metadata: Metadata = {
  title: "Buy a car in Zimbabwe | BiSell AutoIQ",
  description:
    "Browse inspected vehicles, compare trust signals, and request quotes or viewings through BiSell AutoIQ.",
  alternates: { canonical: absoluteSiteUrl("/buy-a-car") },
  openGraph: {
    title: "Buy a car in Zimbabwe | BiSell AutoIQ",
    description: "Browse inspected vehicles with seller verification and protected buyer workflows.",
    url: absoluteSiteUrl("/buy-a-car"),
    siteName: "BiSell AutoIQ",
    type: "website",
  },
};

export default function BuyACarPage() {
  return (
    <>
      <SiteHeader links={links} homeHref="/" primaryCta={{ href: "/auth/login", label: "Sign in" }} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_28px_90px_-48px_rgba(10,30,77,0.55)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-[var(--amber-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-dark)]">
                Buy a car
              </p>
              <h1 className="display mt-5 max-w-3xl text-4xl leading-tight text-[var(--ink-900)] sm:text-6xl">
                Find inspected vehicles without chasing unknown sellers.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-500)]">
                BiSell AutoIQ gives buyers a cleaner catalogue, seller-safe contact,
                and request workflows that stay visible to the admin team.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/vehicles" className={buttonVariants({ variant: "amber" })}>
                  Browse vehicles
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/auth/signup?role=buyer" className={buttonVariants({ variant: "outline" })}>
                  Create buyer account
                </Link>
              </div>
            </div>
            <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#18233e_0%,#0a1e4d_100%)] p-5 text-white">
              <div className="grid gap-3">
                {[
                  { icon: Search, title: "Search the live catalogue", body: "Filter by make, city, body type, year, mileage, and price." },
                  { icon: ShieldCheck, title: "Compare trust signals", body: "Use inspection and verification context before booking a viewing." },
                  { icon: SlidersHorizontal, title: "Act from one account", body: "Save vehicles, request quotes, and book viewings without side deals." },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-[var(--amber)]" aria-hidden="true" />
                    <h2 className="mt-3 font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/68">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
