import type { ReactNode } from "react";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { SiteHeader } from "@/components/shared/site-header";
import { getOptionalSessionJson } from "@/lib/server-api";

const GUEST_LINKS = [
  { href: "/buy-a-car", label: "Buy a car" },
  { href: "/sell-my-car", label: "Sell my car" },
  { href: "/vehicles", label: "Browse" },
];

const AUTHED_LINKS = [
  { href: "/vehicles", label: "Buy a car" },
  { href: "/saved", label: "Saved" },
  { href: "/quotes", label: "Quotes" },
  { href: "/requests", label: "Requests" },
  { href: "/viewings", label: "Viewings" },
  { href: "/seller", label: "Sell my car" },
];

export default async function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const me = await getOptionalSessionJson<MeResponse>(ROUTES.me.profile);
  const signedIn = me !== null && me.ok;

  return (
    <>
      <SiteHeader
        links={signedIn ? AUTHED_LINKS : GUEST_LINKS}
        homeHref={signedIn ? "/vehicles" : "/"}
        primaryCta={
          signedIn ? undefined : { href: "/auth/login", label: "Sign in" }
        }
        signedIn={signedIn}
      />
      {children}
    </>
  );
}
