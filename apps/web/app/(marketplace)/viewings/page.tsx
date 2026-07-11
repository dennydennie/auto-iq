import Link from "next/link";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { ArrowRight, CalendarClock, MapPinned } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { viewingStatusTone } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function viewingsHref(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/viewings?${query}` : "/viewings";
}

function slotLabel(viewing: ViewingDto) {
  return formatDate(viewing.confirmedSlot || viewing.preferredSlot);
}

export default async function BuyerViewingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const result = await getSessionJson<OffsetPaginatedResponse<ViewingDto>>(
    withQuery(ROUTES.viewings.buyerList, { page, limit: 12 }),
  );

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={CalendarClock}
            headline="Sign in to see your viewings"
            body="Viewing requests you send appear here with their scheduled slot and status."
            cta={{ label: "Go to login", href: "/auth/login?next=/viewings" }}
          />
        ) : (
          <ErrorBanner
            message={result.error.message}
            correlationId={result.error.correlationId}
          />
        )}
      </main>
    );
  }

  const viewings = result.data;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Buyer workspace"
        title="Your viewings"
        description="Requested and confirmed viewings — plus their status and location."
      />

      {viewings.data.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          headline="No viewings requested"
          body="Open a vehicle detail page and request a viewing at a BiSell-approved location."
          cta={{ label: "Browse catalogue", href: "/vehicles" }}
        />
      ) : (
        <div className="space-y-4">
          {viewings.data.map((viewing) => (
            <Card key={viewing.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={viewingStatusTone(viewing.status)}>
                      {viewing.status}
                    </Badge>
                    <span className="text-xs text-[var(--ink-400)]">
                      Slot {slotLabel(viewing)}
                    </span>
                  </div>
                  <p className="display text-lg text-[var(--ink-900)]">
                    {viewing.listingSnapshot.year}{" "}
                    {viewing.listingSnapshot.make}{" "}
                    {viewing.listingSnapshot.model}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-500)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPinned className="h-3.5 w-3.5 text-[var(--amber-dark)]" />
                      {viewing.location
                        ? `${viewing.location.name}, ${viewing.location.city}`
                        : "Location pending confirmation"}
                    </span>
                  </div>
                  {viewing.outcomeNote ? (
                    <p className="text-xs italic text-[var(--ink-400)]">
                      {viewing.outcomeNote}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/vehicles/${viewing.listingId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View listing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewings.data.length > 0 ? (
        <PaginationFooter
          page={viewings.meta.page}
          totalPages={viewings.meta.totalPages}
          limit={viewings.meta.limit}
          total={viewings.meta.total}
          buildHref={viewingsHref}
        />
      ) : null}
    </main>
  );
}
