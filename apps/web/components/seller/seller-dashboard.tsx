import Link from "next/link";
import { Calendar, Eye, MessageSquare, Plus } from "lucide-react";
import type { BodyType, ListingStatus } from "@auto-iq/contracts/enums";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { SellerListingSummaryDto } from "@auto-iq/contracts/listings";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { SellerListingCard } from "@/components/listing/seller-listing-card";

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "Seller";
}

function mapStatus(status: ListingStatus): Parameters<typeof SellerListingCard>[0]["status"] {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "CHANGES_REQUESTED":
      return "changes";
    case "SUBMITTED":
    case "INSPECTION_PENDING":
    case "OWNERSHIP_VERIFICATION_PENDING":
    case "APPROVED":
      return "inspection";
    case "RESERVED":
      return "reserved";
    case "SOLD":
      return "sold";
    case "REJECTED":
      return "rejected";
    case "DELISTED":
      return "delisted";
    case "DRAFT":
    default:
      return "draft";
  }
}

function mapBodyType(bodyType: BodyType): Parameters<typeof SellerListingCard>[0]["bodyType"] {
  switch (bodyType) {
    case "BAKKIE":
      return "bakkie";
    case "SUV":
      return "suv";
    case "HATCH":
      return "hatch";
    default:
      return "sedan";
  }
}

function sumBy(listings: SellerListingSummaryDto[], key: "viewCount" | "viewingCount" | "quoteCount") {
  return listings.reduce((total, listing) => total + listing[key], 0);
}

export function SellerDashboard({
  profile,
  listings,
}: {
  profile: MeResponse;
  listings: SellerListingSummaryDto[];
}) {
  const metrics = [
    { label: "Views", value: sumBy(listings, "viewCount"), icon: Eye },
    { label: "Viewings", value: sumBy(listings, "viewingCount"), icon: Calendar },
    { label: "Quotes", value: sumBy(listings, "quoteCount"), icon: MessageSquare },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Seller workspace"
        title={`Hey, ${firstName(profile.fullName)}`}
        description="Track listing activity, buyer interest, and review progress."
        actions={
          <Link
            href="/seller/listings/new"
            className={buttonVariants({ variant: "amber", size: "sm" })}
          >
            <Plus className="h-4 w-4" />
            Add vehicle
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map(({ label, value, icon }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            period="Across all listings"
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-3xl text-[var(--ink-900)]">Recent listings</h2>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Your most recent records. Filter and search every listing on the dedicated list page.
            </p>
          </div>
          <div className="flex gap-2">
            {listings.length > 0 ? (
              <Link href="/seller/listings" className={buttonVariants({ variant: "outline" })}>
                View all listings
              </Link>
            ) : null}
            <Link href="/seller/listings/new" className={buttonVariants({ variant: "outline" })}>
              Create new listing
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Plus}
            headline="No live listings yet"
            body="Create your first draft listing to start building your seller workspace."
            cta={{ label: "Create a listing", href: "/seller/listings/new" }}
          />
        ) : (
          listings.slice(0, 5).map((listing) => (
            <SellerListingCard
              key={listing.id}
              href={`/seller/listings/${listing.id}`}
              id={listing.id}
              year={listing.year}
              make={listing.make}
              model={listing.model}
              price={listing.askPriceUsd}
              status={mapStatus(listing.status)}
              bodyType={mapBodyType(listing.bodyType)}
              views={listing.viewCount}
              viewings={listing.viewingCount}
              quotes={listing.quoteCount}
              note={listing.changesNote}
            />
          ))
        )}

        {listings.length > 5 ? (
          <div className="flex justify-center">
            <Link href="/seller/listings" className={buttonVariants({ variant: "outline" })}>
              See all {listings.length} listings
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
