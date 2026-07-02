import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shared/site-header";

const LINKS = [
  { href: "/seller", label: "Workspace" },
  { href: "/seller/listings", label: "All listings" },
  { href: "/seller/listings/new", label: "New listing" },
  { href: "/vehicles", label: "Browse buyers' view" },
];

// Seller routes are session-gated at the page level (each fetch returns 401
// which redirects to /auth/login). By the time this layout renders content,
// we can safely show the signed-in header treatment.
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader
        links={LINKS}
        homeHref="/seller"
        signedIn
      />
      {children}
    </>
  );
}
