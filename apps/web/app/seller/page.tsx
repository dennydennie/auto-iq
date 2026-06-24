import type { MeResponse } from "@auto-iq/contracts/identity";
import type { SellerListingSummaryDto } from "@auto-iq/contracts/listings";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Plus } from "lucide-react";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function SellerPage() {
  const [profileResult, listingsResult] = await Promise.all([
    getSessionJson<MeResponse>(ROUTES.me.profile),
    getSessionJson<OffsetPaginatedResponse<SellerListingSummaryDto>>(ROUTES.listings.list),
  ]);

  if (isServerApiFailure(profileResult)) {
    if (profileResult.error.statusCode === 401 || profileResult.error.statusCode === 403) {
      return (
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={Plus}
            headline="Sign in as a seller"
            body="Use a seller account to manage drafts, submitted listings, and buyer activity."
            cta={{ label: "Go to login", href: "/auth/login" }}
          />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner message={profileResult.error.message} correlationId={profileResult.error.correlationId} />
      </main>
    );
  }

  if (isServerApiFailure(listingsResult)) {
    if (listingsResult.error.statusCode === 401 || listingsResult.error.statusCode === 403) {
      return (
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <EmptyState
            icon={Plus}
            headline="Sign in as a seller"
            body="Use a seller account to manage drafts, submitted listings, and buyer activity."
            cta={{ label: "Go to login", href: "/auth/login" }}
          />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner message={listingsResult.error.message} correlationId={listingsResult.error.correlationId} />
      </main>
    );
  }

  return <SellerDashboard profile={profileResult.data} listings={listingsResult.data.data} />;
}
