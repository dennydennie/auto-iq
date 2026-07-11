import type {
  UrgencyLevel,
  VehicleRequestStatus,
} from "@auto-iq/contracts/enums";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { VehicleRequestDto } from "@auto-iq/contracts/vehicle-requests";
import { SearchCheck } from "lucide-react";
import { AdminVehicleRequestActions } from "@/components/admin/admin-vehicle-request-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const STATUSES: VehicleRequestStatus[] = [
  "NEW",
  "ACKNOWLEDGED",
  "SOURCING",
  "MATCH_FOUND",
  "NO_MATCH",
  "CANCELLED",
];
const URGENCIES: UrgencyLevel[] = ["ASAP", "ONE_MONTH", "BROWSING"];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const status = readValue(params.status);
  const urgency = readValue(params.urgency);
  const result = await getSessionJson<
    OffsetPaginatedResponse<VehicleRequestDto>
  >(
    withQuery(ROUTES.admin.vehicleRequests, {
      page,
      limit: 12,
      status,
      urgency,
    }),
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
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Buyer sourcing"
        title="Vehicle requests"
        description="Acknowledge buyer needs, track sourcing work, and attach a published match."
      />
      <form className="grid gap-3 rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {labelizeEnum(value)}
            </option>
          ))}
        </Select>
        <Select name="urgency" defaultValue={urgency}>
          <option value="">All urgency levels</option>
          {URGENCIES.map((value) => (
            <option key={value} value={value}>
              {labelizeEnum(value)}
            </option>
          ))}
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>
      {result.data.data.length === 0 ? (
        <EmptyState
          icon={SearchCheck}
          headline="No buyer requests found"
          body="No sourcing requests match the selected filters."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.data.data.map((request) => (
            <Card key={request.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="warning">
                    {labelizeEnum(request.status)}
                  </Badge>
                  <span className="text-xs text-[var(--ink-400)]">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink-900)]">
                    {request.buyerName || "Buyer"} ·{" "}
                    {formatPhone(request.buyerPhone)}
                  </p>
                  <p className="text-sm text-[var(--ink-500)]">
                    Budget {formatPrice(request.maxBudgetCents / 100, "ZWG")} ·{" "}
                    {labelizeEnum(request.urgency)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-500)]">
                    {[
                      request.makeName,
                      request.model,
                      request.yearMin && `${request.yearMin}+`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Open preferences"}
                  </p>
                </div>
                {request.notes ? (
                  <p className="rounded-xl bg-[var(--ink-50)] p-3 text-sm text-[var(--ink-500)]">
                    {request.notes}
                  </p>
                ) : null}
                <AdminVehicleRequestActions request={request} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PaginationFooter
        page={result.data.meta.page}
        totalPages={result.data.meta.totalPages}
        limit={result.data.meta.limit}
        total={result.data.meta.total}
        buildHref={(nextPage) => requestsHref(nextPage, status, urgency)}
      />
    </main>
  );
}

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function requestsHref(page: number, status: string, urgency: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status) params.set("status", status);
  if (urgency) params.set("urgency", urgency);
  return params.size ? `/admin/requests?${params}` : "/admin/requests";
}
