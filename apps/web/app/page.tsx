import type { Metadata } from "next";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import { HomeLanding } from "@/components/marketing/home-landing";
import { SiteHeader } from "@/components/shared/site-header";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";
import { getPublicJson, isServerApiFailure } from "@/lib/server-api";

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

export default async function HomePage() {
  const referenceResult = await getPublicJson<ReferenceDataResponse>(
    ROUTES.referenceData.all,
  );
  const searchOptions = isServerApiFailure(referenceResult)
    ? { makes: [], cities: [] }
    : {
        makes: referenceResult.data.makes.map((make) => make.name),
        cities: [
          ...new Set(
            referenceResult.data.viewingLocations.map(
              (location) => location.city,
            ),
          ),
        ],
      };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(siteNavigationJsonLd),
        }}
      />
      <SiteHeader
        links={PUBLIC_SITE_LINKS}
        homeHref="/"
        primaryCta={{ href: "/auth/login", messageKey: "auth.signIn" }}
      />
      <HomeLanding searchOptions={searchOptions} />
    </>
  );
}
