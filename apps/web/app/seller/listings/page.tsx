import Link from "next/link";
import type { BodyType, ListingStatus } from "@auto-iq/contracts/enums";
import type { SellerListingSummaryDto } from "@auto-iq/contracts/listings";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Filter, Plus } from "lucide-react";
import { SellerListingCard } from "@/components/listing/seller-listing-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FilterChips, type FilterChip } from "@/components/shared/filter-chips";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  CHANGES_REQUESTED: "Changes requested",
  INSPECTION_PENDING: "Inspection pending",
  OWNERSHIP_VERIFICATION_PENDING: "Ownership pending",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  RESERVED: "Reserved",
  SOLD: "Sold",
  REJECTED: "Rejected",
  DELISTED: "Delisted",
};

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function listingsQuery(filters: { page: number; status: string }) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

function listingsHref(
  overrides: Partial<{ page: number; status: string }>,
  current: { page: number; status: string },
) {
  const query = listingsQuery({ ...current, ...overrides });
  return query ? `/seller/listings?${query}` : "/seller/listings";
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

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const status = readValue(params.status);
  const currentFilters = { page, status };
  const result = await getSessionJson<OffsetPaginatedResponse<SellerListingSummaryDto>>(
    withQuery(ROUTES.listings.list, {
      page,
      limit: 12,
      status,
    }),
  );

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={Plus}
            headline="Sign in as a seller"
            body="Use a seller account to view your listings."
            cta={{ label: "Go to login", href: "/auth/login" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const listings = result.data;
  const chips: FilterChip[] = [];
  if (status) {
    chips.push({
      label: `Status: ${STATUS_LABELS[status] ?? status}`,
      removeHref: listingsHref({ status: "", page: 1 }, currentFilters),
    });
  }

  const returnQuery = listingsQuery(currentFilters);
  const buildDetailHref = (id: string) =>
    returnQuery
      ? `/seller/listings/${id}?return=${encodeURIComponent(`/seller/listings?${returnQuery}`)}`
      : `/seller/listings/${id}`;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="All listings"
        title="Your listings"
        description="Drafts, submitted listings, and live published vehicles."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Seller dashboard", href: "/seller" },
              { label: "All listings" },
            ]}
          />
        }
        actions={
          <Link href="/seller/listings/new" className={buttonVariants({ variant: "amber", size: "sm" })}>
            <Plus className="h-4 w-4" />
            New listing
          </Link>
        }
      />

      <form className="mt-8 grid gap-3 rounded-[1.6rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 md:grid-cols-[14rem_auto]">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-white px-3">
          <Filter className="h-4 w-4 text-[var(--ink-400)]" />
          <Select
            name="status"
            defaultValue={status}
            className="border-0 bg-transparent px-0 shadow-none focus:ring-0"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>

      <div className="mt-4">
        <FilterChips chips={chips} clearAllHref="/seller/listings" />
      </div>

      <div className="mt-6 space-y-4">
        {listings.data.length > 0 ? listings.data.map((listing) => (
          <SellerListingCard
            key={listing.id}
            href={buildDetailHref(listing.id)}
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
        )) : (
          <EmptyState
            icon={Plus}
            headline={chips.length > 0 ? "No listings match this filter" : "No listings yet"}
            body={
              chips.length > 0
                ? "Try removing the status filter to see every listing."
                : "Create your first listing to start your seller workspace."
            }
            cta={
              chips.length > 0
                ? { label: "Clear filters", href: "/seller/listings" }
                : { label: "Create a listing", href: "/seller/listings/new" }
            }
          />
        )}
      </div>

      <div className="mt-8">
        <PaginationFooter
          page={listings.meta.page}
          totalPages={listings.meta.totalPages}
          limit={listings.meta.limit}
          total={listings.meta.total}
          buildHref={(targetPage) => listingsHref({ page: targetPage }, currentFilters)}
        />
      </div>
    </main>
  );
}
