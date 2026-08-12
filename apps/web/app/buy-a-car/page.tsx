import type { Metadata } from "next";
import type { CatalogueResponse } from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import { BuyCarFunnel } from "@/components/marketing/buy-car-funnel";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import {
  getOptionalSessionJson,
  getPublicJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";

export const metadata: Metadata = {
  title: "Buy a car in Zimbabwe",
  description:
    "Browse marketplace vehicles, compare trust signals, and request quotes or viewings through BiSell AutoIQ.",
  alternates: { canonical: absoluteSiteUrl("/buy-a-car") },
  openGraph: {
    title: "Buy a car in Zimbabwe | BiSell AutoIQ",
    description:
      "Browse vehicles with visible inspection and seller verification status.",
    url: absoluteSiteUrl("/buy-a-car"),
    siteName: "BiSell AutoIQ",
    type: "website",
  },
};

export default async function BuyACarPage() {
  const [catalogueResult, meResult, referenceResult] = await Promise.all([
    getPublicJson<CatalogueResponse>(
      withQuery(ROUTES.catalogue.list, {
        limit: 4,
        sortBy: "publishedAt",
        sortDir: "DESC",
      }),
    ),
    getOptionalSessionJson<MeResponse>(ROUTES.me.profile),
    getPublicJson<ReferenceDataResponse>(ROUTES.referenceData.all),
  ]);
  const listings = isServerApiFailure(catalogueResult)
    ? []
    : catalogueResult.data.data;
  const signedIn = meResult !== null && meResult.ok;
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
      <SiteHeader
        links={PUBLIC_SITE_LINKS}
        homeHref="/"
        primaryCta={
          signedIn
            ? undefined
            : { href: "/auth/login", messageKey: "auth.signIn" }
        }
        signedIn={signedIn}
      />
      <BuyCarFunnel
        listings={listings}
        signedIn={signedIn}
        searchOptions={searchOptions}
      />
      <SiteFooter />
    </>
  );
}
