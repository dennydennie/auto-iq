import type { Metadata } from "next";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { SellCarFunnel } from "@/components/marketing/sell-car-funnel";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { getOptionalSessionJson } from "@/lib/server-api";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";

export const metadata: Metadata = {
  title: "Sell my car in Zimbabwe",
  description:
    "List your vehicle with photos, documents, review status, and protected buyer interactions on BiSell AutoIQ.",
  alternates: { canonical: absoluteSiteUrl("/sell-my-car") },
  openGraph: {
    title: "Sell my car in Zimbabwe | BiSell AutoIQ",
    description:
      "Create a structured vehicle listing and keep quotes, viewings, and admin review in one place.",
    url: absoluteSiteUrl("/sell-my-car"),
    siteName: "BiSell AutoIQ",
    type: "website",
  },
};

export default async function SellMyCarPage() {
  const meResult = await getOptionalSessionJson<MeResponse>(ROUTES.me.profile);
  const signedIn = meResult !== null && meResult.ok;

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
      <SellCarFunnel />
      <SiteFooter />
    </>
  );
}
