import Link from "next/link";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { CalendarClock, MapPinned, Search, Users } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { viewingStatusTone } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  PENDING_SELLER_CONFIRMATION: "Pending seller",
  CONFIRMED: "Confirmed",
  RESCHEDULED: "Rescheduled",
};

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function viewingsQuery(filters: { page: number; status: string; date: string; search: string }) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.status) params.set("status", filters.status);
  if (filters.date) params.set("date", filters.date);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

function viewingsHref(
  overrides: Partial<{ page: number; status: string; date: string; search: string }>,
  current: { page: number; status: string; date: string; search: string },
) {
  const query = viewingsQuery({ ...current, ...overrides });
  return query ? `/admin/viewings?${query}` : "/admin/viewings";
}

function participants(viewing: ViewingDto) {
  return viewing.participants.map((participant) => participant.name).join(" · ");
}

function slotLabel(viewing: ViewingDto) {
  return formatDate(viewing.confirmedSlot || viewing.preferredSlot);
}

export default async function AdminViewingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const date = readValue(params.date);
  const status = readValue(params.status);
  const search = readValue(params.search);
  const currentFilters = { page, status, date, search };
  const result = await getSessionJson<OffsetPaginatedResponse<ViewingDto>>(
    withQuery(ROUTES.admin.viewings, {
      page,
      limit: 12,
      date,
      status,
      search,
    }),
  );

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={CalendarClock}
            headline="Admin sign-in required"
            body="Sign in with an admin account to review and coordinate scheduled viewings."
            cta={{ label: "Go to admin login", href: "/admin/login" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const viewings = result.data;
  const returnQuery = viewingsQuery(currentFilters);
  const buildDetailHref = (id: string) =>
    returnQuery
      ? `/admin/viewings/${id}?return=${encodeURIComponent(`/admin/viewings?${returnQuery}`)}`
      : `/admin/viewings/${id}`;
  const confirmedCount = viewings.data.filter((item) => item.status === "CONFIRMED").length;
  const requestedCount = viewings.data.filter((item) => item.status === "REQUESTED").length;
  const rescheduledCount = viewings.data.filter((item) => item.status === "RESCHEDULED").length;

  const chips: FilterChip[] = [];
  if (status) {
    chips.push({
      label: `Status: ${STATUS_LABELS[status] ?? status}`,
      removeHref: viewingsHref({ status: "", page: 1 }, currentFilters),
    });
  }
  if (date) {
    chips.push({
      label: `Date: ${date}`,
      removeHref: viewingsHref({ date: "", page: 1 }, currentFilters),
    });
  }
  if (search) {
    chips.push({
      label: `Search: ${search}`,
      removeHref: viewingsHref({ search: "", page: 1 }, currentFilters),
    });
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Viewing operations"
        title="Viewing scheduler"
        description="Coordinate buyer appointments, seller confirmations, and location readiness."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Confirmed" value={confirmedCount} period="Current page" />
        <StatCard label="Requested" value={requestedCount} period="Current page" />
        <StatCard label="Rescheduled" value={rescheduledCount} period="Current page" />
      </div>

      <form className="mt-6 grid gap-3 rounded-[1.6rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 md:grid-cols-[1fr_14rem_12rem_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
          <Input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search buyer, make, or model"
            className="border-transparent pl-11 shadow-none focus:border-[var(--ink-900)]"
          />
        </div>
        <Input
          type="date"
          name="date"
          defaultValue={date}
        />
        <Select
          name="status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          <option value="REQUESTED">Requested</option>
          <option value="PENDING_SELLER_CONFIRMATION">Pending seller</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RESCHEDULED">Rescheduled</option>
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>

      <div className="mt-4">
        <FilterChips chips={chips} clearAllHref="/admin/viewings" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {viewings.data.length > 0 ? viewings.data.map((event) => (
          <Link
            key={event.id}
            href={buildDetailHref(event.id)}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] rounded-[1.5rem]"
          >
            <Card className="transition hover:shadow-[0_24px_60px_-30px_rgba(22,31,58,0.35)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={viewingStatusTone(event.status)}>
                    {event.status}
                  </Badge>
                  <span className="text-right text-sm font-semibold text-[var(--ink-500)]">{slotLabel(event)}</span>
                </div>
                <CardTitle className="mt-3">
                  {event.listingSnapshot.year} {event.listingSnapshot.make} {event.listingSnapshot.model}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--ink-500)]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--amber-dark)]" />
                  {participants(event)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-[var(--amber-dark)]" />
                  {event.location ? `${event.location.name}, ${event.location.city}` : "Location pending"}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-[var(--amber-dark)]" />
                  Buyer: {event.buyerName}
                </div>
              </CardContent>
            </Card>
          </Link>
        )) : (
          <div className="lg:col-span-3">
            <EmptyState
              icon={CalendarClock}
              headline={chips.length > 0 ? "No viewings match these filters" : "No scheduled viewings"}
              body={
                chips.length > 0
                  ? "Try removing one of the active filters to widen the search."
                  : "Confirmed and pending viewings show up here once buyers request slots."
              }
              cta={chips.length > 0 ? { label: "Clear filters", href: "/admin/viewings" } : undefined}
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <PaginationFooter
          page={viewings.meta.page}
          totalPages={viewings.meta.totalPages}
          limit={viewings.meta.limit}
          total={viewings.meta.total}
          buildHref={(targetPage) => viewingsHref({ page: targetPage }, currentFilters)}
        />
      </div>
    </main>
  );
}
