import type { Metadata } from "next";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { SellCarFunnel } from "@/components/marketing/sell-car-funnel";
import { SiteHeader } from "@/components/shared/site-header";
import { getOptionalSessionJson } from "@/lib/server-api";
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
        links={links}
        homeHref="/"
        primaryCta={
          signedIn ? undefined : { href: "/auth/login", label: "Sign in" }
        }
        signedIn={signedIn}
        variant="underline"
      />
      <SellCarFunnel />
    </>
  );
}
