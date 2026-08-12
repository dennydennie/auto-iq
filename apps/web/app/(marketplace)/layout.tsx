import type { ReactNode } from "react";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { getOptionalSessionJson } from "@/lib/server-api";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";

const AUTHED_LINKS = [
  { href: "/vehicles", messageKey: "nav.browseVehicles" as const },
  { href: "/saved", messageKey: "nav.saved" as const },
  { href: "/quotes", messageKey: "nav.quotes" as const },
  { href: "/requests", messageKey: "nav.requests" as const },
  { href: "/viewings", messageKey: "nav.viewings" as const },
  { href: "/account", messageKey: "nav.account" as const },
  { href: "/seller", messageKey: "nav.sell" as const },
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
        links={signedIn ? AUTHED_LINKS : PUBLIC_SITE_LINKS}
        homeHref={signedIn ? "/vehicles" : "/"}
        primaryCta={
          signedIn
            ? undefined
            : { href: "/auth/login", messageKey: "auth.signIn" }
        }
        signedIn={signedIn}
      />
      {children}
      {signedIn ? null : <SiteFooter />}
    </>
  );
}
