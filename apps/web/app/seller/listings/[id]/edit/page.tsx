import Link from "next/link";
import type { SellerListingDto } from "@auto-iq/contracts/listings";
import type { ListingStatus } from "@auto-iq/contracts/enums";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ArrowLeft, Lock } from "lucide-react";
import { DocumentUploader } from "@/components/seller/document-uploader";
import { EditListingForm } from "@/components/seller/edit-listing-form";
import { PhotoUploader } from "@/components/seller/photo-uploader";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

const EDITABLE_STATUSES: ListingStatus[] = ["DRAFT", "CHANGES_REQUESTED"];

function isEditable(status: ListingStatus) {
  return EDITABLE_STATUSES.includes(status);
}

export default async function SellerListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSessionJson<SellerListingDto>(ROUTES.listings.detail(id));

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={Lock}
            headline="Seller sign-in required"
            body="Sign in with the seller account that owns this listing to edit its details."
            cta={{ label: "Go to login", href: "/auth/login" }}
          />
        ) : result.error.statusCode === 404 ? (
          <EmptyState
            icon={Lock}
            headline="Listing not found"
            body="This listing could not be loaded. It may have been removed."
            cta={{ label: "Back to listings", href: "/seller" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const listing = result.data;
  const title = `${listing.specs.year} ${listing.specs.make} ${listing.specs.model}`;

  if (!isEditable(listing.status)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: "Seller dashboard", href: "/seller" },
            { label: title, href: `/seller/listings/${listing.id}` },
            { label: "Edit" },
          ]}
        />

        <EmptyState
          icon={Lock}
          headline="This listing is locked"
          body={`Listings with status ${labelizeEnum(
            listing.status,
          )} cannot be edited. You can still review the listing details from the seller workspace.`}
          cta={{ label: "Back to listing", href: `/seller/listings/${listing.id}` }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Edit listing"
        title={title}
        description={`Update vehicle details, condition, and pricing while the listing is in ${labelizeEnum(
          listing.status,
        )}. Changes save immediately.`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Seller dashboard", href: "/seller" },
              { label: title, href: `/seller/listings/${listing.id}` },
              { label: "Edit" },
            ]}
          />
        }
        actions={
          <Link
            href={`/seller/listings/${listing.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listing
          </Link>
        }
      />

      <EditListingForm listing={listing} />

      <PhotoUploader listingId={listing.id} images={listing.images} />

      <DocumentUploader listingId={listing.id} documents={listing.documents} />
    </main>
  );
}
