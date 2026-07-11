import type { Metadata } from "next";
import type { CatalogueResponse } from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { BuyCarFunnel } from "@/components/marketing/buy-car-funnel";
import { SiteHeader } from "@/components/shared/site-header";
import {
  getOptionalSessionJson,
  getPublicJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
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
    description:
      "Browse inspected vehicles with seller verification and protected buyer workflows.",
    url: absoluteSiteUrl("/buy-a-car"),
    siteName: "BiSell AutoIQ",
    type: "website",
  },
};

export default async function BuyACarPage() {
  const [catalogueResult, meResult] = await Promise.all([
    getPublicJson<CatalogueResponse>(
      withQuery(ROUTES.catalogue.list, {
        limit: 4,
        sortBy: "publishedAt",
        sortDir: "DESC",
      }),
    ),
    getOptionalSessionJson<MeResponse>(ROUTES.me.profile),
  ]);
  const listings = isServerApiFailure(catalogueResult)
    ? []
    : catalogueResult.data.data;
  const signedIn = meResult !== null && meResult.ok;

  return (
    <>
      <SiteHeader
        links={links}
        homeHref="/"
        primaryCta={
          signedIn ? undefined : { href: "/auth/login", label: "Sign in" }
        }
        signedIn={signedIn}
        variant="underline"
      />
      <BuyCarFunnel listings={listings} signedIn={signedIn} />
    </>
  );
}
