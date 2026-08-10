import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shared/site-header";

const LINKS = [
  { href: "/seller", messageKey: "nav.workspace" as const },
  { href: "/seller/listings", messageKey: "nav.allListings" as const },
  { href: "/seller/listings/new", messageKey: "nav.newListing" as const },
  { href: "/seller/viewings", messageKey: "nav.viewings" as const },
  { href: "/vehicles", messageKey: "nav.buyerView" as const },
];

// Seller routes are session-gated at the page level (each fetch returns 401
// which redirects to /auth/login). By the time this layout renders content,
// we can safely show the signed-in header treatment.
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader links={LINKS} homeHref="/seller" signedIn />
      {children}
    </>
  );
}
