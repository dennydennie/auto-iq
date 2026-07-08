import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Images, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { absoluteSiteUrl } from "@/lib/site-url";

const links = [
  { href: "/buy-a-car", label: "Buy a car" },
  { href: "/sell-my-car", label: "Sell my car" },
  { href: "/vehicles", label: "Browse" },
];

export const metadata: Metadata = {
  title: "Sell my car in Zimbabwe | BiSell AutoIQ",
  description:
    "List your vehicle with photos, documents, review status, and protected buyer interactions on BiSell AutoIQ.",
  alternates: { canonical: absoluteSiteUrl("/sell-my-car") },
  openGraph: {
    title: "Sell my car in Zimbabwe | BiSell AutoIQ",
    description: "Create a structured vehicle listing and keep quotes, viewings, and admin review in one place.",
    url: absoluteSiteUrl("/sell-my-car"),
    siteName: "BiSell AutoIQ",
    type: "website",
  },
};

export default function SellMyCarPage() {
  return (
    <>
      <SiteHeader links={links} homeHref="/" primaryCta={{ href: "/auth/login", label: "Sign in" }} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_28px_90px_-48px_rgba(10,30,77,0.55)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="rounded-[1.75rem] bg-[radial-gradient(circle_at_top_right,rgba(255,199,44,0.2),transparent_42%),linear-gradient(180deg,#18233e_0%,#0a1e4d_100%)] p-5 text-white">
              <div className="grid gap-3">
                {[
                  { icon: ClipboardCheck, title: "Complete listing wizard", body: "Capture core details, price, location, disclosure, and ownership context." },
                  { icon: Images, title: "Add photos and documents", body: "Upload multiple vehicle views so buyers see the listing clearly." },
                  { icon: ShieldCheck, title: "Submit for admin review", body: "Keep buyer requests and moderation visible before a listing goes live." },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-[var(--amber)]" aria-hidden="true" />
                    <h2 className="mt-3 font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/68">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="inline-flex rounded-full bg-[var(--amber-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-dark)]">
                Sell my car
              </p>
              <h1 className="display mt-5 max-w-3xl text-4xl leading-tight text-[var(--ink-900)] sm:text-6xl">
                Build a vehicle listing that buyers can trust.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-500)]">
                Sellers get a dedicated workspace for drafts, photos, admin review,
                buyer viewings, and quote activity without losing track of the deal.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/seller" className={buttonVariants({ variant: "amber" })}>
                  Open seller workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/auth/signup?role=seller" className={buttonVariants({ variant: "outline" })}>
                  Create seller account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
