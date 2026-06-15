import Link from "next/link";
import type { AdminDashboardDto, AdminListingDto } from "@auto-iq/contracts/admin";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Filter, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatPrice } from "@/lib/format";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { mapListingStatus } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function paginationHref(page: number, status: string, search: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  if (status) {
    params.set("status", status);
  }
  if (search) {
    params.set("search", search);
  }

  return `/admin/listings?${params.toString()}`;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1");
  const search = readValue(params.search);
  const status = readValue(params.status);
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

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline">Admin listings queue</Badge>
            <h1 className="display mt-4 text-4xl text-[var(--ink-900)]">Moderation queue</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
              Review submitted listings, request changes, or publish from the real admin queue endpoint.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Pending review</p>
              <p className="display mt-3 text-3xl text-[var(--ink-900)]">{dashboard.queues.pendingReview}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Changes requested</p>
              <p className="display mt-3 text-3xl text-[var(--ink-900)]">{dashboard.queues.changesRequested}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Inspection pending</p>
              <p className="display mt-3 text-3xl text-[var(--ink-900)]">{dashboard.queues.inspectionPending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Ready to publish</p>
              <p className="display mt-3 text-3xl text-[var(--ink-900)]">{dashboard.queues.readyToPublish}</p>
            </CardContent>
          </Card>
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
                <Link href={`/admin/listings/${item.id}`} className={buttonVariants({ variant: "ghost" })}>
                  Open review
                </Link>
              </CardContent>
            </Card>
          )) : (
            <EmptyState
              icon={Search}
              headline="No listings in this slice"
              body="The queue endpoint is live, but no listings matched the current status and search filters."
            />
          )}
        </div>

        <div className="flex items-center justify-between rounded-[1.5rem] border border-[var(--ink-100)] bg-white px-5 py-4">
          <p className="text-sm text-[var(--ink-500)]">
            Page <span className="font-semibold text-[var(--ink-900)]">{queue.meta.page}</span> of{" "}
            <span className="font-semibold text-[var(--ink-900)]">{queue.meta.totalPages}</span>
          </p>
          <div className="flex gap-3">
            <Link
              href={paginationHref(Math.max(1, queue.meta.page - 1), status, search)}
              className={buttonVariants({ variant: "outline" })}
              aria-disabled={queue.meta.page <= 1}
            >
              Previous
            </Link>
            <Link
              href={paginationHref(Math.min(queue.meta.totalPages, queue.meta.page + 1), status, search)}
              className={buttonVariants({ variant: "outline" })}
              aria-disabled={queue.meta.page >= queue.meta.totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
