import type { ReactNode } from "react";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketplaceHeader activeHref="/seller" />
      {children}
    </>
  );
}
