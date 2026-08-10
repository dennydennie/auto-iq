import type { Metadata } from "next";
import { HomeLanding } from "@/components/marketing/home-landing";
import { SiteHeader } from "@/components/shared/site-header";
import { absoluteSiteUrl } from "@/lib/site-url";

const links = [
  { href: "/buy-a-car", messageKey: "nav.buy" as const },
  { href: "/sell-my-car", messageKey: "nav.sell" as const },
  { href: "/vehicles", messageKey: "nav.browse" as const },
];

export const metadata: Metadata = {
  title: "Your next car. Your next move.",
  description:
    "Buy and sell vehicles in Zimbabwe with the facts up front, structured requests, and a clear path from search to handover.",
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
      <SiteHeader links={links} homeHref="/" primaryCta={{ href: "/auth/login", messageKey: "auth.signIn" }} variant="underline" />
      <HomeLanding />
    </>
  );
}
