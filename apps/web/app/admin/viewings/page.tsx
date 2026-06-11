import Link from "next/link";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { CalendarClock, MapPinned, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { viewingStatusTone } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function participants(viewing: ViewingDto) {
  return viewing.participants.map((participant) => participant.name).join(" · ");
}

function slotLabel(viewing: ViewingDto) {
  return formatDate(viewing.confirmedSlot || viewing.preferredSlot);
}

function paginationHref(page: number, status: string, date: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  if (status) {
    params.set("status", status);
  }
  if (date) {
    params.set("date", date);
  }

  return `/admin/viewings?${params.toString()}`;
}

export default async function AdminViewingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1");
  const date = readValue(params.date);
  const status = readValue(params.status);
  const result = await getSessionJson<OffsetPaginatedResponse<ViewingDto>>(
    withQuery(ROUTES.admin.viewings, {
      page,
      limit: 12,
      date,
      status,
    }),
  );

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={CalendarClock}
            headline="Admin sign-in required"
            body="The viewing scheduler is now pulling directly from the admin viewings endpoint."
            cta={{ label: "Go to admin login", href: "/admin/login" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const viewings = result.data;
  const confirmedCount = viewings.data.filter((item) => item.status === "CONFIRMED").length;
  const requestedCount = viewings.data.filter((item) => item.status === "REQUESTED").length;
  const rescheduledCount = viewings.data.filter((item) => item.status === "RESCHEDULED").length;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Badge variant="outline">Viewing operations</Badge>
      <h1 className="display mt-4 text-4xl text-[var(--ink-900)]">Viewing scheduler</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
        This page is now backed by the real admin viewing list endpoint and reflects saved appointments instead of mock slots.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Confirmed</p>
            <p className="display mt-3 text-3xl text-[var(--ink-900)]">{confirmedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Requested</p>
            <p className="display mt-3 text-3xl text-[var(--ink-900)]">{requestedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Rescheduled</p>
            <p className="display mt-3 text-3xl text-[var(--ink-900)]">{rescheduledCount}</p>
          </CardContent>
        </Card>
      </div>

      <form className="mt-6 grid gap-3 rounded-[1.6rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 md:grid-cols-[14rem_12rem_auto]">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-white px-3">
          <Search className="h-4 w-4 text-[var(--ink-400)]" />
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="h-11 w-full bg-transparent text-sm text-[var(--ink-900)] outline-none"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="flex h-11 rounded-xl border border-[var(--ink-200)] bg-white px-3.5 text-sm text-[var(--ink-900)] outline-none transition focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[#FFC72C]/35"
        >
          <option value="">All statuses</option>
          <option value="REQUESTED">Requested</option>
          <option value="PENDING_SELLER_CONFIRMATION">Pending seller</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RESCHEDULED">Rescheduled</option>
        </select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {viewings.data.length > 0 ? viewings.data.map((event) => (
          <Card key={event.id}>
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
        )) : (
          <div className="lg:col-span-3">
            <EmptyState
              icon={CalendarClock}
              headline="No viewings matched this filter"
              body="The viewings endpoint is live, but there are no appointments in the current slice."
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-[1.5rem] border border-[var(--ink-100)] bg-white px-5 py-4">
        <p className="text-sm text-[var(--ink-500)]">
          Page <span className="font-semibold text-[var(--ink-900)]">{viewings.meta.page}</span> of{" "}
          <span className="font-semibold text-[var(--ink-900)]">{viewings.meta.totalPages}</span>
        </p>
        <div className="flex gap-3">
          <Link
            href={paginationHref(Math.max(1, viewings.meta.page - 1), status, date)}
            className={buttonVariants({ variant: "outline" })}
            aria-disabled={viewings.meta.page <= 1}
          >
            Previous
          </Link>
          <Link
            href={paginationHref(Math.min(viewings.meta.totalPages, viewings.meta.page + 1), status, date)}
            className={buttonVariants({ variant: "outline" })}
            aria-disabled={viewings.meta.page >= viewings.meta.totalPages}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}
