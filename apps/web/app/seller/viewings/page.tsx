import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { CalendarClock, MapPinned } from "lucide-react";
import { SellerViewingAction } from "@/components/seller/seller-viewing-action";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum, viewingStatusTone } from "@/lib/vehicle-ui";

export default async function SellerViewingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Number((await searchParams).page ?? "1") || 1;
  const result = await getSessionJson<OffsetPaginatedResponse<ViewingDto>>(
    withQuery(ROUTES.viewings.sellerList, { page, limit: 12 }),
  );
  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBanner
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Seller workspace"
        title="Viewing requests"
        description="Review buyer appointment requests for your listings and acknowledge availability."
      />
      {result.data.data.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          headline="No viewing requests"
          body="Buyer appointment requests for your listings are shown on this page."
        />
      ) : (
        <div className="space-y-4">
          {result.data.data.map((viewing) => (
            <Card key={viewing.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={viewingStatusTone(viewing.status)}>
                      {labelizeEnum(viewing.status)}
                    </Badge>
                    <span className="text-xs text-[var(--ink-400)]">
                      {formatDate(
                        viewing.confirmedSlot ?? viewing.preferredSlot,
                      )}
                    </span>
                  </div>
                  <p className="font-semibold text-[var(--ink-900)]">
                    {viewing.listingSnapshot.year}{" "}
                    {viewing.listingSnapshot.make}{" "}
                    {viewing.listingSnapshot.model}
                  </p>
                  <p className="text-sm text-[var(--ink-500)]">
                    Buyer: {viewing.buyerName}
                  </p>
                  {viewing.location ? (
                    <p className="inline-flex items-center gap-1 text-sm text-[var(--ink-500)]">
                      <MapPinned className="h-4 w-4" />
                      {viewing.location.name}, {viewing.location.city}
                    </p>
                  ) : null}
                </div>
                <SellerViewingAction viewing={viewing} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {result.data.data.length > 0 ? (
        <PaginationFooter
          page={result.data.meta.page}
          totalPages={result.data.meta.totalPages}
          limit={result.data.meta.limit}
          total={result.data.meta.total}
          buildHref={(nextPage) =>
            nextPage > 1
              ? `/seller/viewings?page=${nextPage}`
              : "/seller/viewings"
          }
        />
      ) : null}
    </main>
  );
}
