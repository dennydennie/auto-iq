import type { ReactNode } from "react";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { SiteHeader } from "@/components/shared/site-header";
import { getOptionalSessionJson } from "@/lib/server-api";

const GUEST_LINKS = [
  { href: "/vehicles", label: "Browse" },
  { href: "/about", label: "About" },
];

const AUTHED_LINKS = [
  { href: "/vehicles", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/quotes", label: "Quotes" },
  { href: "/viewings", label: "Viewings" },
  { href: "/seller", label: "Sell" },
];

export default async function MarketplaceLayout({ children }: { children: ReactNode }) {
  const me = await getOptionalSessionJson<MeResponse>(ROUTES.me.profile);
  const signedIn = me !== null && me.ok;

  return (
    <>
      <SiteHeader
        links={signedIn ? AUTHED_LINKS : GUEST_LINKS}
        homeHref="/vehicles"
        primaryCta={signedIn ? undefined : { href: "/auth/login", label: "Sign in" }}
        signedIn={signedIn}
      />
      {children}
    </>
  );
}
