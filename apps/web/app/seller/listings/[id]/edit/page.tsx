import Link from "next/link";
import type { SellerListingDto } from "@auto-iq/contracts/listings";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import { CreateListingForm } from "@/components/seller/create-listing-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { FileText } from "lucide-react";

export default async function SellerListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listingResult, referenceDataResult] = await Promise.all([
    getSessionJson<SellerListingDto>(ROUTES.listings.detail(id)),
    getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all),
  ]);

  if (isServerApiFailure(listingResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {listingResult.error.statusCode === 401 || listingResult.error.statusCode === 403 ? (
          <EmptyState
            icon={FileText}
            headline="Seller sign-in required"
            body="Sign in with the seller account that owns this listing before editing it."
            cta={{ label: "Go to login", href: "/auth/login" }}
          />
        ) : (
          <ErrorBanner message={listingResult.error.message} correlationId={listingResult.error.correlationId} />
        )}
      </main>
    );
  }

  if (isServerApiFailure(referenceDataResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner
          message={referenceDataResult.error.message}
          correlationId={referenceDataResult.error.correlationId}
        />
      </main>
    );
  }

  const title = `${listingResult.data.specs.year} ${listingResult.data.specs.make} ${listingResult.data.specs.model}`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="space-y-6 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:p-8">
        <div className="space-y-3">
          <Link href={`/seller/listings/${listingResult.data.id}`} className={buttonVariants({ variant: "ghost", className: "px-0" })}>
            Back to listing
          </Link>
          <Badge variant="outline">Edit listing</Badge>
          <h1 className="display text-4xl text-[var(--ink-900)]">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
            Update vehicle details, taxonomy, location coordinates, condition, and pricing.
          </p>
        </div>
        <CreateListingForm
          initialListing={listingResult.data}
          mode="edit"
          referenceData={referenceDataResult.data}
        />
      </div>
    </main>
  );
}
