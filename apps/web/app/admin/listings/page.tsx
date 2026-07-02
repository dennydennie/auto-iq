import Link from "next/link";
import type { AdminDashboardDto, AdminListingDto } from "@auto-iq/contracts/admin";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Filter, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FilterChips, type FilterChip } from "@/components/shared/filter-chips";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate, formatPrice } from "@/lib/format";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { mapListingStatus } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  PUBLISHED: "Published",
};

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function listingsQuery(filters: { page: number; status: string; search: string }) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

function listingsHref(
  overrides: Partial<{ page: number; status: string; search: string }>,
  current: { page: number; status: string; search: string },
) {
  const query = listingsQuery({ ...current, ...overrides });
  return query ? `/admin/listings?${query}` : "/admin/listings";
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const search = readValue(params.search);
  const status = readValue(params.status);
  const currentFilters = { page, status, search };
  const [dashboardResult, queueResult] = await Promise.all([
    getSessionJson<AdminDashboardDto>(ROUTES.admin.dashboard),
    getSessionJson<OffsetPaginatedResponse<AdminListingDto>>(
      withQuery(ROUTES.admin.listings, {
        page,
        limit: 12,
        status,
        search,
      }),
    ),
  ]);

  if (isServerApiFailure(dashboardResult)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner message={dashboardResult.error.message} correlationId={dashboardResult.error.correlationId} />
      </main>
    );
  }

  if (isServerApiFailure(queueResult)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {queueResult.error.statusCode === 401 || queueResult.error.statusCode === 403 ? (
          <EmptyState
            icon={Search}
            headline="Admin sign-in required"
            body="The moderation queue is wired to the real admin listings endpoint and requires an active admin session."
            cta={{ label: "Go to admin login", href: "/admin/login" }}
          />
        ) : (
          <ErrorBanner message={queueResult.error.message} correlationId={queueResult.error.correlationId} />
        )}
      </main>
    );
  }

  const queue = queueResult.data;
  const dashboard = dashboardResult.data;
  const returnQuery = listingsQuery(currentFilters);
  const buildDetailHref = (id: string) =>
    returnQuery
      ? `/admin/listings/${id}?return=${encodeURIComponent(`/admin/listings?${returnQuery}`)}`
      : `/admin/listings/${id}`;

  const chips: FilterChip[] = [];
  if (status) {
    chips.push({
      label: `Status: ${STATUS_LABELS[status] ?? status}`,
      removeHref: listingsHref({ status: "", page: 1 }, currentFilters),
    });
  }
  if (search) {
    chips.push({
      label: `Search: ${search}`,
      removeHref: listingsHref({ search: "", page: 1 }, currentFilters),
    });
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Admin listings queue"
        title="Moderation queue"
        description="Review submitted listings, request changes, or publish."
      />

      <div className="space-y-6">
        {/* Trend deltas not yet exposed by /admin/dashboard. Add `trend` props when the API ships period diffs. */}
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Pending review" value={dashboard.queues.pendingReview} period="Live count" />
          <StatCard label="Changes requested" value={dashboard.queues.changesRequested} period="Live count" />
          <StatCard label="Inspection pending" value={dashboard.queues.inspectionPending} period="Live count" />
          <StatCard label="Ready to publish" value={dashboard.queues.readyToPublish} period="Live count" />
        </div>

        <form className="grid gap-3 rounded-[1.6rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 md:grid-cols-[1fr_14rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
            <Input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search slug, make, or model"
              className="border-transparent pl-11 shadow-none focus:border-[var(--ink-900)]"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-white px-3">
            <Filter className="h-4 w-4 text-[var(--ink-400)]" />
            <Select
              name="status"
              defaultValue={status}
              className="border-0 bg-transparent px-0 shadow-none focus:ring-0"
            >
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="CHANGES_REQUESTED">Changes requested</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </div>
          <button className={buttonVariants({ variant: "amber" })}>Apply</button>
        </form>

        <FilterChips chips={chips} clearAllHref="/admin/listings" />

        <div className="space-y-4">
          {queue.data.length > 0 ? queue.data.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>
                      {item.specs.year} {item.specs.make} {item.specs.model}
                    </CardTitle>
                    <p className="mt-2 text-sm text-[var(--ink-500)]">
                      {item.id} · {item.slug} · {formatPrice(item.pricing.askPriceUsd, "USD")}
                    </p>
                  </div>
                  <Badge variant={item.status === "PUBLISHED" ? "success" : item.status === "SUBMITTED" ? "warning" : "outline"}>
                    {mapListingStatus(item.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm leading-6 text-[var(--ink-500)]">
                  <p>
                    {item.sellerDisclosure || item.changesNote || "No public disclosure or admin change note recorded yet."}
                  </p>
                  <p>
                    Submitted {item.submittedAt ? formatDate(item.submittedAt) : "not yet"} · Published{" "}
                    {item.publishedAt ? formatDate(item.publishedAt) : "not yet"}
                  </p>
                </div>
                <Link href={buildDetailHref(item.id)} className={buttonVariants({ variant: "ghost" })}>
                  Open review
                </Link>
              </CardContent>
            </Card>
          )) : (
            <EmptyState
              icon={Search}
              headline={chips.length > 0 ? "No listings match these filters" : "No listings in the moderation queue"}
              body={
                chips.length > 0
                  ? "Try removing one of the active filters to broaden the queue view."
                  : "There are no submitted listings to review right now. Newly submitted listings will appear here."
              }
              cta={chips.length > 0 ? { label: "Clear filters", href: "/admin/listings" } : undefined}
            />
          )}
        </div>

        <PaginationFooter
          page={queue.meta.page}
          totalPages={queue.meta.totalPages}
          limit={queue.meta.limit}
          total={queue.meta.total}
          buildHref={(targetPage) => listingsHref({ page: targetPage }, currentFilters)}
        />
      </div>
    </main>
  );
}
