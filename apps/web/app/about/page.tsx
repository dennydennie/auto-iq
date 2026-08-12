import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PageContainer } from "@/components/shared/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";

const pillars = [
  {
    icon: BadgeCheck,
    title: "Visible verification",
    body: "Available review and verification signals stay with the listing, keeping vehicle data and seller disclosures legible.",
  },
  {
    icon: CarFront,
    title: "Buyer-safe workflows",
    body: "Quotes, saved vehicles, and viewing requests stay inside BiSell so activity can be tracked.",
  },
  {
    icon: ClipboardCheck,
    title: "Seller structure",
    body: "Sellers move from draft to photos, documents, disclosure, and admin review without guesswork.",
  },
];

export const metadata: Metadata = {
  title: "About us",
  description:
    "BiSell AutoIQ is a Zimbabwe-focused vehicle marketplace for inspected listings, buyer-safe interactions, and structured seller workflows.",
  alternates: { canonical: absoluteSiteUrl("/about") },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader
        links={PUBLIC_SITE_LINKS}
        homeHref="/"
        primaryCta={{ href: "/auth/login", messageKey: "auth.signIn" }}
      />
      <PageContainer as="main" className="py-10">
        <section className="overflow-hidden rounded-[2.25rem] bg-white p-6 shadow-[0_32px_110px_-58px_rgba(10,30,77,0.6)] sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-[var(--amber-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-dark)]">
                Built for Zimbabwe
              </p>
              <h1 className="display mt-5 max-w-4xl text-5xl leading-[0.95] text-[var(--ink-900)] sm:text-7xl">
                A trust layer for buying and selling vehicles.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--ink-500)]">
                BiSell AutoIQ brings inspection signals, verified identities,
                seller workflows, and buyer actions into one marketplace so
                vehicle deals are clearer from first search to handover.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/buy-a-car"
                  className={buttonVariants({ variant: "amber" })}
                >
                  Buy a car
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sell-my-car"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sell my car
                </Link>
              </div>
            </div>

            <Card
              id="verification"
              className="bg-[linear-gradient(180deg,#18233e_0%,#0a1e4d_100%)] text-white"
            >
              <CardHeader>
                <CardTitle className="text-3xl text-white">
                  What the platform protects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pillars.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <Icon
                      className="h-5 w-5 text-[var(--amber)]"
                      aria-hidden="true"
                    />
                    <h2 className="mt-3 font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/68">
                      {body}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="terms" className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <ShieldCheck
                className="h-5 w-5 text-[var(--amber-dark)]"
                aria-hidden="true"
              />
              <CardTitle>Buyer conduct</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-[var(--ink-500)]">
              Keep quotes and viewings inside BiSell so the admin team can
              support the interaction and maintain a reliable record.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <BadgeCheck
                className="h-5 w-5 text-[var(--amber-dark)]"
                aria-hidden="true"
              />
              <CardTitle>Seller disclosure</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-[var(--ink-500)]">
              Sellers should submit accurate specs, photos, documents, and
              disclosure notes before requesting admin review.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ClipboardCheck
                className="h-5 w-5 text-[var(--amber-dark)]"
                aria-hidden="true"
              />
              <CardTitle>Platform review</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-[var(--ink-500)]">
              Admin moderation keeps listings, viewing locations, and
              marketplace workflows aligned with BiSell operating standards.
            </CardContent>
          </Card>
        </section>
      </PageContainer>
      <SiteFooter />
    </>
  );
}
