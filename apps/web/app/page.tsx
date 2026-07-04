import Link from "next/link";
import { ArrowRight, BadgeCheck, Car, Search, ShieldCheck } from "lucide-react";
import { PublicSiteShell } from "@/components/shared/public-site-shell";
import { SeoJsonLd } from "@/components/shared/seo-json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BiSellLogo } from "@/components/ui/bisell-logo";

const siteUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://web-staging-1017.up.railway.app";

const navigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BiSell AutoIQ",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/vehicles?make={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
  mainEntity: [
    {
      "@type": "SiteNavigationElement",
      name: "Buy a Car",
      url: `${siteUrl}/buy-a-car`,
    },
    {
      "@type": "SiteNavigationElement",
      name: "Sell My Car",
      url: `${siteUrl}/sell-my-car`,
    },
  ],
};

const steps = [
  {
    icon: Search,
    title: "Browse inspected cars",
    body: "Compare Zimbabwean listings by make, city, price, mileage, fuel type, and inspection status.",
  },
  {
    icon: BadgeCheck,
    title: "Check buyer-safe specs",
    body: "Vehicle pages show the key specs buyers need before arranging a viewing.",
  },
  {
    icon: ShieldCheck,
    title: "Keep the deal traceable",
    body: "Quotes, viewing requests, and saved vehicles stay tied to a verified account.",
  },
];

export default function HomePage() {
  return (
    <PublicSiteShell>
      <SeoJsonLd data={navigationJsonLd} />
      <main className="pb-20">
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-[2.2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_120px_-52px_rgba(22,31,58,0.5)] backdrop-blur sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <BiSellLogo size={42} />
                <Badge variant="amber" className="mt-8">Built for Zimbabwe</Badge>
                <h1 className="display mt-5 max-w-3xl text-5xl leading-[0.9] text-[var(--ink-900)] sm:text-6xl lg:text-7xl">
                  Buy and sell cars with full confidence.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-500)] sm:text-lg">
                  BiSell AutoIQ combines inspected listings, verified sellers, and structured
                  buyer workflows for Zimbabwe&apos;s vehicle market.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/buy-a-car" className={buttonVariants({ variant: "amber", size: "lg" })}>
                    Buy a Car
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/sell-my-car" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Sell My Car
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white shadow-[0_24px_80px_-44px_rgba(5,10,26,0.85)] sm:p-8">
                <Badge variant="amber" className="bg-white/10 text-[#FFC72C]">
                  Trust-first marketplace
                </Badge>
                <h2 className="display mt-4 text-3xl text-white">What buyers see before they call</h2>
                <div className="mt-6 grid gap-3">
                  {steps.map(({ icon: Icon, title, body }) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex gap-3">
                        <Icon className="mt-1 h-5 w-5 shrink-0 text-[#FFC72C]" />
                        <div>
                          <h3 className="font-semibold text-white">{title}</h3>
                          <p className="mt-1 text-sm leading-6 text-white/68">{body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <Link href="/vehicles" className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-[0_24px_70px_-50px_rgba(22,31,58,0.35)] transition hover:-translate-y-0.5">
            <Car className="h-6 w-6 text-[var(--amber-dark)]" />
            <h2 className="display mt-5 text-3xl text-[var(--ink-900)]">Browse vehicles</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-500)]">
              Search live cars for sale in Zimbabwe with filters that match buyer intent.
            </p>
          </Link>
          <Link href="/sell-my-car" className="rounded-[1.75rem] border border-white/70 bg-[var(--ink-900)] p-6 text-white shadow-[0_24px_70px_-50px_rgba(22,31,58,0.55)] transition hover:-translate-y-0.5">
            <ShieldCheck className="h-6 w-6 text-[#FFC72C]" />
            <h2 className="display mt-5 text-3xl text-white">Sell My Car</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Start a seller account, capture vehicle specs, add photos, and track review.
            </p>
          </Link>
          <Link href="/buy-a-car" className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-[0_24px_70px_-50px_rgba(22,31,58,0.35)] transition hover:-translate-y-0.5">
            <Search className="h-6 w-6 text-[var(--amber-dark)]" />
            <h2 className="display mt-5 text-3xl text-[var(--ink-900)]">Buy a Car</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-500)]">
              Open the catalogue, compare specs, save cars, and request viewings securely.
            </p>
          </Link>
        </section>
      </main>
    </PublicSiteShell>
  );
}
