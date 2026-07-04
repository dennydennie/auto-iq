import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { PublicSiteShell } from "@/components/shared/public-site-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Buy a Car",
  description:
    "Browse cars for sale in Zimbabwe with verified sellers, inspection-backed details, and secure buyer workflows.",
  alternates: {
    canonical: "/buy-a-car",
  },
};

const buyerPoints = [
  "Filter by make, city, body type, fuel, price, mileage, and year.",
  "Open each vehicle page to view photos, specs, seller disclosures, and inspection signals.",
  "Save vehicles, request quotes, and arrange viewings after signing in.",
];

export default function BuyCarPage() {
  return (
    <PublicSiteShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_120px_-55px_rgba(22,31,58,0.45)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div>
            <Badge variant="amber">Buy a car</Badge>
            <h1 className="display mt-5 text-5xl leading-[0.92] text-[var(--ink-900)] sm:text-6xl">
              Find inspected cars for sale in Zimbabwe.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-500)]">
              Start with the live catalogue, compare the cars that match your budget,
              and keep your shortlist, quote requests, and viewing bookings in one account.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/vehicles" className={buttonVariants({ variant: "amber", size: "lg" })}>
                Browse vehicles
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/signup?role=buyer&next=/vehicles" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Create buyer account
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white">
            <Search className="h-8 w-8 text-[#FFC72C]" />
            <h2 className="display mt-4 text-3xl text-white">Buyer workflow</h2>
            <ul className="mt-5 space-y-3">
              {buyerPoints.map((point) => (
                <li key={point} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/72">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC72C]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-[0_24px_70px_-52px_rgba(22,31,58,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <ShieldCheck className="h-6 w-6 text-[var(--amber-dark)]" />
              <h2 className="display mt-3 text-3xl text-[var(--ink-900)]">Why BiSell for buyers?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--ink-500)]">
                Vehicle pages are built around practical information for local buyers:
                location, price, mileage, drivetrain, fuel, photos, and buyer-safe inspection data.
              </p>
            </div>
            <Link href="/vehicles" className={buttonVariants({ variant: "outline" })}>
              View catalogue
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
