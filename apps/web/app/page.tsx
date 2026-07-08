import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CarFront, ClipboardCheck } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { absoluteSiteUrl } from "@/lib/site-url";

const links = [
  { href: "/buy-a-car", label: "Buy a car" },
  { href: "/sell-my-car", label: "Sell my car" },
  { href: "/vehicles", label: "Browse" },
];

export const metadata: Metadata = {
  title: "Buy and sell vehicles with confidence",
  description:
    "BiSell AutoIQ helps Zimbabwean buyers and sellers handle vehicle listings, quotes, viewings, and review workflows in one trusted marketplace.",
  alternates: { canonical: absoluteSiteUrl("/") },
};

const siteNavigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: ["Buy a car", "Sell my car"],
  url: [absoluteSiteUrl("/buy-a-car"), absoluteSiteUrl("/sell-my-car")],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
      />
      <SiteHeader links={links} homeHref="/" primaryCta={{ href: "/auth/login", label: "Sign in" }} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.25rem] bg-white p-6 shadow-[0_32px_110px_-58px_rgba(10,30,77,0.6)] sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-[var(--amber-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-dark)]">
                Built for Zimbabwe
              </p>
              <h1 className="display mt-5 max-w-4xl text-5xl leading-[0.95] text-[var(--ink-900)] sm:text-7xl">
                Buy and sell vehicles with full confidence.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--ink-500)]">
                BiSell AutoIQ brings structured listings, buyer-safe interactions,
                seller workflows, and admin review into one marketplace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/buy-a-car" className={buttonVariants({ variant: "amber" })}>
                  Buy a car
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/sell-my-car" className={buttonVariants({ variant: "outline" })}>
                  Sell my car
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] bg-[linear-gradient(180deg,#18233e_0%,#0a1e4d_100%)] p-5 text-white">
              <div className="grid gap-3">
                {[
                  { icon: BadgeCheck, title: "Verified marketplace", body: "Inspection and admin review signals keep listings legible before buyers engage." },
                  { icon: CarFront, title: "Live vehicle catalogue", body: "Buyers can browse by make, price, mileage, body type, city, and trusted status." },
                  { icon: ClipboardCheck, title: "Structured seller flow", body: "Sellers manage drafts, photos, documents, quotes, and viewing requests from one workspace." },
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
